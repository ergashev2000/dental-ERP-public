import { App } from 'antd';
import dayjs from '@/shared/lib/dayjs';
import { CardSkeleton, ColorDot, EmptyState, ErrorState, UserAvatar } from '@/shared/components/ui';
import { usePermission, useCurrentUser } from '@/shared/hooks/usePermission';
import { getWorkDay, toMin } from '@/shared/utils/schedule';
import { WEEKDAYS } from '@/shared/constants/options';
import { useDoctors, type Staff } from '@/modules/staff';
import { useChairs, useClinic } from '@/modules/settings';
import { useAppointmentParam, useAppointmentsRange } from '../hooks/useAppointments';
import { useNewAppointment } from '../store/appointmentModalStore';
import type { AppointmentView } from '../types';
import { TimeGrid, type GridColumn } from './TimeGrid';

const offRanges = (s: Staff | undefined, date: string, start: number, end: number): [number, number][] => {
  if (!s) return [];
  const d = getWorkDay(s, date);
  if (!d) return [[start, end]];
  const out: [number, number][] = [
    [start, toMin(d.start)],
    [toMin(d.end), end],
  ];
  if (d.breakStart && d.breakEnd) out.push([toMin(d.breakStart), toMin(d.breakEnd)]);
  return out;
};

const useGridActions = () => {
  const { modal } = App.useApp();
  const user = useCurrentUser();
  const manageAll = usePermission('appointment.manageAll');
  const show = useNewAppointment((s) => s.show);
  const showMove = useNewAppointment((s) => s.showMove);
  const [, setOpen] = useAppointmentParam();

  const canDrag = (a: AppointmentView) => !a.masked && ['SCHEDULED', 'CONFIRMED'].includes(a.status) && (manageAll || a.doctorId === user?.staffId);

  return {
    canDrag,
    onOpen: (a: AppointmentView) => void setOpen(a.id),
    onSlotClick: (col: GridColumn, min: number) => {
      const start = dayjs(col.date).startOf('day').add(min, 'minute');
      if (start.isBefore(dayjs())) return;
      if (!manageAll && col.doctorId && col.doctorId !== user?.staffId) return;
      show({ doctorId: col.doctorId, chairId: col.chairId, start: start.toISOString() });
    },
    // Drag & drop: ko'chirishdan oldin tasdiqlash oynasi (qayta eslatma checkbox'i bilan)
    onDrop: (a: AppointmentView, col: GridColumn, min: number) => {
      const start = dayjs(col.date).startOf('day').add(min, 'minute');
      if (start.isBefore(dayjs())) {
        modal.warning({ title: 'O‘tgan vaqtga ko‘chirib bo‘lmaydi' });
        return;
      }
      showMove(a, { doctorId: col.doctorId ?? a.doctorId, chairId: col.chairId ?? a.chairId, start: start.toISOString() });
    },
  };
};

const useBounds = () => {
  const { data: clinic } = useClinic();
  return {
    clinic,
    startMin: toMin(clinic?.workStart ?? '09:00'),
    endMin: toMin(clinic?.workEnd ?? '19:00'),
    step: clinic?.slotStep ?? 15,
  };
};

/** Kun ko'rinishi: ustunlar — shifokorlar yoki kreslolar */
export const DayView = ({ date, resource, includeCancelled }: { date: string; resource: 'doctors' | 'chairs'; includeCancelled: boolean }) => {
  const { startMin, endMin, step } = useBounds();
  const { data: doctors = [] } = useDoctors();
  const { data: chairs = [] } = useChairs();
  const { data = [], isLoading, isError, error, refetch } = useAppointmentsRange(date, date, { includeCancelled });
  const actions = useGridActions();

  if (isLoading) return <CardSkeleton rows={12} />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  let columns: GridColumn[];
  if (resource === 'doctors') {
    const active = doctors.filter((d) => d.isActive && (getWorkDay(d, date) || data.some((a) => a.doctorId === d.id)));
    columns = active.map((d) => ({
      key: d.id,
      date,
      doctorId: d.id,
      title: (
        <div className="flex items-center gap-2">
          <UserAvatar name={d.fullName} color={d.color} size={32} />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-medium">{d.fullName}</div>
            <div className="text-xs text-muted">
              {d.specialty} · {data.filter((a) => a.doctorId === d.id && a.status !== 'CANCELLED').length} qabul
            </div>
          </div>
        </div>
      ),
      off: offRanges(d, date, startMin, endMin),
      items: data.filter((a) => a.doctorId === d.id),
    }));
  } else {
    columns = chairs
      .filter((c) => c.isActive)
      .map((c) => ({
        key: c.id,
        date,
        chairId: c.id,
        title: <div className="text-sm font-medium">{c.name}</div>,
        off: [],
        items: data.filter((a) => a.chairId === c.id),
      }));
  }

  if (!columns.length) return <EmptyState title="Bu kuni ishlaydigan shifokor yo‘q" description="Boshqa sanani tanlang yoki xodimlar jadvalini tekshiring" />;
  return <TimeGrid columns={columns} startMin={startMin} endMin={endMin} step={step} {...actions} />;
};

/** Hafta ko'rinishi: ustunlar — klinikaning ish kunlari; shifokor tanlanmasa — barcha shifokorlar (rangli nuqta bilan) */
export const WeekView = ({ date, doctorId, includeCancelled }: { date: string; doctorId?: string | null; includeCancelled: boolean }) => {
  const { clinic, startMin, endMin, step } = useBounds();
  const { data: doctors = [] } = useDoctors();
  const monday = dayjs(date).startOf('isoWeek');
  const from = monday.format('YYYY-MM-DD');
  const to = monday.add(6, 'day').format('YYYY-MM-DD');
  const doctor = doctors.find((d) => d.id === doctorId);
  const { data = [], isLoading, isError, error, refetch } = useAppointmentsRange(from, to, { doctor: doctorId, includeCancelled });
  const actions = useGridActions();

  if (isLoading) return <CardSkeleton rows={12} />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const days = (clinic?.workDays ?? [1, 2, 3, 4, 5, 6]).map((wd) => monday.add(wd - 1, 'day'));
  const columns: GridColumn[] = days.map((d) => {
    const ds = d.format('YYYY-MM-DD');
    const isToday = d.isSame(dayjs(), 'day');
    return {
      key: ds,
      date: ds,
      doctorId: doctorId ?? undefined,
      title: (
        <div className={isToday ? 'text-ink' : undefined}>
          <div className="text-xs text-muted">{WEEKDAYS[d.isoWeekday() - 1]?.short}</div>
          <div className="text-sm font-medium tabular-nums">{d.format('DD.MM')}</div>
        </div>
      ),
      off: doctor ? offRanges(doctor, ds, startMin, endMin) : [],
      items: data.filter((a) => dayjs(a.start).isSame(d, 'day')),
    };
  });
  const colorOf = (id: string) => doctors.find((x) => x.id === id)?.color;
  return (
    <>
      {!doctorId && (
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          {doctors
            .filter((x) => x.isActive)
            .map((x) => (
              <span key={x.id} className="inline-flex items-center gap-1.5">
                <ColorDot color={x.color} /> {x.fullName}
              </span>
            ))}
        </div>
      )}
      <TimeGrid columns={columns} startMin={startMin} endMin={endMin} step={step} doctorColorOf={doctorId ? undefined : colorOf} {...actions} />
    </>
  );
};
