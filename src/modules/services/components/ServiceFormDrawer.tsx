import { App, Button, Drawer, Form, Input, InputNumber, Select, Switch } from 'antd';
import { Plus, Trash2 } from '@/shared/icons';
import { useEffect, type ReactNode } from 'react';
import { MoneyInput } from '@/shared/components/ui';
import { SERVICE_CATEGORIES } from '@/shared/constants/options';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { useProducts } from '@/modules/inventory';
import { useSaveService } from '../hooks/useServices';
import type { Service, ServiceInput } from '../types';

interface Props {
  open: boolean;
  service?: Service | null;
  onClose: () => void;
}

const EMPTY: ServiceInput = {
  code: '',
  name: '',
  category: 'Terapiya',
  price: 0,
  durationMin: 30,
  perTooth: false,
  isActive: true,
  materials: [],
};

/** Forma bo'limi: sarlavha + ixtiyoriy izoh */
const Section = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <section className="flex flex-col">
    <div className="mb-3">
      <h4 className="m-0 text-base font-normal text-ink">{title}</h4>
      {hint && <p className="m-0 mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
    {children}
  </section>
);

/** Switch qatori: matn chapda, tugma o'ngda */
const ToggleRow = ({ name, label, hint }: { name: keyof ServiceInput; label: string; hint: string }) => (
  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md bg-subtle px-4 py-3">
    <span className="min-w-0">
      <span className="block text-sm text-ink">{label}</span>
      <span className="block text-xs text-muted">{hint}</span>
    </span>
    <Form.Item name={name} valuePropName="checked" noStyle>
      <Switch />
    </Form.Item>
  </label>
);

export const ServiceFormDrawer = ({ open, service, onClose }: Props) => {
  const [form] = Form.useForm<ServiceInput>();
  const { message } = App.useApp();
  const save = useSaveService();
  const { data: products = [] } = useProducts();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (open) form.setFieldsValue(service ?? EMPTY);
  }, [open, service, form]);

  const submit = (v: ServiceInput) =>
    save.mutate(
      { id: service?.id, input: { ...v, code: v.code.trim().toUpperCase(), materials: v.materials ?? [] } },
      {
        onSuccess: () => {
          message.success(service ? 'Xizmat yangilandi' : 'Xizmat qo‘shildi');
          onClose();
        },
        onError: (e) => message.error(errorMessage(e)),
      },
    );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={isMobile ? '100%' : 520}
      title={service ? 'Xizmatni tahrirlash' : 'Yangi xizmat'}
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
      <Form form={form} layout="vertical" onFinish={submit} initialValues={EMPTY} className="flex flex-col gap-6">
        <Section title="Asosiy ma’lumot">
          <div className="grid grid-cols-[104px_1fr] gap-3">
            <Form.Item name="code" label="Kod" rules={[{ required: true, message: 'Kod' }]}>
              <Input placeholder="T105" maxLength={8} />
            </Form.Item>
            <Form.Item name="name" label="Nomi" rules={[{ required: true, message: 'Nomini kiriting' }]}>
              <Input maxLength={120} />
            </Form.Item>
          </div>
          <Form.Item name="category" label="Kategoriya" rules={[{ required: true }]} className="mb-0">
            <Select options={SERVICE_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          </Form.Item>
        </Section>

        <Section title="Narx va vaqt" hint="Davomiylik kalendarda qabul blokining standart uzunligi">
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="price" label="Narx, so‘m" rules={[{ required: true, message: 'Narxni kiriting' }]} className="mb-0">
              <MoneyInput />
            </Form.Item>
            <Form.Item name="durationMin" label="Davomiylik" rules={[{ required: true }]} className="mb-0">
              <InputNumber min={5} max={240} step={5} suffix="daq." className="w-full" />
            </Form.Item>
          </div>
        </Section>

        <Section title="Sozlamalar">
          <div className="flex flex-col gap-2">
            <ToggleRow name="perTooth" label="Tish tanlash majburiy" hint="Narx har bir tish uchun hisoblanadi" />
            <ToggleRow name="isActive" label="Faol" hint="Nofaol xizmat yangi qabul va hisobda chiqmaydi" />
          </div>
        </Section>

        <Section title="Material normasi" hint="Qabul yakunlanganda ombordan avtomatik chiqim qilinadi">
          <Form.List name="materials">
            {(fields, { add, remove }) => (
              <div className="flex flex-col gap-2">
                {fields.map((f) => (
                  <div key={f.key} className="grid grid-cols-[1fr_96px_40px] items-start gap-2">
                    <Form.Item name={[f.name, 'productId']} rules={[{ required: true, message: 'Mahsulot' }]} className="mb-0">
                      <Select
                        showSearch
                        optionFilterProp="label"
                        placeholder="Mahsulot"
                        options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.unit})` }))}
                      />
                    </Form.Item>
                    <Form.Item name={[f.name, 'qty']} rules={[{ required: true, message: 'Miqdor' }]} className="mb-0">
                      <InputNumber min={0.01} step={0.1} placeholder="Miqdor" className="w-full" />
                    </Form.Item>
                    <Button shape="circle" aria-label="O‘chirish" icon={<Trash2 size={18} strokeWidth={1.5} />} onClick={() => remove(f.name)} />
                  </div>
                ))}
                <Button className="self-start" icon={<Plus size={18} strokeWidth={1.5} />} onClick={() => add({ qty: 1 })}>
                  Material qo‘shish
                </Button>
              </div>
            )}
          </Form.List>
        </Section>
      </Form>
    </Drawer>
  );
};
