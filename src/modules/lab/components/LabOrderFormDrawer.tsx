import { App, Button, DatePicker, Drawer, Form, Input, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from '@/shared/lib/dayjs';
import { DoctorSelect, MoneyInput, PatientSelect } from '@/shared/components/ui';
import { useCurrentUser } from '@/shared/hooks/usePermission';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { SHADES, TEETH_OPTIONS, WHOLE_JAW_WORK, WORK_TYPE_OPTIONS } from '../constants';
import { useLabs, useSaveLabOrder } from '../hooks/useLab';
import type { LabOrderInput, LabOrderView, LabWorkType } from '../types';

interface FormValues extends Omit<LabOrderInput, 'sentDate' | 'dueDate'> {
  sentDate?: Dayjs | null;
  dueDate?: Dayjs;
}

interface Props {
  open: boolean;
  /** Tahrirlash uchun; yo‘q bo‘lsa — yangi buyurtma */
  order?: LabOrderView | null;
  /** Bemor kartasidan ochilganda bemor oldindan tanlangan va o‘zgarmaydi */
  patientId?: string;
  onClose: () => void;
}

const ISO = 'YYYY-MM-DD';

/** Laboratoriyaga buyurtma berish / tahrirlash */
export const LabOrderFormDrawer = ({ open, order, patientId, onClose }: Props) => {
  const [form] = Form.useForm<FormValues>();
  const save = useSaveLabOrder();
  const { data: labs = [] } = useLabs();
  const { message } = App.useApp();
  const isMobile = useIsMobile();
  const user = useCurrentUser();
  const workType = Form.useWatch('workType', form) as LabWorkType | undefined;
  const wholeJaw = !!workType && WHOLE_JAW_WORK.includes(workType);

  /** Drawer yopilganda forma yo‘q qilinadi (destroyOnHidden) — har ochilishda boshlang‘ich qiymatlar qaytadan olinadi */
  const initialValues = (): FormValues => {
    if (order) return { ...order, sentDate: order.sentDate ? dayjs(order.sentDate) : null, dueDate: dayjs(order.dueDate) };
    const lab = labs[0];
    return {
      patientId: patientId ?? '',
      doctorId: user?.role === 'DOCTOR' ? user.staffId : '',
      teeth: [],
      workType: 'PFM_CROWN',
      labId: lab?.id ?? '',
      sentDate: dayjs(),
      dueDate: dayjs().add(lab?.leadDays ?? 7, 'day'),
      price: 0,
    };
  };

  /** Laboratoriya yoki yuborish sanasi o‘zgarsa — muddatni laboratoriyaning odatiy muddati bo‘yicha taklif qilamiz */
  const suggestDue = (labId?: string, sent?: Dayjs | null) => {
    if (order) return;
    const lab = labs.find((l) => l.id === labId);
    if (lab) form.setFieldValue('dueDate', (sent ?? dayjs()).add(lab.leadDays, 'day'));
  };

  const submit = (v: FormValues) => {
    const input: LabOrderInput = {
      ...v,
      teeth: [...(v.teeth ?? [])].sort((a, b) => a - b),
      sentDate: v.sentDate ? v.sentDate.format(ISO) : undefined,
      dueDate: (v.dueDate ?? dayjs()).format(ISO),
      price: v.price ?? 0,
    };
    save.mutate(
      { id: order?.id, input },
      {
        onSuccess: (o) => {
          message.success(order ? 'Buyurtma saqlandi' : `${o.number} buyurtmasi yaratildi`);
          onClose();
        },
        onError: (e) => message.error(errorMessage(e)),
      },
    );
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={isMobile ? '100%' : 480}
      title={order ? `Buyurtma ${order.number}` : 'Laboratoriyaga buyurtma'}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Bekor qilish</Button>
          <Button type="primary" loading={save.isPending} onClick={() => form.submit()}>
            Saqlash
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={initialValues()}
        onFinish={submit}
        onValuesChange={(changed: Partial<FormValues>, all) => {
          if ('labId' in changed || 'sentDate' in changed) suggestDue(all.labId, all.sentDate);
        }}
      >
        <Form.Item name="patientId" label="Bemor" rules={[{ required: true, message: 'Bemorni tanlang' }]}>
          <PatientSelect disabled={!!patientId || !!order} />
        </Form.Item>
        <Form.Item name="doctorId" label="Shifokor" rules={[{ required: true, message: 'Shifokorni tanlang' }]}>
          <DoctorSelect />
        </Form.Item>
        <div className="grid gap-x-3 sm:grid-cols-2">
          <Form.Item name="workType" label="Ish turi" rules={[{ required: true, message: 'Ish turini tanlang' }]}>
            <Select options={WORK_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="shade" label="Rang (VITA)">
            <Select allowClear showSearch placeholder="Masalan, A2" options={SHADES.map((s) => ({ value: s, label: s }))} />
          </Form.Item>
        </div>
        <Form.Item
          name="teeth"
          label={wholeJaw ? 'Tishlar (ixtiyoriy — butun jag‘)' : 'Tishlar (FDI)'}
          rules={[{ required: !wholeJaw, type: 'array', min: wholeJaw ? 0 : 1, message: 'Kamida bitta tish tanlang' }]}
        >
          <Select mode="multiple" allowClear placeholder="16, 17 …" options={TEETH_OPTIONS} maxTagCount="responsive" />
        </Form.Item>
        <Form.Item name="labId" label="Laboratoriya" rules={[{ required: true, message: 'Laboratoriyani tanlang' }]}>
          <Select
            options={labs.map((l) => ({
              value: l.id,
              label: (
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate">{l.name}</span>
                  <span className="text-xs text-muted">~{l.leadDays} kun</span>
                </span>
              ),
            }))}
          />
        </Form.Item>
        <div className="grid gap-x-3 sm:grid-cols-2">
          <Form.Item name="sentDate" label="Yuborilgan sana">
            <DatePicker format="DD.MM.YYYY" className="w-full" placeholder="Hali yuborilmagan" />
          </Form.Item>
          <Form.Item name="dueDate" label="Qaytish muddati" rules={[{ required: true, message: 'Muddatni kiriting' }]}>
            <DatePicker format="DD.MM.YYYY" className="w-full" allowClear={false} />
          </Form.Item>
        </div>
        <Form.Item name="price" label="Laboratoriya narxi">
          <MoneyInput />
        </Form.Item>
        <Form.Item name="note" label="Izoh texnik uchun" className="mb-0">
          <Input.TextArea rows={3} placeholder="Okklyuziya, shakl, rang tafsilotlari" maxLength={500} />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
