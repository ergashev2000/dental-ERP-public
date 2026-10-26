import { Button, Skeleton } from 'antd';
import { ArrowRight, CalendarCheck2, CalendarClock, ShieldCheck } from '@/shared/icons';
import { useState } from 'react';
import dayjs from '@/shared/lib/dayjs';
import { EmptyState, MedicalAlert } from '@/shared/components/ui';
import { formatTime } from '@/shared/utils/format';
import {
  CompleteAppointmentModal,
  StatusActions,
  useAppointmentParam,
  useAppointmentsRange,
  type AppointmentView,
} from '@/modules/appointments';
import { useDashboardDay } from '../hooks/useDashboard';

const LABEL: Partial<Record<AppointmentView['status'], string>> = {
  IN_PROGRESS: 'Hozir kresloda',
  ARRIVED: 'Kutish zalida',
};

/** Navbatdagi bemor: avval kresloda, keyin kelgan, keyin eng yaqin rejalashtirilgan */
const pickNext = (list: AppointmentView[]) => {
  const now = dayjs();
  return (
    list.find((a) => a.status === 'IN_PROGRESS') ??
    list.find((a) => a.status === 'ARRIVED') ??
    list.find((a) => ['SCHEDULED', 'CONFIRMED'].includes(a.status) && dayjs(a.start).add(a.durationMin, 'minute').isAfter(now))
  );
};

interface Props {
  /** Faqat shu shifokor bemorlari (shifokor kuni) */
  doctorId?: string;
  /** Assistent: faqat ko'rish, amal tugmalarisiz */
  readOnly?: boolean;
}

/** Keyingi bemor — sahifadagi yagona lime hero karta: ism, xizmat, vaqt, tibbiy ogohlantirish */
export const NextPatientCard = ({ doctorId, readOnly }: Props) => {
  const today = dayjs().format('YYYY-MM-DD');
  const { data, isLoading } = useAppointmentsRange(today, today, { doctor: doctorId, includeCancelled: true });
  const { data: day } = useDashboardDay();
  const [, open] = useAppointmentParam();
  const [completeId, setCompleteId] = useState<string | null>(null);
  const a = pickNext((data ?? []).filter((x) => !x.masked));

  if (isLoading)
    return (
      <section className="rounded-card bg-surface p-5">
        <Skeleton active paragraph={{ rows: 4 }} />
      </section>
    );

  if (!a)
    return (
      <section className="rounded-card bg-surface p-5">
        <EmptyState compact icon={CalendarCheck2} title="Bugun boshqa bemor yo‘q" description="Navbatdagi barcha qabullar yakunlangan" />
      </section>
    );

  const alert = day?.alerts[a.patientId];
  const inMin = dayjs(a.start).diff(dayjs(), 'minute');
  const label = LABEL[a.status] ?? (inMin > 0 && inMin <= 120 ? `Keyingi bemor · ${inMin} daqiqadan keyin` : 'Keyingi bemor');
  const end = dayjs(a.start).add(a.durationMin, 'minute');

  return (
    <section className="flex flex-col gap-5 rounded-card bg-lime p-5 text-on-lime">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-7.5 items-center gap-2 rounded-pill bg-ink px-3 text-xs text-on-ink">
          <span className="size-1.5 rounded-full bg-lime" />
          {label}
        </span>
        <Button
          shape="circle"
          className="size-10 bg-surface hover:bg-surface"
          aria-label="Qabulni ochish"
          onClick={() => void open(a.id)}
          icon={<ArrowRight size={20} strokeWidth={1.5} className="-rotate-45" />}
        />
      </div>

      <div className="min-w-0">
        <h3 className="m-0 break-words text-2xl font-normal leading-tight">{a.patientName}</h3>
        <p className="m-0 mt-1 text-sm text-ink/75">{a.serviceNames.join(', ') || 'Xizmat ko‘rsatilmagan'}</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <CalendarClock size={18} strokeWidth={1.5} />
          {formatTime(a.start)} – {end.format('HH:mm')}
        </span>
        <span className="text-ink/75">{doctorId ? a.chairName : `${a.chairName} · ${a.doctorName}`}</span>
      </div>

      {alert ? (
        <MedicalAlert compact patient={alert} />
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs text-ink/75">
          <ShieldCheck size={16} strokeWidth={1.5} />
          Tibbiy ogohlantirish yo‘q
        </span>
      )}

      {!readOnly && (
        <div className="border-t border-ink/10 pt-4">
          <StatusActions a={a} onCancel={() => void open(a.id)} onComplete={() => setCompleteId(a.id)} />
        </div>
      )}
      <CompleteAppointmentModal id={completeId} onClose={() => setCompleteId(null)} />
    </section>
  );
};
