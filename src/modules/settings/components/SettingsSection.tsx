import type { ReactNode } from 'react';
import { Squiggle } from '@/shared/components/ui';
import { cn } from '@/shared/utils/cn';

interface Props {
  title: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Sozlamalar bo'limi (Lime Health karta): chapda sarlavha + qisqa izoh, o'ngda maydonlar.
 * Mobil'da ustma-ust. Panel ustida oq, chegarasiz va soyasiz.
 */
export const SettingsSection = ({ title, description, extra, children, className }: Props) => (
  <section className={cn('grid gap-5 rounded-card bg-surface p-5 md:p-6 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-10', className)}>
    <div className="min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="m-0 text-xl font-normal text-ink">{title}</h3>
          <Squiggle />
        </div>
        {extra}
      </div>
      {description && <p className="mb-0 mt-3 text-sm text-muted">{description}</p>}
    </div>
    <div className="min-w-0">{children}</div>
  </section>
);
