import {
  CalendarCheck2,
  CheckCheck,
  CircleAlert,
  CircleDollarSign,
  HandCoins,
  UserRound,
} from '@/shared/icons';
import { formatMoney } from '@/shared/utils/format';
import type { DashboardSummary } from '../types';

interface Props {
  summary?: DashboardSummary;
}

export const CompactStatStrip = ({ summary }: Props) => {
  const arrived = summary?.today.arrived ?? 6;
  const total = summary?.today.total ?? 14;
  const confirmed = Math.max(0, total - (summary?.unconfirmedToday ?? 2));
  const revenueStr = summary?.revenue?.value ? formatMoney(summary.revenue.value) : '4 800 000 so‘m';
  const recStr = summary?.receivables?.value ? formatMoney(summary.receivables.value) : '1 250 000 so‘m';

  const stats = [
    {
      label: 'Bugungi qabullar',
      value: total,
      unit: 'ta',
      change: summary?.today.change ?? 18,
      icon: CalendarCheck2,
    },
    {
      label: 'Tasdiqlangan',
      value: confirmed,
      unit: 'ta',
      change: 9,
      icon: CheckCheck,
    },
    {
      label: 'Yetib keldi',
      value: arrived,
      unit: 'ta',
      change: 12,
      icon: UserRound,
    },
    {
      label: 'Kunlik tushum',
      value: revenueStr,
      change: summary?.revenue?.change ?? 15,
      icon: CircleDollarSign,
    },
    {
      label: 'Kutilayotgan to‘lov',
      value: recStr,
      change: summary?.receivables?.change ?? -4,
      invert: true,
      icon: HandCoins,
    },
    {
      label: 'Zaxira xatarlari',
      value: 3,
      unit: 'ta kam',
      change: -25,
      invert: true,
      icon: CircleAlert,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 rounded-card bg-surface p-4 sm:grid-cols-3 xl:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-line-soft">
      {stats.map((s, idx) => {
        const Icon = s.icon;
        const good = s.invert ? s.change <= 0 : s.change >= 0;
        return (
          <div
            key={s.label}
            className={`flex flex-col justify-between gap-2 ${
              idx > 0 ? 'pt-3 sm:pt-0 sm:pl-3 xl:pl-4' : ''
            }`}
          >
            <div className="flex items-center gap-2 text-muted">
              <span className="grid size-7 place-items-center rounded-full bg-subtle text-ink">
                <Icon size={14} strokeWidth={1.5} />
              </span>
              <span className="text-xs truncate">{s.label}</span>
            </div>

            <div className="flex items-baseline gap-2">
              <div className="truncate text-lg font-medium tabular-nums text-ink">
                {s.value}
                {s.unit && <span className="ml-1 text-xs text-muted font-normal">{s.unit}</span>}
              </div>

              {s.change !== null && s.change !== undefined && (
                <span
                  className={`inline-flex h-5 shrink-0 items-center rounded-pill px-1.5 text-xs font-normal tabular-nums ${
                    good ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
                  }`}
                >
                  {s.change > 0 ? '↑ ' : '↓ '}
                  {Math.abs(s.change)}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
