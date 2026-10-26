import { Alert, Button, DatePicker, Form, Input, Radio } from 'antd';
import { ChevronDown, ChevronUp } from '@/shared/icons';
import { useState } from 'react';
import dayjs from '@/shared/lib/dayjs';
import { AddressFields, PhoneInput, phoneRules } from '@/shared/components/ui';
import { usePhoneOwner } from '@/modules/patients';

interface Props {
  /** Telefon boshqa bemorga tegishli bo'lsa — o'sha bemorni tanlash */
  onPickExisting: (patientId: string) => void;
}

/**
 * Qabul formasi ichidagi tezkor "Yangi bemor" formasi.
 * Majburiy: familiya, ism, telefon. Qolganlari — ixtiyoriy, yig'ilgan blokda.
 */
export const NewPatientFields = ({ onPickExisting }: Props) => {
  const form = Form.useFormInstance();
  const phone = Form.useWatch(['newPatient', 'phone'], form) as string | undefined;
  const { data: owner } = usePhoneOwner(phone);
  const [more, setMore] = useState(false);

  return (
    <div className="mb-4 rounded-md bg-subtle p-4">
      <div className="grid gap-x-3 sm:grid-cols-2">
        <Form.Item name={['newPatient', 'lastName']} label="Familiya" rules={[{ required: true, whitespace: true, message: 'Familiyani kiriting' }]}>
          <Input maxLength={40} />
        </Form.Item>
        <Form.Item name={['newPatient', 'firstName']} label="Ism" rules={[{ required: true, whitespace: true, message: 'Ismni kiriting' }]}>
          <Input maxLength={40} />
        </Form.Item>
      </div>
      <Form.Item name={['newPatient', 'phone']} label="Telefon" rules={phoneRules()} className={owner ? 'mb-3' : undefined}>
        <PhoneInput />
      </Form.Item>
      {owner && (
        <Alert
          type="warning"
          showIcon
          className="mb-4"
          message={`Bu raqam bilan bemor bor: ${owner.name} (${owner.cardNo})`}
          description="Bir bemorni ikki marta qo‘shmaslik uchun mavjud bemorni tanlang."
          action={
            <Button size="small" type="primary" onClick={() => onPickExisting(owner.id)}>
              Shu bemorni tanlash
            </Button>
          }
        />
      )}

      <button
        type="button"
        onClick={() => setMore((x) => !x)}
        className="flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-sm font-medium text-ink"
      >
        {more ? <ChevronUp size={16} strokeWidth={1.5} /> : <ChevronDown size={16} strokeWidth={1.5} />}
        Qo‘shimcha ma’lumot (ixtiyoriy): tug‘ilgan sana, jins, manzil
      </button>
      {/* Yopiq bo‘lsa ham qiymatlar formada saqlanadi */}
      <div className={more ? 'mt-4' : 'hidden'}>
        <div className="grid gap-x-3 sm:grid-cols-2">
          <Form.Item name={['newPatient', 'birthDate']} label="Tug‘ilgan sana">
            <DatePicker format="DD.MM.YYYY" placeholder="KK.OO.YYYY" className="w-full" disabledDate={(d) => d.isAfter(dayjs())} />
          </Form.Item>
          <Form.Item name={['newPatient', 'gender']} label="Jins">
            <Radio.Group optionType="button" options={[{ value: 'M', label: 'Erkak' }, { value: 'F', label: 'Ayol' }]} />
          </Form.Item>
        </div>
        <AddressFields prefix={['newPatient']} required={false} />
      </div>
    </div>
  );
};
