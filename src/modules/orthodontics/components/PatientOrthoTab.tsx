import { Button, Skeleton } from 'antd';
import { ArrowRight, Smile } from '@/shared/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Can, EmptyState, Panel, StatusTag } from '@/shared/components/ui';
import { ORTHO_APPLIANCE, ORTHO_STATUS } from '@/shared/constants/status';
import { ROUTES } from '@/shared/constants/routes';
import { formatDate } from '@/shared/utils/format';
import { usePatientOrtho } from '../hooks/useOrtho';
import { OrthoCaseFormDrawer } from './OrthoCaseFormDrawer';
import { Money, StageBar, VisitDue } from './OrthoBits';

/** Bemor kartasidagi "Breket" tabi — qisqa holat va breket sahifasiga o'tish */
export const PatientOrthoTab = ({ patientId }: { patientId: string }) => {
  const navigate = useNavigate();
  const { data: c, isLoading } = usePatientOrtho(patientId);
  const [creating, setCreating] = useState(false);

  if (isLoading) return <Skeleton active paragraph={{ rows: 4 }} />;

  return (
    <>
      {!c ? (
        <Panel>
          <EmptyState
            icon={Smile}
            title="Bu bemorda breket davolashi yo‘q"
            description="Breket qo‘yilsa — bosqichlar, har oylik korreksiyalar va to‘lov rejasi shu yerda kuzatiladi"
            action={
              <Can perm="ortho.manage">
                <Button type="primary" onClick={() => setCreating(true)}>
                  Breket davolashini boshlash
                </Button>
              </Can>
            }
          />
        </Panel>
      ) : (
        <Panel
          title="Breket davolashi"
          extra={
            <Button icon={<ArrowRight size={18} strokeWidth={1.5} />} iconPosition="end" onClick={() => navigate(ROUTES.orthoCase(c.id))}>
              Breket sahifasi
            </Button>
          }
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-start gap-1.5">
              <div className="text-xs text-muted">Holat</div>
              <StatusTag meta={ORTHO_STATUS[c.status]} />
              <div className="text-sm text-ink">{ORTHO_APPLIANCE[c.appliance]}</div>
              <div className="text-xs text-muted">Boshlangan {formatDate(c.startDate)}</div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="text-xs text-muted">Bosqich</div>
              <StageBar stage={c.stage} finished={c.status === 'FINISHED'} />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="text-xs text-muted">Keyingi korreksiya</div>
              <VisitDue c={c} />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="text-xs text-muted">To‘lov</div>
              {c.totalPrice > 0 ? (
                <>
                  <div className="text-sm">
                    <Money value={c.paid} /> <span className="text-muted">/</span> <Money value={c.totalPrice} className="text-muted" />
                  </div>
                  {c.remaining > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span>
                        <span className="text-muted">Qarz </span>
                        <Money value={c.remaining} />
                      </span>
                      {c.paymentOverdue && <StatusTag tone="warning">To‘lov kechikdi</StatusTag>}
                    </div>
                  ) : (
                    <StatusTag tone="success">To‘liq to‘langan</StatusTag>
                  )}
                </>
              ) : (
                <span className="text-sm text-muted">Narx kelishilmagan</span>
              )}
            </div>
          </div>
        </Panel>
      )}
      <OrthoCaseFormDrawer open={creating} patientId={patientId} onClose={() => setCreating(false)} onSaved={(x) => navigate(ROUTES.orthoCase(x.id))} />
    </>
  );
};
