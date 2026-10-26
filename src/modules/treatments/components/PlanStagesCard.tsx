import type { ReactNode } from 'react';
import { Squiggle } from '@/shared/components/ui';
import { PLAN_STATUS } from '@/shared/constants/status';
import { cn } from '@/shared/utils/cn';
import type { PlanItemView } from '../types';
import type { StageFilter } from '../utils';

/**
 * 3D taqdimotdagi reja kartasi (bemor uchun): bosqichlar va ishlar, narxsiz.
 * Bosqich bosilsa — 3D modelda faqat shu bosqich tishlari urg'ulanadi.
 */
export const PlanStagesCard = ({ items, value, onChange }: { items: PlanItemView[]; value: StageFilter; onChange: (v: StageFilter) => void }) => {
  const live = items.filter((i) => i.status !== 'CANCELLED');
  const stages = [...new Set(live.map((i) => i.stage))].sort((a, b) => a - b);

  const option = (key: StageFilter, title: string, body?: ReactNode) => {
    const active = value === key;
    return (
      <button
        key={key}
        type="button"
        aria-pressed={active}
        onClick={() => onChange(key)}
        className={cn(
          'flex w-full cursor-pointer flex-col gap-1.5 rounded-md border-0 p-3 text-left text-ink transition-colors',
          active ? 'bg-lime-soft ring-1 ring-inset ring-ink' : 'bg-neutral-25 hover:bg-subtle',
        )}
      >
        <span className="text-sm font-medium">{title}</span>
        {body}
      </button>
    );
  };

  return (
    <section className="rounded-card bg-surface p-5">
      <h3 className="m-0 text-xl font-normal text-ink">Davolash rejasi</h3>
      <Squiggle />
      <div className="mt-4 flex flex-col gap-1.5">
        {option('all', 'Barcha bosqichlar')}
        {stages.map((st) =>
          option(
            st,
            `${st}-bosqich`,
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {live
                .filter((i) => i.stage === st)
                .map((i) => (
                  <li key={i.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      {i.tooth && <span className="tabular-nums">{i.tooth} · </span>}
                      {i.serviceName}
                    </span>
                    <span className="shrink-0 text-xs text-muted">{PLAN_STATUS[i.status].label}</span>
                  </li>
                ))}
            </ul>,
          ),
        )}
      </div>
    </section>
  );
};
