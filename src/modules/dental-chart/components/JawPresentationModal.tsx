import { Modal } from 'antd';
import { useState, type ReactNode } from 'react';
import { Squiggle, StatusTag } from '@/shared/components/ui';
import { TOOTH_CONDITION } from '@/shared/constants/status';
import { toothName } from '@/shared/utils/fdi';
import { useChart } from '../hooks/useChart';
import { CONDITION_TONE } from '../jaw3d/look';
import type { Dentition, ToothCondition } from '../types';
import { Jaw3DLegend } from './Jaw3DLegend';
import { Jaw3DView } from './Jaw3DView';

export interface JawPresentationModalProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  dentition?: Dentition;
  /** Urg'u beriladigan tishlar (masalan, davolash rejasi) */
  highlight?: number[];
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Qo'shimcha oq karta(lar) — o'ng ustunda, "Tanlangan tish" ostida (masalan, reja bosqichlari) */
  aside?: ReactNode;
}

const Body = ({ patientId, dentition = 'adult', highlight, aside }: Omit<JawPresentationModalProps, 'open' | 'onClose' | 'title' | 'subtitle'>) => {
  const { data: records, isLoading } = useChart(patientId);
  const [selected, setSelected] = useState<number | null>(null);
  const conditions: ToothCondition[] = records?.find((r) => r.tooth === selected)?.conditions ?? [];
  const shown = conditions.length ? conditions : (['HEALTHY'] as ToothCondition[]);

  return (
    <div className="grid gap-2 lg:h-full lg:grid-cols-[minmax(0,1fr)_360px]">
      {isLoading || !records ? (
        <div className="h-[52dvh] animate-pulse rounded-md bg-neutral-25 lg:h-full" />
      ) : (
        <Jaw3DView
          records={records}
          dentition={dentition}
          highlight={highlight}
          presentation
          selected={selected ? [selected] : []}
          onToothClick={(t) => setSelected(t)}
          className="h-[52dvh] lg:h-full"
        />
      )}

      <aside className="flex flex-col gap-2 rounded-sheet bg-panel p-2 lg:min-h-0 lg:overflow-y-auto">
        <section className="rounded-card bg-surface p-5" aria-live="polite">
          <div className="text-xs text-muted">Tanlangan tish</div>
          {selected ? (
            <>
              <div className="mt-1 text-2xl tabular-nums text-ink">{selected}-tish</div>
              <div className="text-sm text-muted">{toothName(selected)}</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {shown.map((k) => (
                  <StatusTag key={k} tone={CONDITION_TONE[k]}>
                    {TOOTH_CONDITION[k].label}
                  </StatusTag>
                ))}
              </div>
            </>
          ) : (
            <p className="mb-0 mt-2 text-base text-muted">Modeldagi tishni bosing — uning holati shu yerda ko‘rinadi</p>
          )}
        </section>

        {aside}

        {records && (
          <section className="rounded-card bg-surface p-5">
            <h3 className="m-0 text-xl font-normal text-ink">Belgilar</h3>
            <Squiggle />
            <div className="mt-4">
              <Jaw3DLegend records={records} dentition={dentition} highlight={highlight} size="lg" />
            </div>
          </section>
        )}
      </aside>
    </div>
  );
};

/**
 * "Bemorga ko'rsatish" — deyarli to'liq ekranli 3D taqdimot.
 * Narxlar, ichki izohlar va tahrirlash yo'q; faqat tishlar holati va belgilar.
 */
export const JawPresentationModal = ({ open, onClose, title = 'Tishlaringiz holati', subtitle, ...body }: JawPresentationModalProps) => (
  <Modal
    open={open}
    onCancel={onClose}
    footer={null}
    destroyOnHidden
    width="calc(100vw - 16px)"
    style={{ top: 8, maxWidth: 'none', paddingBottom: 0 }}
    styles={{
      content: { height: 'calc(100dvh - 16px)', display: 'flex', flexDirection: 'column' },
      body: { flex: 1, minHeight: 0, overflowY: 'auto' },
    }}
    title={
      <div className="pr-10">
        <div className="text-xl font-normal text-ink">{title}</div>
        {subtitle && <div className="text-sm font-normal text-muted">{subtitle}</div>}
      </div>
    }
  >
    {open && <Body {...body} />}
  </Modal>
);
