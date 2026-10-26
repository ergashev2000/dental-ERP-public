import { App, Button, DatePicker, Drawer, Form, Input, InputNumber, Segmented, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import { UserPlus, X } from '@/shared/icons';
import { useEffect, useState, type ReactNode } from 'react';
import dayjs from '@/shared/lib/dayjs';
import { DoctorSelect, MoneyInput, PatientSelect } from '@/shared/components/ui';
import { ORTHO_APPLIANCE, ORTHO_JAW, ORTHO_STAGE, ORTHO_STATUS } from '@/shared/constants/status';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { formatMoney } from '@/shared/utils/format';
import { useSavePatient, type Gender } from '@/modules/patients';
import { NewPatientFields } from '@/modules/appointments';
import { useDoctors } from '@/modules/staff';
import { useSaveOrthoCase } from '../hooks/useOrtho';
import { ORTHO_STAGES, type OrthoAppliance, type OrthoCase, type OrthoCaseView, type OrthoJaw, type OrthoStage, type OrthoStatus } from '../types';

interface Values {
  patientId?: string;
  newPatient?: { lastName: string; firstName: string; phone: string; birthDate?: Dayjs; gender?: Gender; region?: string; district?: string; address?: string };
  doctorId: string;
  appliance: OrthoAppliance;
  jaw: OrthoJaw;
  startDate: Dayjs;
  stage: OrthoStage;
  status?: OrthoStatus;
  plannedMonths: number;
  visitIntervalDays: number;
  totalPrice: number;
  initialPayment: number;
  monthlyPayment: number;
  note?: string;
}

const INTERVALS = [14, 21, 28, 30, 45, 60, 90];
const intervalLabel = (d: number) => (d === 30 ? 'Har 30 kunda (oyiga 1 marta)' : d % 7 === 0 && d < 60 ? `Har ${d / 7} haftada (${d} kun)` : `Har ${d} kunda`);

/** Oylik to'lovni hisoblash: qoldiq / oylar, 10 000 ga yaxlitlab */
const suggestMonthly = (total = 0, initial = 0, months = 0) => (months > 0 && total > initial ? Math.ceil((total - initial) / months / 10_000) * 10_000 : 0);

/** Forma bo'limi: sarlavha + maydonlar; bo'limlar orasida bo'shliq (chegara yo'q) */
const Section = ({ title, children, last }: { title: string; children: ReactNode; last?: boolean }) => (
  <section className={last ? undefined : 'mb-6'}>
    <h4 className="m-0 mb-3 text-base font-normal text-ink">{title}</h4>
    {children}
  </section>
);

interface Props {
  open: boolean;
  onClose: () => void;
  /** Tahrirlash */
  orthoCase?: OrthoCase | null;
  /** Bemor kartasidan ochilganda */
  patientId?: string;
  onSaved?: (c: OrthoCaseView) => void;
}

/** Breketli bemor qo'shish / davolashni tahrirlash */
export const OrthoCaseFormDrawer = ({ open, onClose, orthoCase, patientId, onSaved }: Props) => {
  const [form] = Form.useForm<Values>();
  const { message } = App.useApp();
  const isMobile = useIsMobile();
  const save = useSaveOrthoCase();
  const savePatient = useSavePatient();
  const { data: doctors = [] } = useDoctors();
  const [newPatient, setNewPatient] = useState(false);
  const editing = !!orthoCase;

  const total = Form.useWatch('totalPrice', form) as number | undefined;
  const initial = Form.useWatch('initialPayment', form) as number | undefined;
  const monthly = Form.useWatch('monthlyPayment', form) as number | undefined;
  const months = Form.useWatch('plannedMonths', form) as number | undefined;
  const payMonths = monthly && total && total > (initial ?? 0) ? Math.ceil((total - (initial ?? 0)) / monthly) : 0;

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    const ortho = doctors.find((d) => d.isActive && d.specialty === 'Ortodont');
    form.setFieldsValue(
      orthoCase
        ? { ...orthoCase, startDate: dayjs(orthoCase.startDate) }
        : {
            patientId,
            doctorId: ortho?.id,
            appliance: 'METAL',
            jaw: 'BOTH',
            startDate: dayjs(),
            stage: 'CONSULTATION',
            plannedMonths: 18,
            visitIntervalDays: 30,
            totalPrice: 0,
            initialPayment: 0,
            monthlyPayment: 0,
          },
    );
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- faqat oyna ochilganda to'ldiriladi
  }, [open]);

  const startNew = (text = '') => {
    setNewPatient(true);
    const digits = text.replace(/\D/g, '');
    const isPhone = digits.length >= 5 && /^[\d\s()+-]+$/.test(text);
    const [lastName = '', ...rest] = isPhone ? [] : text.split(/\s+/).filter(Boolean);
    form.setFieldValue('patientId', undefined);
    form.setFieldValue(
      'newPatient',
      isPhone ? { phone: `+998${(digits.startsWith('998') && digits.length > 9 ? digits.slice(3) : digits).slice(0, 9)}` } : { lastName, firstName: rest.join(' ') },
    );
  };

  const submit = async (v: Values) => {
    try {
      let pid = orthoCase?.patientId ?? v.patientId;
      if (!editing && newPatient && v.newPatient) {
        const np = v.newPatient;
        const created = await savePatient.mutateAsync({
          input: { ...np, birthDate: np.birthDate?.format('YYYY-MM-DD'), tags: ['ORTHO'], allergies: [], conditions: [], medications: [], callConsent: true },
        });
        pid = created.id;
      }
      const res = await save.mutateAsync({
        id: orthoCase?.id,
        input: {
          patientId: pid!,
          doctorId: v.doctorId,
          appliance: v.appliance,
          jaw: v.jaw,
          startDate: v.startDate.format('YYYY-MM-DD'),
          stage: v.stage,
          status: v.status,
          plannedMonths: v.plannedMonths,
          visitIntervalDays: v.visitIntervalDays,
          totalPrice: v.totalPrice ?? 0,
          initialPayment: v.initialPayment ?? 0,
          monthlyPayment: v.monthlyPayment ?? 0,
          note: v.note,
        },
      });
      message.success(editing ? 'O‘zgarishlar saqlandi' : `${res.patientName} breketli bemorlar ro‘yxatiga qo‘shildi`);
      onSaved?.(res);
      onClose();
    } catch (e) {
      message.error(errorMessage(e));
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      afterOpenChange={(o) => !o && setNewPatient(false)}
      width={isMobile ? '100%' : 600}
      title={editing ? 'Breket davolashini tahrirlash' : 'Breketli bemor qo‘shish'}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Bekor qilish</Button>
          <Button type="primary" loading={save.isPending || savePatient.isPending} onClick={() => form.submit()}>
            Saqlash
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={(x) => void submit(x)} requiredMark={false}>
        {!editing && (
          <Section title="Bemor">
            <div className="flex flex-wrap items-end gap-x-2">
              {!newPatient && (
                <Form.Item name="patientId" label="Bemor" rules={[{ required: true, message: 'Bemorni tanlang yoki yangisini qo‘shing' }]} className="min-w-0 flex-1 basis-60">
                  <PatientSelect autoFocus onCreate={startNew} />
                </Form.Item>
              )}
              <Button
                className="mb-6"
                icon={newPatient ? <X size={18} strokeWidth={1.5} /> : <UserPlus size={18} strokeWidth={1.5} />}
                onClick={() => (newPatient ? setNewPatient(false) : startNew())}
              >
                {newPatient ? 'Mavjud bemorni tanlash' : 'Yangi bemor'}
              </Button>
            </div>
            {newPatient && (
              <NewPatientFields
                onPickExisting={(id) => {
                  setNewPatient(false);
                  form.setFieldsValue({ patientId: id, newPatient: undefined });
                }}
              />
            )}
          </Section>
        )}

        <Section title="Davolash">
          <div className="grid gap-x-3 sm:grid-cols-2">
            <Form.Item name="doctorId" label="Shifokor (ortodont)" rules={[{ required: true, message: 'Shifokorni tanlang' }]}>
              <DoctorSelect />
            </Form.Item>
            <Form.Item name="startDate" label="Davolash boshlangan sana" rules={[{ required: true, message: 'Sanani tanlang' }]}>
              <DatePicker format="DD.MM.YYYY" className="w-full" allowClear={false} />
            </Form.Item>
            <Form.Item name="appliance" label="Breket turi">
              <Select options={Object.entries(ORTHO_APPLIANCE).map(([value, label]) => ({ value, label }))} />
            </Form.Item>
            <Form.Item name="jaw" label="Jag‘">
              <Segmented block options={Object.entries(ORTHO_JAW).map(([value, label]) => ({ value, label: label.replace(' jag‘', '') }))} />
            </Form.Item>
            <Form.Item name="stage" label="Hozirgi bosqich" className={editing ? undefined : 'sm:col-span-2'}>
              <Select options={ORTHO_STAGES.map((s) => ({ value: s, label: ORTHO_STAGE[s].label }))} />
            </Form.Item>
            {editing && (
              <Form.Item name="status" label="Holat">
                <Select options={Object.entries(ORTHO_STATUS).map(([value, m]) => ({ value, label: m.label }))} />
              </Form.Item>
            )}
          </div>
        </Section>

        <Section title="Kelish rejasi">
          <div className="grid gap-x-3 sm:grid-cols-2">
            <Form.Item name="plannedMonths" label="Taxminiy muddat" rules={[{ required: true, message: 'Muddatni kiriting' }]}>
              <InputNumber min={1} max={60} suffix="oy" className="w-full" />
            </Form.Item>
            <Form.Item
              name="visitIntervalDays"
              label="Qanchada bir kelishi kerak"
              tooltip="Shu muddatdan oshsa, bemor ro‘yxatda «kechikdi» deb belgilanadi"
            >
              <Select options={INTERVALS.map((d) => ({ value: d, label: intervalLabel(d) }))} />
            </Form.Item>
          </div>
        </Section>

        <Section title="To‘lov rejasi">
          <div className="grid gap-x-3 sm:grid-cols-3">
            <Form.Item name="totalPrice" label="Umumiy summa">
              <MoneyInput currency={false} />
            </Form.Item>
            <Form.Item
              name="initialPayment"
              label="Boshlang‘ich to‘lov"
              dependencies={['totalPrice']}
              rules={[
                {
                  validator: (_, v?: number) =>
                    (v ?? 0) <= (form.getFieldValue('totalPrice') ?? 0) ? Promise.resolve() : Promise.reject(new Error('Umumiy summadan oshmasin')),
                },
              ]}
            >
              <MoneyInput currency={false} max={total} />
            </Form.Item>
            <Form.Item
              name="monthlyPayment"
              label="Oylik to‘lov"
              dependencies={['totalPrice', 'initialPayment']}
              rules={[
                {
                  validator: (_, v?: number) =>
                    (form.getFieldValue('totalPrice') ?? 0) > (form.getFieldValue('initialPayment') ?? 0) && !v
                      ? Promise.reject(new Error('Oylik to‘lov miqdorini kiriting'))
                      : Promise.resolve(),
                },
              ]}
              extra={
                suggestMonthly(total, initial, months) > 0 && suggestMonthly(total, initial, months) !== monthly ? (
                  <button
                    type="button"
                    className="cursor-pointer border-0 bg-transparent p-0 text-xs text-ink underline underline-offset-2"
                    onClick={() => form.setFieldValue('monthlyPayment', suggestMonthly(total, initial, months))}
                  >
                    Hisoblash: {formatMoney(suggestMonthly(total, initial, months))}
                  </button>
                ) : undefined
              }
            >
              <MoneyInput currency={false} />
            </Form.Item>
          </div>
          {total ? (
            <div className="rounded-md bg-subtle px-4 py-3 text-sm">
              <div className="text-ink">
                {payMonths > 0
                  ? `Boshlanishda ${formatMoney(initial ?? 0)}, keyin ${payMonths} oy davomida har oy ${formatMoney(monthly ?? 0)}`
                  : `To‘liq summa: ${formatMoney(total)}`}
              </div>
              <div className="mt-1 text-xs text-muted">To‘lovlar «To‘lov qabul qilish» orqali olinadi va kassaga tushadi.</div>
            </div>
          ) : (
            <div className="text-xs text-muted">Narx hali kelishilmagan bo‘lsa, 0 qoldiring — keyin tahrirlab qo‘shasiz.</div>
          )}
        </Section>

        <Section title="Izoh" last>
          <Form.Item name="note" className="mb-0">
            <Input.TextArea rows={2} maxLength={300} placeholder="Masalan: faqat yuqori jag‘, elastiklar kerak" aria-label="Izoh" />
          </Form.Item>
        </Section>
      </Form>
    </Drawer>
  );
};
