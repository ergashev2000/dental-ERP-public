import { Tooltip } from 'antd';
import type { ReactNode } from 'react';
import { Check } from '@/shared/icons';
import { StatusTag } from '@/shared/components/ui';
import { ORTHO_STAGE } from '@/shared/constants/status';
import { cn } from '@/shared/utils/cn';
import { formatDate, formatMoney, formatRelativeDay } from '@/shared/utils/format';
import { ORTHO_STAGES, type OrthoCaseView, type OrthoStage } from '../types';

/** Neytral chip (30px pill) — breket turi, jag', bosqich nomi va h.k. */
export const Chip = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cn('inline-flex h-7.5 items-center gap-1.5 whitespace-nowrap rounded-pill bg-subtle px-3 text-xs text-ink', className)}>{children}</span>
);

/** Summa: raqam + kichik xira "so‘m" (README: valyuta raqamdan kichik va muted) */
export const Money = ({ value, className }: { value: number; className?: string }) => (
  <span className={cn('whitespace-nowrap tabular-nums', className)}>
    {formatMoney(value, false)} <span className="text-[0.75em] text-muted">so‘m</span>
  </span>
);

/** 6 bo'lakli bosqich meteri: o'tilganlar qora, joriy — kulrang, qolgani bo'sh; yonida raqam yozilgan */
export const StageBar = ({ stage, finished, showLabel = true }: { stage: OrthoStage; finished?: boolean; showLabel?: boolean }) => {
  const idx = ORTHO_STAGES.indexOf(stage);
  return (
    <div className="min-w-[140px] max-w-56">
      {showLabel && (
        <div className="mb-1 flex items-center justify-between gap-2 text-xs leading-tight">
          <span className="truncate text-ink">{finished ? 'Davolash tugagan' : ORTHO_STAGE[stage].label}</span>
          <span className="shrink-0 tabular-nums text-muted">
            {finished ? ORTHO_STAGES.length : idx + 1}/{ORTHO_STAGES.length}
          </span>
        </div>
      )}
      <div className="flex gap-0.5" role="img" aria-label={`Bosqich: ${ORTHO_STAGE[stage].label}, ${idx + 1}/${ORTHO_STAGES.length}`}>
        {ORTHO_STAGES.map((s, i) => (
          <Tooltip key={s} title={ORTHO_STAGE[s].label}>
            <span className={cn('h-1.5 flex-1 rounded-full', finished || i < idx ? 'bg-ink' : i === idx ? 'bg-neutral-400' : 'bg-subtle')} />
          </Tooltip>
        ))}
      </div>
    </div>
  );
};

/**
 * Bosqich qadamlari (batafsil sahifa): o'tilgan — qora doira + belgi, joriy — lime doira (qatordagi yagona lime),
 * keyingilari — kulrang. `onPick` berilsa, qadam bosiladigan bo'ladi.
 */
export const StageSteps = ({ stage, finished, onPick }: { stage: OrthoStage; finished?: boolean; onPick?: (s: OrthoStage) => void }) => {
  const idx = ORTHO_STAGES.indexOf(stage);
  return (
    <ol className="m-0 grid list-none grid-cols-2 gap-1.5 p-0 sm:grid-cols-3 lg:grid-cols-6">
      {ORTHO_STAGES.map((s, i) => {
        const done = finished || i < idx;
        const current = !finished && i === idx;
        const content = (
          <>
            <span
              className={cn(
                'grid size-8 shrink-0 place-items-center rounded-full text-xs tabular-nums',
                done ? 'bg-ink text-on-ink' : current ? 'bg-lime text-on-lime' : 'bg-subtle text-muted',
              )}
            >
              {done ? <Check size={16} strokeWidth={1.5} /> : i + 1}
            </span>
            <span className="min-w-0">
              <span className={cn('block truncate text-sm', current ? 'font-medium text-ink' : done ? 'text-ink' : 'text-muted')} title={ORTHO_STAGE[s].label}>
                {ORTHO_STAGE[s].label}
              </span>
              <span className="block truncate text-xs text-muted" title={ORTHO_STAGE[s].hint}>
                {current ? 'Hozirgi bosqich' : ORTHO_STAGE[s].hint}
              </span>
            </span>
          </>
        );
        const cls = cn('flex w-full items-center gap-2.5 rounded-md p-2.5 text-left', current ? 'bg-subtle' : 'bg-surface');
        return (
          <li key={s} aria-current={current ? 'step' : undefined}>
            {onPick ? (
              <button
                type="button"
                onClick={() => onPick(s)}
                className={cn(cls, 'cursor-pointer border-0 transition-colors duration-150 hover:bg-subtle-strong focus-visible:bg-subtle')}
              >
                {content}
              </button>
            ) : (
              <div className={cls}>{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
};

/** Tashrif holati bir qatorda: kechikdi (danger) / yozilgan (info) / yozilmagan (warning) */
export const VisitDue = ({ c }: { c: OrthoCaseView }) => {
  if (c.status === 'FINISHED') return <span className="text-sm text-muted">Davolash tugagan</span>;
  if (c.nextAppointment)
    return (
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
        <StatusTag tone="info">Yozilgan</StatusTag>
        <span className="text-xs tabular-nums text-muted">{formatRelativeDay(c.nextAppointment)}</span>
      </span>
    );
  if (c.overdueDays > 0)
    return (
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1" title={`${c.daysSinceVisit} kundan beri kelmagan`}>
        <StatusTag tone="danger">{c.overdueDays} kun kechikdi</StatusTag>
        <span className="text-xs tabular-nums text-muted">muddat {formatDate(c.dueDate)}</span>
      </span>
    );
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <StatusTag tone="warning">Yozilmagan</StatusTag>
      <span className="text-xs tabular-nums text-muted">kelishi kerak {formatDate(c.dueDate)}</span>
    </span>
  );
};

/** To'lov holati bir qatorda (ro'yxat va bemor kartasi uchun) */
export const PaymentState = ({ c }: { c: OrthoCaseView }) => {
  if (c.totalPrice <= 0) return <span className="text-sm text-muted">Narx kelishilmagan</span>;
  if (c.remaining <= 0) return <StatusTag tone="success">To‘liq to‘langan</StatusTag>;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      {c.paymentOverdue && <StatusTag tone="warning">To‘lov kechikdi</StatusTag>}
      <span className="text-sm tabular-nums">
        <span className="text-xs text-muted">Qarz </span>
        <Money value={c.remaining} />
      </span>
      {!c.paymentOverdue && c.nextPaymentDate && <span className="text-xs tabular-nums text-muted">keyingi {formatDate(c.nextPaymentDate)}</span>}
    </span>
  );
};
