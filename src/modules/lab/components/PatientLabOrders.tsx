import { Button } from 'antd';
import { useState } from 'react';
import { FlaskLab, Plus } from '@/shared/icons';
import { Can, CardSkeleton, EmptyState, ErrorState, Panel, StatusTag } from '@/shared/components/ui';
import { LAB_STATUS, LAB_WORK_TYPE, teethLabel } from '../constants';
import { useLabOrders, useLabs } from '../hooks/useLab';
import type { LabOrderView } from '../types';
import { LabDueText } from './LabBits';
import { LabOrderDetailDrawer } from './LabOrderDetailDrawer';
import { LabOrderFormDrawer } from './LabOrderFormDrawer';

/** Bemor kartasi uchun: shu bemorning laboratoriya buyurtmalari + "Buyurtma berish" */
export const PatientLabOrders = ({ patientId }: { patientId: string }) => {
  const { data = [], isLoading, isError, error, refetch } = useLabOrders(patientId);
  useLabs(); // forma ochilganda laboratoriyalar ro'yxati tayyor bo'lsin
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<{ order: LabOrderView | null } | null>(null);
  const detail = data.find((o) => o.id === detailId);

  const add = (
    <Can perm="lab.manage">
      <Button type="primary" icon={<Plus size={18} strokeWidth={1.5} />} onClick={() => setForm({ order: null })}>
        Buyurtma berish
      </Button>
    </Can>
  );

  if (isLoading) return <CardSkeleton rows={3} />;

  return (
    <Panel title="Laboratoriya" extra={data.length > 0 ? add : undefined}>
      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : data.length === 0 ? (
        <EmptyState icon={FlaskLab} title="Buyurtmalar yo‘q" description="Toj, ko‘prik, protez yoki kappa uchun tish texnikiga buyurtma bering" action={add} compact />
      ) : (
        <div className="flex flex-col gap-1.5 rounded-sheet bg-panel p-1.5">
          {data.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setDetailId(o.id)}
              className="flex w-full min-w-0 cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 rounded-md border-0 bg-surface px-4 py-3 text-left transition-colors hover:bg-subtle"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-ink">
                  {LAB_WORK_TYPE[o.workType]}
                  {o.shade ? ` · ${o.shade}` : ''}
                </div>
                <div className="truncate text-xs text-muted">
                  {o.number} · tishlar {teethLabel(o.teeth)} · {o.labName}
                </div>
              </div>
              <span className="text-sm">
                <LabDueText o={o} />
              </span>
              <StatusTag meta={LAB_STATUS[o.status]} />
            </button>
          ))}
        </div>
      )}

      <LabOrderDetailDrawer
        order={detail}
        hidePatientLink
        onClose={() => setDetailId(null)}
        onEdit={(o) => {
          setDetailId(null);
          setForm({ order: o });
        }}
      />
      <LabOrderFormDrawer open={!!form} order={form?.order} patientId={patientId} onClose={() => setForm(null)} />
    </Panel>
  );
};
