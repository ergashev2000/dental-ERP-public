import { Alert, App, Button, DatePicker, Drawer, Form, Input, Segmented, Select, Switch } from 'antd';
import type { Dayjs } from 'dayjs';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import dayjs from '@/shared/lib/dayjs';
import { AddressFields, PhoneInput, phoneRules } from '@/shared/components/ui';
import { APPOINTMENT_SOURCES, PATIENT_TAGS } from '@/shared/constants/options';
import { ROUTES } from '@/shared/constants/routes';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { errorMessage, isApiError } from '@/shared/lib/mock/mockRequest';
import { ageFrom, isValidUzPhone } from '@/shared/utils/format';
import { patientsApi } from '../api/patientsApi';
import { useSavePatient } from '../hooks/usePatients';
import type { Patient, PatientInput, PatientRow } from '../types';

type Values = Omit<PatientInput, 'birthDate'> & { birthDate?: Dayjs };

interface Props {
  open: boolean;
  patient?: Patient | null;
  onClose: () => void;
  onSaved?: (p: PatientRow) => void;
}

const DEFAULTS: Partial<Values> = { gender: 'M', callConsent: true, tags: [], allergies: [], conditions: [], medications: [] };

/** Forma bo'limi: sarlavha + qisqa izoh, bo'limlar orasida bo'shliq (chiziq emas) */
const Section = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <section className="flex flex-col">
    <div className="mb-3">
      <h4 className="m-0 text-base font-normal text-ink">{title}</h4>
      {hint && <p className="m-0 mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
    {children}
  </section>
);

export const PatientFormDrawer = ({ open, patient, onClose, onSaved }: Props) => {
  const [form] = Form.useForm<Values>();
  const { message } = App.useApp();
  const save = useSavePatient();
  const isMobile = useIsMobile();
  const [duplicate, setDuplicate] = useState<{ id: string; name: string; cardNo: string } | null>(null);
  const birth = Form.useWatch('birthDate', form);
  const gender = Form.useWatch('gender', form);
  const age = birth ? ageFrom(birth.toISOString()) : null;

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(patient ? { ...patient, birthDate: patient.birthDate ? dayjs(patient.birthDate) : undefined } : DEFAULTS);
  }, [open, patient, form]);

  // 8-qoida: telefon unikal — kiritilganda darhol tekshiriladi
  const checkPhone = async (phone?: string) => {
    if (!phone || !isValidUzPhone(phone)) return setDuplicate(null);
    setDuplicate(await patientsApi.checkPhone(phone, patient?.id));
  };

  const submit = (v: Values) => {
    const input: PatientInput = {
      ...v,
      birthDate: v.birthDate?.format('YYYY-MM-DD'),
      guardian: v.guardian?.name ? v.guardian : undefined,
      pregnant: v.gender === 'F' ? v.pregnant : false,
    };
    save.mutate(
      { id: patient?.id, input },
      {
        onSuccess: (p) => {
          message.success(patient ? 'Bemor ma’lumotlari yangilandi' : `Bemor qo‘shildi: ${p.cardNo}`);
          onSaved?.(p);
          onClose();
        },
        onError: (e) => {
          if (isApiError(e) && e.data?.patientId) {
            setDuplicate({ id: e.data.patientId, name: e.message, cardNo: '' });
          }
          message.error(errorMessage(e));
        },
      },
    );
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      afterOpenChange={(o) => !o && setDuplicate(null)}
      width={isMobile ? '100%' : 560}
      title={patient ? 'Bemorni tahrirlash' : 'Yangi bemor'}
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
      <Form form={form} layout="vertical" onFinish={submit} initialValues={DEFAULTS} scrollToFirstError className="flex flex-col gap-6">
        <Section title="Asosiy" hint="Ism va telefon — kartani ochish uchun shu yetarli">
          <div className="grid gap-x-3 sm:grid-cols-2">
            <Form.Item name="lastName" label="Familiya" rules={[{ required: true, message: 'Familiyani kiriting' }]}>
              <Input maxLength={40} autoFocus={!patient} />
            </Form.Item>
            <Form.Item name="firstName" label="Ism" rules={[{ required: true, message: 'Ismni kiriting' }]}>
              <Input maxLength={40} />
            </Form.Item>
          </div>
          <div className="grid gap-x-3 sm:grid-cols-2">
            <Form.Item name="phone" label="Telefon" rules={phoneRules()} validateTrigger="onBlur">
              <PhoneInput onBlur={(e) => void checkPhone(form.getFieldValue('phone') ?? e.target.value)} />
            </Form.Item>
            <Form.Item name="phone2" label="Qo‘shimcha telefon" rules={phoneRules(false)}>
              <PhoneInput />
            </Form.Item>
          </div>
          {duplicate && (
            <Alert
              type="warning"
              showIcon
              className="mb-4"
              message={duplicate.cardNo ? `Bu raqam bilan bemor mavjud: ${duplicate.name} (${duplicate.cardNo})` : duplicate.name}
              action={
                <Link to={ROUTES.patient(duplicate.id)} onClick={onClose}>
                  <Button size="small">Kartani ochish</Button>
                </Link>
              }
            />
          )}
        </Section>

        <Section title="Shaxsiy ma’lumotlar">
          <Form.Item name="middleName" label="Otasining ismi">
            <Input maxLength={40} />
          </Form.Item>
          <div className="grid gap-x-3 sm:grid-cols-2">
            <Form.Item
              name="birthDate"
              label={<span>Tug‘ilgan sana {age !== null && <span className="ml-1 text-muted">· {age} yosh</span>}</span>}
            >
              <DatePicker format="DD.MM.YYYY" className="w-full" disabledDate={(d) => d.isAfter(dayjs())} placeholder="KK.OO.YYYY" />
            </Form.Item>
            <Form.Item name="gender" label="Jins" rules={[{ required: true, message: 'Jinsni tanlang' }]}>
              <Segmented block options={[{ value: 'M', label: 'Erkak' }, { value: 'F', label: 'Ayol' }]} />
            </Form.Item>
          </div>
        </Section>

        {age !== null && age < 18 && (
          <Section title="Ota-ona (vasiy)" hint={age < 14 ? '14 yoshgacha bemor uchun majburiy' : undefined}>
            <div className="grid gap-x-3 sm:grid-cols-2">
              <Form.Item name={['guardian', 'name']} label="F.I.O." rules={[{ required: age < 14, message: 'Vasiy ismini kiriting' }]}>
                <Input />
              </Form.Item>
              <Form.Item name={['guardian', 'phone']} label="Telefon" rules={phoneRules(age < 14)}>
                <PhoneInput />
              </Form.Item>
            </div>
          </Section>
        )}

        <Section title="Manzil">
          {/* TZ: yangi bemor uchun ism + telefon yetarli; manzil ixtiyoriy */}
          <AddressFields required={false} />
        </Section>

        <Section title="Tibbiy ogohlantirishlar" hint="Allergiya va kasalliklar bemor kartasi tepasida doim ko‘rinadi">
          <Form.Item name="allergies" label="Allergiyalar">
            <Select mode="tags" placeholder="Masalan: Lidokain, Penitsillin" open={false} tokenSeparators={[',']} />
          </Form.Item>
          <Form.Item name="conditions" label="Surunkali kasalliklar">
            <Select mode="tags" placeholder="Masalan: Gipertoniya" open={false} tokenSeparators={[',']} />
          </Form.Item>
          <Form.Item name="medications" label="Doimiy qabul qiladigan dorilar">
            <Select mode="tags" placeholder="Vergul bilan ajrating" open={false} tokenSeparators={[',']} />
          </Form.Item>
          {gender === 'F' && (
            <Form.Item name="pregnant" label="Homiladorlik" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Section>

        <Section title="Qo‘shimcha">
          <div className="grid gap-x-3 sm:grid-cols-2">
            <Form.Item name="source" label="Qanday bilib kelgan">
              <Select allowClear placeholder="Tanlang" options={APPOINTMENT_SOURCES.map((s) => ({ value: s.value, label: s.label }))} />
            </Form.Item>
            <Form.Item name="tags" label="Teglar">
              <Select mode="multiple" placeholder="Tanlang" options={PATIENT_TAGS.map((t) => ({ value: t.value, label: t.label }))} />
            </Form.Item>
          </div>
          <Form.Item name="callConsent" label="Qo‘ng‘iroq orqali eslatishga rozi" valuePropName="checked" className="mb-0">
            <Switch />
          </Form.Item>
        </Section>
      </Form>
    </Drawer>
  );
};
