import { Button, Form, Modal } from 'antd';
import { Maximize2 } from '@/shared/icons';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/shared/constants/routes';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { useCompletionDraft } from '../hooks/useAppointments';
import { CompletionForm, type CompletionValues } from './CompletionForm';
import { useCompletionResult } from './useCompletionResult';

/** Qabulni yakunlash oynasi (tezkor yo'l). To'liq ish joyi — "Qabul sahifasi" */
export const CompleteAppointmentModal = ({ id, onClose }: { id: string | null; onClose: () => void }) => {
  const [form] = Form.useForm<CompletionValues>();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { data: draft } = useCompletionDraft(id);
  const result = useCompletionResult();

  return (
    <>
      <Modal
        open={!!id}
        onCancel={onClose}
        width={isMobile ? '100%' : 820}
        title={
          <div className="flex items-center gap-3 pr-8">
            <span className="min-w-0 flex-1 truncate">{draft ? `Qabulni yakunlash — ${draft.appointment.patientName}` : 'Qabulni yakunlash'}</span>
            {id && (
              <Button
                size="small"
                type="text"
                icon={<Maximize2 size={14} strokeWidth={1.5} />}
                onClick={() => {
                  onClose();
                  navigate(ROUTES.visit(id));
                }}
              >
                Tish sxemasi bilan ochish
              </Button>
            )}
          </div>
        }
        destroyOnHidden
        footer={null}
      >
        {id && (
          <div className="mt-4">
            <CompletionForm
              appointmentId={id}
              form={form}
              onCancel={onClose}
              onCompleted={(res) => {
                onClose();
                result.show(res);
              }}
            />
          </div>
        )}
      </Modal>
      {result.receipt}
    </>
  );
};
