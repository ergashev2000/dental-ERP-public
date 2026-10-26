import { Button, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CalendarClock } from '@/shared/icons';
import dayjs from '@/shared/lib/dayjs';
import { ColorDot } from '@/shared/components/ui';
import { WEEKDAYS } from '@/shared/constants/options';
import { isOnTimeOff } from '@/shared/utils/schedule';
import { cn } from '@/shared/utils/cn';
import type { Staff } from '../types';

interface Props {
  staff: Staff[];
  /** Berilsa — ish jadvalini tahrirlash tugmasi chiqadi */
  onEdit?: (s: Staff) => void;
}

/** Joriy hafta: shifokor × hafta kuni — ish vaqti, tushlik, ta'til va dam olish kunlari */
export const WeekSchedule = ({ staff, onEdit }: Props) => {
  const monday = dayjs().startOf('isoWeek');
  const today = dayjs().format('YYYY-MM-DD');

  const columns: ColumnsType<Staff> = [
    {
      title: 'Xodim',
      key: 'name',
      fixed: 'left',
      width: 168,
      render: (_, s) => (
        <span className={cn('flex min-w-0 items-center gap-2', !s.isActive && 'text-muted')}>
          <ColorDot color={s.color} />
          <span className="block max-w-36 truncate font-medium" title={s.fullName}>
            {s.fullName}
          </span>
        </span>
      ),
    },
    ...WEEKDAYS.map((w) => {
      const date = monday.add(w.value - 1, 'day');
      const iso = date.format('YYYY-MM-DD');
      const isToday = iso === today;
      return {
        key: String(w.value),
        width: 112,
        title: (
          <span
            className={cn(
              'inline-flex h-6 items-center gap-1 rounded-pill px-2 tabular-nums',
              isToday && 'bg-ink text-on-ink',
            )}
            aria-label={isToday ? `${w.label}, bugun` : w.label}
          >
            {w.short} <span className={isToday ? 'text-on-dark-muted' : ''}>{date.format('DD.MM')}</span>
          </span>
        ),
        render: (_: unknown, s: Staff) => {
          const d = s.schedule.find((x) => x.weekday === w.value);
          if (isOnTimeOff(s, iso))
            return (
              <span className="block rounded-xs bg-warning-soft px-2 py-1.5 text-xs text-warning">
                Ta’til
              </span>
            );
          if (!d) return <span className="block px-2 text-xs text-muted">Dam</span>;
          return (
            <span
              className={cn('block rounded-xs px-2 py-1.5 text-xs leading-4 tabular-nums', isToday ? 'bg-lime-soft' : 'bg-subtle')}
              title={d.breakStart ? `Tushlik ${d.breakStart}–${d.breakEnd}` : undefined}
            >
              <span className="block text-ink">
                {d.start}–{d.end}
              </span>
              {d.breakStart && (
                <span className="block text-muted">
                  {d.breakStart}–{d.breakEnd}
                </span>
              )}
            </span>
          );
        },
      };
    }),
    ...(onEdit
      ? [
          {
            key: 'a',
            width: 56,
            render: (_: unknown, s: Staff) =>
              s.position === 'DOCTOR' && (
                <Button
                  shape="circle"
                  aria-label={`${s.fullName}: ish jadvalini tahrirlash`}
                  icon={<CalendarClock size={18} strokeWidth={1.5} />}
                  onClick={() => onEdit(s)}
                />
              ),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-3">
      <Table rowKey="id" size="middle" pagination={false} dataSource={staff} columns={columns} scroll={{ x: 'max-content' }} />
      <div className="flex flex-wrap gap-x-5 gap-y-1 px-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-subtle ring-1 ring-inset ring-line" /> Ish vaqti, pastda — tushlik
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-warning" /> Ta’til yoki kasallik
        </span>
      </div>
    </div>
  );
};
