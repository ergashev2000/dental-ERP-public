import { App, Form, InputNumber, Modal, Select } from 'antd';
import { useEffect } from 'react';
import { DoctorSelect, MoneyInput, ServiceSelect } from '@/shared/components/ui';
import { useCurrentUser } from '@/shared/hooks/usePermission';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { useAddPlanItem } from '../hooks/useTreatments';
import { toothOptions } from '../utils';

interface Values {
  stage: number;
  tooth?: number;
  serviceId: string;
  price: number;
  discount: number;
  doctorId: string;
}

export const PlanItemModal = ({ patientId, open, defaultStage, onClose }: { patientId: string; open: boolean; defaultStage: number; onClose: () => void }) => {
  const [form] = Form.useForm<Values>();
  const add = useAddPlanItem();
  const user = useCurrentUser();
  const { message } = App.useApp();

  useEffect(() => {
    if (open) form.setFieldsValue({ stage: defaultStage, discount: 0, doctorId: user?.role === 'DOCTOR' ? user.staffId : undefined });
  }, [open, defaultStage, form, user]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Rejaga qator qo‘shish"
      okText="Qo‘shish"
      cancelText="Bekor qilish"
      onOk={() => form.submit()}
      confirmLoading={add.isPending}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
        onFinish={(v) =>
          add.mutate(
            { patientId, ...v },
            {
              onSuccess: () => {
                message.success('Rejaga qo‘shildi');
                onClose();
              },
              onError: (e) => message.error(errorMessage(e)),
            },
          )
        }
      >
        <Form.Item name="serviceId" label="Xizmat" rules={[{ required: true, message: 'Xizmatni tanlang' }]}>
          <ServiceSelect onChange={(_, s) => s && form.setFieldValue('price', s.price)} />
        </Form.Item>
        <div className="grid grid-cols-2 gap-3">
          <Form.Item name="tooth" label="Tish">
            <Select allowClear showSearch placeholder="Tish (ixtiyoriy)" options={toothOptions} />
          </Form.Item>
          <Form.Item name="stage" label="Bosqich" rules={[{ required: true }]}>
            <InputNumber min={1} max={9} className="w-full" prefix="№" />
          </Form.Item>
        </div>
        <div className="grid grid-cols-[1fr_120px] gap-3">
          <Form.Item name="price" label="Narx" rules={[{ required: true, message: 'Narx' }]}>
            <MoneyInput />
          </Form.Item>
          <Form.Item name="discount" label="Chegirma">
            <InputNumber min={0} max={100} suffix="%" className="w-full" />
          </Form.Item>
        </div>
        <Form.Item name="doctorId" label="Shifokor" rules={[{ required: true, message: 'Shifokorni tanlang' }]}>
          <DoctorSelect />
        </Form.Item>
      </Form>
    </Modal>
  );
};
