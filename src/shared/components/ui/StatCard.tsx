import type { AppIcon } from '@/shared/icons';
import type { ReactNode } from 'react';
import { Skeleton } from 'antd';
import { cn } from '@/shared/utils/cn';

interface Props {
  icon: AppIcon;
  title: string;
  value: ReactNode;
  /** Foizdagi o'zgarish; null — ko'rsatilmaydi */
  change?: number | null;
  changeLabel?: string;
  /** true — o'sish yomon (masalan, qarzdorlik) */
  invert?: boolean;
  hint?: ReactNode;
  loading?: boolean;
  /** hero — qatordagi yagona lime karta (on-lime matn) */
  variant?: 'default' | 'hero';
  /** Berilsa — karta tugma bo'ladi (masalan, jadvalni filtrlash) */
  onClick?: () => void;
  /** Bosiladigan karta tanlangan holatda (ink halqa) */
  active?: boolean;
}

/** KPI kartasi (Lime Health Stat): label tepada, katta yengil raqam, ikonka doirada, delta — so‘z bilan chip */
export const StatCard = ({ icon: Icon, title, value, change, changeLabel = 'o‘tgan haftaga nisbatan', invert, hint, loading, variant = 'default', onClick, active }: Props) => {
  const good = change !== null && change !== undefined && (invert ? change <= 0 : change >= 0);
  const hero = variant === 'hero';
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={onClick ? !!active : undefined}
      className={cn(
        'flex h-full w-full flex-col gap-3 rounded-card p-5 text-left',
        hero ? 'bg-lime text-on-lime' : 'bg-surface',
        onClick && 'cursor-pointer transition-shadow duration-150 hover:shadow-float',
        active && 'ring-2 ring-inset ring-ink',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={cn('text-xs', hero ? 'text-on-lime' : 'text-muted')}>{title}</span>
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-full text-ink', hero ? 'bg-surface' : 'bg-subtle')}>
          <Icon size={20} strokeWidth={1.5} />
        </span>
      </div>
      {loading ? (
        <Skeleton.Input active size="small" />
      ) : (
        <div className="text-3xl font-normal tabular-nums tracking-[-0.02em] text-ink">{value}</div>
      )}
      <div className={cn('mt-auto flex min-h-4 flex-wrap items-center gap-x-1.5 text-xs', hero ? 'text-on-lime' : 'text-muted')}>
        {change !== null && change !== undefined && !loading && (
          <span className={cn('inline-flex h-6 items-center rounded-pill px-2.5 tabular-nums', good ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger')}>
            {change > 0 ? '+' : ''}
            {change}%
          </span>
        )}
        {change !== null && change !== undefined && !loading && <span>{changeLabel}</span>}
        {hint}
      </div>
    </Tag>
  );
};
