import { Form, Input, Select } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import { districtsOf, REGIONS } from '@/shared/constants/regions';

interface Props {
  /** Forma ichidagi prefiks, masalan ['newPatient'] */
  prefix?: (string | number)[];
  required?: boolean;
}

/** Viloyat → tuman (bog'liq select) va manzil (textarea) */
export const AddressFields = ({ prefix = [], required = true }: Props) => {
  const form = Form.useFormInstance();
  const name = (n: string): NamePath => [...prefix, n];
  const region = Form.useWatch(name('region'), form) as string | undefined;
  const districts = districtsOf(region);

  return (
    <>
      <div className="grid gap-x-3 sm:grid-cols-2">
        <Form.Item name={name('region')} label="Viloyat" rules={[{ required, message: 'Viloyatni tanlang' }]}>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Viloyatni tanlang"
            options={REGIONS.map((r) => ({ value: r.name, label: r.name }))}
            onChange={() => form.setFieldValue(name('district'), undefined)}
          />
        </Form.Item>
        <Form.Item name={name('district')} label="Tuman / shahar" rules={[{ required, message: 'Tumanni tanlang' }]}>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder={region ? 'Tumanni tanlang' : 'Avval viloyatni tanlang'}
            disabled={!region}
            options={districts.map((d) => ({ value: d, label: d }))}
          />
        </Form.Item>
      </div>
      <Form.Item name={name('address')} label="Manzil" rules={[{ required, whitespace: true, message: 'Manzilni kiriting' }]}>
        <Input.TextArea rows={2} maxLength={200} placeholder="Mahalla, ko‘cha, uy va xonadon raqami" />
      </Form.Item>
    </>
  );
};
