import { Button, Checkbox, DatePicker, Segmented, Select } from 'antd';
import { ChevronLeft, ChevronRight } from '@/shared/icons';
import { useEffect } from 'react';
import dayjs from '@/shared/lib/dayjs';
import { DoctorSelect, PageHeader, Panel, SearchInput } from '@/shared/components/ui';
import { APPOINTMENT_STATUS } from '@/shared/constants/status';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { useCurrentUser } from '@/shared/hooks/usePermission';
import { DayView, WeekView } from '../components/CalendarViews';
import { ListView } from '../components/ListView';
import { StatusLegend } from '../components/StatusLegend';
import { BookingInbox } from '../components/quick/BookingInbox';
import { hotkeyBlocked } from '../hooks/useHotkeys';
import { APPOINTMENT_STATUSES, useAppointmentsParams, type CalendarView } from '../hooks/useAppointments';

export const AppointmentsPage = () => {
  const [p, setP] = useAppointmentsParams();
  const isMobile = useIsMobile();
  const user = useCurrentUser();
  // mobil ekranda faqat kun / ro'yxat
  const view: CalendarView = isMobile && p.view === 'week' ? 'day' : p.view;
  const date = dayjs(p.date ?? undefined).startOf('day');
  const dateStr = date.format('YYYY-MM-DD');

  // Shifokor hafta ko'rinishida o'z jadvalini ko'radi; registratura — barcha shifokorlarni (yoki bittasini tanlaydi)
  useEffect(() => {
    if (view === 'week' && !p.doctor && user?.role === 'DOCTOR') void setP({ doctor: user.staffId });
  }, [view, p.doctor, user, setP]);

  // T — bugun, ← → — oldingi/keyingi kun (matn kiritilmayotganda)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || hotkeyBlocked(e.target)) return;
      if (e.key === 't' || e.key === 'T') void setP({ date: null, page: 1 });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setP]);

  const shift = (dir: -1 | 1) => void setP({ date: date.add(dir * (view === 'week' ? 7 : 1), 'day').toDate(), page: 1 });
  const label =
    view === 'week'
      ? `${date.startOf('isoWeek').format('DD.MM')} – ${date.startOf('isoWeek').add(6, 'day').format('DD.MM.YYYY')}`
      : date.isSame(dayjs(), 'day')
        ? `Bugun, ${date.format('D MMMM')}`
        : date.format('dddd, D MMMM');

  return (
    <>
      <PageHeader title="Qabullar" breadcrumb={[{ label: 'Bosh sahifa', to: '/' }, { label: 'Qabullar' }]} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-md bg-surface p-1 shadow-card">
          <Button type="text" aria-label="Oldingi" icon={<ChevronLeft size={18} strokeWidth={1.75} />} onClick={() => shift(-1)} />
          <Button type="text" onClick={() => void setP({ date: null, page: 1 })}>
            Bugun
          </Button>
          <Button type="text" aria-label="Keyingi" icon={<ChevronRight size={18} strokeWidth={1.75} />} onClick={() => shift(1)} />
        </div>
        <DatePicker
          value={p.date || view !== 'list' ? date : null}
          onChange={(d) => void setP({ date: d ? d.toDate() : null, page: 1 })}
          format="DD.MM.YYYY"
          allowClear={view === 'list'}
          placeholder="Bugundan boshlab"
          className="w-40"
        />
        {view !== 'list' && <span className="hidden text-base font-normal capitalize text-ink lg:inline">{label}</span>}

        <div className="ml-auto flex items-center gap-2">
          <BookingInbox />
        </div>
        <Segmented<CalendarView>
          value={view}
          onChange={(v) => void setP({ view: v, page: 1 })}
          options={[
            { value: 'day', label: 'Kun' },
            ...(isMobile ? [] : [{ value: 'week' as const, label: 'Hafta' }]),
            { value: 'list', label: 'Ro‘yxat' },
          ]}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {view === 'day' && (
          <Segmented
            value={p.resource}
            onChange={(v) => void setP({ resource: v as 'doctors' | 'chairs' })}
            options={[
              { value: 'doctors', label: 'Shifokorlar' },
              { value: 'chairs', label: 'Kreslolar' },
            ]}
          />
        )}
        {view !== 'day' && (
          <DoctorSelect
            allowClear
            value={p.doctor}
            onChange={(doctor) => void setP({ doctor: doctor ?? null, page: 1 })}
            className="w-60"
            placeholder="Barcha shifokorlar"
          />
        )}
        {view === 'list' && (
          <>
            <SearchInput value={p.q} onChange={(q) => void setP({ q, page: 1 })} placeholder="Bemor ismi yoki telefon" />
            <Select
              allowClear
              placeholder="Status"
              value={p.status ?? undefined}
              onChange={(s?: (typeof APPOINTMENT_STATUSES)[number]) => void setP({ status: s ?? null, page: 1 })}
              options={APPOINTMENT_STATUSES.map((s) => ({ value: s, label: APPOINTMENT_STATUS[s].label }))}
              className="w-48"
            />
          </>
        )}
        {view !== 'list' && (
          <Checkbox checked={p.cancelled} onChange={(e) => void setP({ cancelled: e.target.checked })}>
            Bekor qilinganlarni ko‘rsatish
          </Checkbox>
        )}
        {view !== 'list' && <StatusLegend includeCancelled={p.cancelled} className="xl:ml-auto" />}
      </div>

      {view === 'day' && <DayView date={dateStr} resource={p.resource} includeCancelled={p.cancelled} />}
      {view === 'week' && <WeekView date={dateStr} doctorId={p.doctor} includeCancelled={p.cancelled} />}
      {view === 'list' && (
        <Panel className="flex-1" bodyClassName="p-2 md:p-3">
          <ListView
            filters={{
              from: p.date ? dateStr : dayjs().format('YYYY-MM-DD'),
              to: p.date ? dateStr : undefined,
              doctor: p.doctor,
              status: p.status,
              q: p.q,
              page: p.page,
              pageSize: 12,
            }}
            onPage={(page) => void setP({ page })}
          />
        </Panel>
      )}
    </>
  );
};
