import { App, Form, Input, Modal, Radio } from 'antd';
import { CANCEL_REASONS } from '@/shared/constants/options';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { useCancelAppointment } from '../hooks/useAppointments';

/** Bekor qilish — sabab majburiy (4-qoida) */
export const CancelAppointmentModal = ({ id, onClose }: { id: string | null; onClose: () => void }) => {
  const [form] = Form.useForm<{ reason: string; custom?: string }>();
  const cancel = useCancelAppointment();
  const { message } = App.useApp();
  const reason = Form.useWatch('reason', form);

  return (
    <Modal
      open={!!id}
      onCancel={onClose}
      title="Qabulni bekor qilish"
      okText="Bekor qilish"
      okButtonProps={{ danger: true }}
      cancelText="Yopish"
      confirmLoading={cancel.isPending}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
        onFinish={(v) =>
          id &&
          cancel.mutate(
            { id, reason: v.reason === 'Boshqa sabab' ? (v.custom ?? '') : v.reason },
            {
              onSuccess: () => {
                message.success('Qabul bekor qilindi, eslatmalar to‘xtatildi');
                onClose();
              },
              onError: (e) => message.error(errorMessage(e)),
            },
          )
        }
      >
        <Form.Item name="reason" label="Sabab" rules={[{ required: true, message: 'Sababni tanlang' }]}>
          <Radio.Group className="flex flex-col gap-2" options={CANCEL_REASONS.map((r) => ({ value: r, label: r }))} />
        </Form.Item>
        {reason === 'Boshqa sabab' && (
          <Form.Item name="custom" label="Izoh" rules={[{ required: true, whitespace: true, message: 'Sababni yozing' }]}>
            <Input.TextArea rows={2} maxLength={200} autoFocus />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};
