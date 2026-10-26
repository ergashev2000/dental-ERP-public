import { Button, Skeleton } from 'antd';
import { CheckCheck, DoorOpen, PhoneCall } from '@/shared/icons';
import type { ReactNode } from 'react';
import dayjs from '@/shared/lib/dayjs';
import { EmptyState, Panel, StatusTag } from '@/shared/components/ui';
import { APPOINTMENT_STATUS } from '@/shared/constants/status';
import { formatDuration, formatPhone, formatTime } from '@/shared/utils/format';
import { ReminderCell, useAppointmentParam, useAppointmentsRange, type AppointmentView } from '@/modules/appointments';

const useToday = () => {
  const today = dayjs().format('YYYY-MM-DD');
  // TodayTimeline bilan bir xil kalit — so'rov takrorlanmaydi
  const q = useAppointmentsRange(today, today, { doctor: undefined, includeCancelled: true });
  return { ...q, list: (q.data ?? []).filter((a) => !a.masked) };
};

const Row = ({ a, meta, aside }: { a: AppointmentView; meta: ReactNode; aside: ReactNode }) => {
  const [, open] = useAppointmentParam();
  return (
    <li
      role="button"
      tabIndex={0}
      onClick={() => void open(a.id)}
      onKeyDown={(e) => e.key === 'Enter' && void open(a.id)}
      className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-colors duration-150 hover:bg-subtle"
    >
      <span className="w-12 shrink-0 text-sm tabular-nums text-ink">{formatTime(a.start)}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">{a.patientName}</div>
        <div className="truncate text-xs text-muted">{meta}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {aside}
      </div>
    </li>
  );
};

/** Registratura: tasdiqlanmagan bugungi qabullar — qo'ng'iroq qilish uchun */
export const UnconfirmedCard = () => {
  const { list, isLoading } = useToday();
  const now = dayjs();
  const items = list.filter((a) => a.status === 'SCHEDULED' && dayjs(a.start).add(a.durationMin, 'minute').isAfter(now));
  return (
    <Panel
      title="Tasdiqlanmagan"
      extra={items.length > 0 && <StatusTag tone="warning">{items.length} ta</StatusTag>}
      bodyClassName="p-2 pt-3 md:p-3"
    >
      {isLoading ? (
        <div className="p-3">
          <Skeleton active paragraph={{ rows: 3 }} />
        </div>
      ) : !items.length ? (
        <EmptyState compact icon={CheckCheck} title="Hammasi tasdiqlangan" description="Bugungi barcha bemorlar qabulni tasdiqlagan" />
      ) : (
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
          {items.map((a) => (
            <Row
              key={a.id}
              a={a}
              meta={a.patientPhone ? formatPhone(a.patientPhone) : a.doctorName}
              aside={
                <>
                  <span className="hidden sm:inline-flex">
                    <ReminderCell r={a.reminder} />
                  </span>
                  {a.patientPhone && (
                    <Button
                      shape="circle"
                      href={`tel:${a.patientPhone}`}
                      aria-label={`${a.patientName}ga qo‘ng‘iroq qilish`}
                      title="Qo‘ng‘iroq qilish"
                      icon={<PhoneCall size={18} strokeWidth={1.5} />}
                    />
                  )}
                </>
              }
            />
          ))}
        </ul>
      )}
    </Panel>
  );
};

/** Registratura: klinikadagi bemorlar — kutish zalida va kresloda */
export const InClinicCard = () => {
  const { list, isLoading } = useToday();
  const now = dayjs();
  const items = list
    .filter((a) => a.status === 'ARRIVED' || a.status === 'IN_PROGRESS')
    .sort((a, b) => (a.status === b.status ? a.start.localeCompare(b.start) : a.status === 'IN_PROGRESS' ? -1 : 1));
  return (
    <Panel title="Klinikada" bodyClassName="p-2 pt-3 md:p-3">
      {isLoading ? (
        <div className="p-3">
          <Skeleton active paragraph={{ rows: 3 }} />
        </div>
      ) : !items.length ? (
        <EmptyState compact icon={DoorOpen} title="Hozir klinikada bemor yo‘q" description="Bemor kelganda navbatda «Keldi» tugmasini bosing" />
      ) : (
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
          {items.map((a) => {
            const wait = a.status === 'ARRIVED' ? now.diff(dayjs(a.start), 'minute') : 0;
            return (
              <Row
                key={a.id}
                a={a}
                meta={`${a.chairName} · ${a.doctorName}`}
                aside={
                  wait >= 10 ? (
                    <StatusTag tone="warning">Kutmoqda · {formatDuration(wait)}</StatusTag>
                  ) : (
                    <StatusTag meta={APPOINTMENT_STATUS[a.status]} />
                  )
                }
              />
            );
          })}
        </ul>
      )}
    </Panel>
  );
};
