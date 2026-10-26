import { App, Button, Form, InputNumber } from 'antd';
import { ListPlus } from '@/shared/icons';
import { useCallback } from 'react';
import { DoctorSelect, MoneyInput, ServiceSelect } from '@/shared/components/ui';
import { useCurrentUser } from '@/shared/hooks/usePermission';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import type { Service } from '@/modules/services';
import { useAddPlanItem } from '@/modules/treatments';

interface Values {
  serviceId: string;
  price: number;
  stage: number;
  doctorId: string;
}

/** Tish drawer'ida: xizmat tanlanadi → davolash rejasiga qator qo'shiladi */
export const AddToPlanForm = ({
  patientId,
  tooth,
  missing,
  onAdded,
}: {
  patientId: string;
  tooth: number;
  missing: boolean;
  onAdded: () => void;
}) => {
  const [form] = Form.useForm<Values>();
  const { message } = App.useApp();
  const user = useCurrentUser();
  const add = useAddPlanItem();
  // 10-qoida: yo'q tishga faqat implant yoki ortopediya
  const filter = useCallback(
    (s: Service) => s.perTooth && (!missing || s.code === 'S203' || s.category === 'Ortopediya'),
    [missing],
  );

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      initialValues={{ stage: 1, doctorId: user?.role === 'DOCTOR' ? user.staffId : undefined }}
      onFinish={(v) =>
        add.mutate(
          { patientId, tooth, serviceId: v.serviceId, price: v.price, stage: v.stage, discount: 0, doctorId: v.doctorId },
          {
            onSuccess: () => {
              message.success(`${tooth}-tish davolash rejasiga qo‘shildi`);
              form.resetFields(['serviceId', 'price']);
              onAdded();
            },
            onError: (e) => message.error(errorMessage(e)),
          },
        )
      }
    >
      <Form.Item name="serviceId" label="Xizmat" rules={[{ required: true, message: 'Xizmatni tanlang' }]}>
        <ServiceSelect filter={filter} onChange={(_, s) => s && form.setFieldValue('price', s.price)} />
      </Form.Item>
      <div className="grid grid-cols-[1fr_96px] gap-3">
        <Form.Item name="price" label="Narx" rules={[{ required: true, message: 'Narx' }]}>
          <MoneyInput />
        </Form.Item>
        <Form.Item name="stage" label="Bosqich" rules={[{ required: true }]}>
          <InputNumber min={1} max={9} className="w-full" />
        </Form.Item>
      </div>
      <Form.Item name="doctorId" label="Shifokor" rules={[{ required: true, message: 'Shifokorni tanlang' }]}>
        <DoctorSelect />
      </Form.Item>
      <Button htmlType="submit" block loading={add.isPending} icon={<ListPlus size={18} strokeWidth={1.5} />}>
        Davolash rejasiga qo‘shish
      </Button>
    </Form>
  );
};
