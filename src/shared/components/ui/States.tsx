import type { AppIcon } from '@/shared/icons';
import { CircleAlert, Inbox } from '@/shared/icons';
import { Button, Skeleton } from 'antd';
import type { ReactNode } from 'react';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { Squiggle } from './Squiggle';

interface EmptyProps {
  icon?: AppIcon;
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

export const EmptyState = ({ icon: Icon = Inbox, title = 'Ma’lumot yo‘q', description, action, compact }: EmptyProps) => (
  <div className={`flex flex-col items-center justify-center text-center ${compact ? 'gap-2 py-6' : 'gap-3 py-12'}`}>
    <span className="grid size-12 place-items-center rounded-full bg-subtle text-muted">
      <Icon size={20} strokeWidth={1.5} />
    </span>
    <div className="text-base text-ink">{title}</div>
    {description && <div className="max-w-sm text-sm text-muted">{description}</div>}
    {action}
  </div>
);

export const ErrorState = ({ error, onRetry }: { error?: unknown; onRetry?: () => void }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
    <span className="grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
      <CircleAlert size={20} strokeWidth={1.5} />
    </span>
    <div className="text-base text-ink">Ma’lumotni yuklab bo‘lmadi</div>
    <div className="max-w-sm text-sm text-muted">{errorMessage(error)}</div>
    {onRetry && <Button onClick={onRetry}>Qayta urinish</Button>}
  </div>
);

export const CardSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="rounded-card bg-surface p-6">
    <Skeleton active paragraph={{ rows }} />
  </div>
);

/** Umumiy karta (Lime Health card): panel ustida oq, soyasiz, 32px; sarlavha ostida squiggle */
export const Panel = ({
  title,
  extra,
  children,
  className = '',
  bodyClassName = 'p-5',
}: {
  title?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) => (
  <section className={`rounded-card bg-surface ${className}`}>
    {(title || extra) && (
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <div>
          <h3 className="m-0 text-xl font-normal text-ink">{title}</h3>
          {title && <Squiggle />}
        </div>
        {extra}
      </header>
    )}
    <div className={bodyClassName}>{children}</div>
  </section>
);
