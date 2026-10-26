import { Button, Segmented, Skeleton } from 'antd';
import { CalendarDays } from '@/shared/icons';
import { useState } from 'react';
import { Link } from 'react-router';
import dayjs from '@/shared/lib/dayjs';
import { EmptyState, Panel, StatusTag } from '@/shared/components/ui';
import { APPOINTMENT_STATUS } from '@/shared/constants/status';
import { ROUTES } from '@/shared/constants/routes';
import { formatDuration, formatTime } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import { CompleteAppointmentModal, StatusActions, useAppointmentParam, useAppointmentsRange } from '@/modules/appointments';

export type TimelineGroup = 'all' | 'waiting' | 'arrived' | 'inChair' | 'done' | 'missed';

const GROUPS: { key: TimelineGroup; label: string; statuses: string[] }[] = [
  { key: 'all', label: 'Hammasi', statuses: [] },
  { key: 'waiting', label: 'Kutilmoqda', statuses: ['SCHEDULED', 'CONFIRMED'] },
  { key: 'arrived', label: 'Keldi', statuses: ['ARRIVED'] },
  { key: 'inChair', label: 'Qabulda', statuses: ['IN_PROGRESS'] },
  { key: 'done', label: 'Yakunlandi', statuses: ['COMPLETED'] },
  { key: 'missed', label: 'Kelmadi / bekor', statuses: ['NO_SHOW', 'CANCELLED'] },
];

/** Kechikish chegarasi — shundan keyin "Kechikmoqda" belgisi */
const LATE_MIN = 10;

interface Props {
  title?: string;
  /** Faqat shu shifokorning qabullari (shifokor kuni) */
  doctorId?: string;
  defaultGroup?: TimelineGroup;
  /** Shifokor ismini ko'rsatmaslik (o'z kuni) */
  hideDoctor?: boolean;
}

/** Bugungi qabullar vaqt bo'yicha: kim keldi, kim kutyapti, kim kelmadi + tez amallar */
export const TodayTimeline = ({ title = 'Bugungi qabullar', doctorId, defaultGroup = 'all', hideDoctor }: Props) => {
  const today = dayjs().format('YYYY-MM-DD');
  const { data = [], isLoading } = useAppointmentsRange(today, today, { doctor: doctorId, includeCancelled: true });
  const [, open] = useAppointmentParam();
  const [completeId, setCompleteId] = useState<string | null>(null);
  const [group, setGroup] = useState<TimelineGroup>(defaultGroup);
  const all = data.filter((a) => !a.masked);
  const now = dayjs();
  const inGroup = (g: TimelineGroup, status: string) => g === 'all' || GROUPS.find((x) => x.key === g)!.statuses.includes(status);
  const items = all.filter((a) => inGroup(group, a.status));
  const lateMin = (a: (typeof all)[number]) =>
    ['SCHEDULED', 'CONFIRMED'].includes(a.status) ? now.diff(dayjs(a.start), 'minute') : 0;
  // Navbatdagi birinchi kutilayotgan bemor — "Keyingi" belgisi
  const nextId = all.find((a) => ['SCHEDULED', 'CONFIRMED'].includes(a.status) && dayjs(a.start).add(a.durationMin, 'minute').isAfter(now))?.id;

  return (
    <Panel
      title={title}
      extra={
        <Link to={ROUTES.appointments}>
          <Button className="bg-transparent" icon={<CalendarDays size={18} strokeWidth={1.5} />}>
            Kalendar
          </Button>
        </Link>
      }
      bodyClassName="p-2 md:p-3"
    >
      {!isLoading && all.length > 0 && (
        <div className="overflow-x-auto px-2 pb-2 pt-1">
          <Segmented<TimelineGroup>
            size="small"
            value={group}
            onChange={setGroup}
            options={GROUPS.map((g) => ({ value: g.key, label: `${g.label} · ${all.filter((a) => inGroup(g.key, a.status)).length}` }))}
          />
        </div>
      )}
      {isLoading ? (
        <div className="p-4">
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      ) : !all.length ? (
        <EmptyState title="Bugun qabul yo‘q" description="Yangi qabul qo‘shish uchun yuqoridagi «Yangi qabul» tugmasini bosing" />
      ) : !items.length ? (
        <EmptyState compact title="Bu guruhda qabul yo‘q" description="Boshqa guruhni tanlang yoki «Hammasi»ni bosing" />
      ) : (
        <ul className="m-0 flex max-h-[600px] list-none flex-col gap-0.5 overflow-y-auto p-0">
          {items.map((a) => {
            const past = dayjs(a.start).add(a.durationMin, 'minute').isBefore(now);
            const late = lateMin(a) >= LATE_MIN;
            return (
              <li key={a.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => void open(a.id)}
                  onKeyDown={(e) => e.key === 'Enter' && void open(a.id)}
                  className={cn(
                    'grid cursor-pointer grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-3 py-2.5 transition-colors duration-150 hover:bg-subtle md:grid-cols-[60px_minmax(0,1fr)_auto_auto]',
                    a.id === nextId && 'bg-lime-soft hover:bg-lime-soft',
                    (a.status === 'CANCELLED' || a.status === 'NO_SHOW') && 'opacity-60',
                  )}
                >
                  <div className="flex flex-col">
                    <span className={cn('text-base tabular-nums', past && a.status !== 'IN_PROGRESS' ? 'text-muted' : 'text-ink')}>
                      {formatTime(a.start)}
                    </span>
                    <span className="text-xs text-muted tabular-nums">{a.durationMin} daq</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={cn('truncate text-sm font-medium text-ink', a.status === 'CANCELLED' && 'line-through')}>{a.patientName}</span>
                      {a.id === nextId && <span className="shrink-0 rounded-pill bg-ink px-2 py-0.5 text-xs text-on-ink">Keyingi</span>}
                    </div>
                    <div className="truncate text-xs text-muted">
                      {hideDoctor ? a.chairName : a.doctorName} · {a.serviceNames.join(', ')}
                    </div>
                    {/* Mobil: status matni ism ostida */}
                    <div className="mt-1 md:hidden">
                      {late ? (
                        <StatusTag tone="warning">Kechikmoqda · {formatDuration(lateMin(a))}</StatusTag>
                      ) : (
                        <StatusTag meta={APPOINTMENT_STATUS[a.status]} />
                      )}
                    </div>
                  </div>
                  <div className="hidden md:block">
                    {late ? (
                      <StatusTag tone="warning">Kechikmoqda · {formatDuration(lateMin(a))}</StatusTag>
                    ) : (
                      <StatusTag meta={APPOINTMENT_STATUS[a.status]} />
                    )}
                  </div>
                  <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <StatusActions a={a} compact size="small" onCancel={() => void open(a.id)} onComplete={() => setCompleteId(a.id)} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <CompleteAppointmentModal id={completeId} onClose={() => setCompleteId(null)} />
    </Panel>
  );
};
