import { App, Button, Drawer, Form, Input, Select, Switch } from 'antd';
import { Check } from '@/shared/icons';
import { useEffect, type ReactNode } from 'react';
import { PhoneInput, phoneRules, UserAvatar } from '@/shared/components/ui';
import { POSITIONS, SPECIALTIES } from '@/shared/constants/options';
import { staffColors, type StaffColor } from '@/shared/theme/tokens';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { cn } from '@/shared/utils/cn';
import { useSaveStaff } from '../hooks/useStaff';
import type { Staff, StaffInput } from '../types';

/** Faqat 6 ta tayyor tonal rangdan tanlash */
const ColorPicker = ({ value, onChange }: { value?: StaffColor; onChange?: (v: StaffColor) => void }) => (
  <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Kalendar rangi">
    {(Object.keys(staffColors) as StaffColor[]).map((k) => (
      <button
        key={k}
        type="button"
        role="radio"
        aria-checked={value === k}
        aria-label={staffColors[k].label}
        title={staffColors[k].label}
        onClick={() => onChange?.(k)}
        className={cn(
          'grid size-10 cursor-pointer place-items-center rounded-full border-0 transition-shadow duration-150',
          value === k ? 'ring-2 ring-ink ring-offset-2' : 'hover:ring-2 hover:ring-line hover:ring-offset-2',
        )}
        style={{ background: staffColors[k].soft }}
      >
        {value === k ? (
          <Check size={18} strokeWidth={1.5} className="rounded-full p-0.5 text-on-ink" style={{ background: staffColors[k].base }} />
        ) : (
          <span className="size-2.5 rounded-full" style={{ background: staffColors[k].base }} />
        )}
      </button>
    ))}
  </div>
);

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

export const StaffFormDrawer = ({ open, staff, onClose }: { open: boolean; staff?: Staff | null; onClose: () => void }) => {
  const [form] = Form.useForm<StaffInput>();
  const { message } = App.useApp();
  const save = useSaveStaff();
  const isMobile = useIsMobile();
  const position = Form.useWatch('position', form);
  const fullName = Form.useWatch('fullName', form);
  const color = Form.useWatch('color', form);

  useEffect(() => {
    if (open) form.setFieldsValue(staff ?? { fullName: '', position: 'DOCTOR', phone: '', color: 'primary', isActive: true });
  }, [open, staff, form]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={isMobile ? '100%' : 480}
      title={staff ? 'Xodimni tahrirlash' : 'Yangi xodim'}
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
        className="flex flex-col gap-6"
        onFinish={(input) =>
          save.mutate(
            { id: staff?.id, input: { ...input, specialty: input.position === 'DOCTOR' ? input.specialty : undefined } },
            {
              onSuccess: () => {
                message.success('Saqlandi');
                onClose();
              },
              onError: (e) => message.error(errorMessage(e)),
            },
          )
        }
      >
        <Section title="Shaxsiy ma’lumot">
          <Form.Item name="fullName" label="F.I.O." rules={[{ required: true, message: 'Ismni kiriting' }]}>
            <Input maxLength={80} />
          </Form.Item>
          <Form.Item name="phone" label="Telefon" rules={phoneRules()} className="mb-0">
            <PhoneInput />
          </Form.Item>
        </Section>

        <Section title="Lavozim" hint="Tizimdagi ruxsatlar foydalanuvchi roliga bog‘liq (Sozlamalar → Foydalanuvchilar)">
          <Form.Item name="position" label="Lavozim" rules={[{ required: true }]} className={position === 'DOCTOR' ? undefined : 'mb-0'}>
            <Select options={POSITIONS.map((p) => ({ value: p.value, label: p.label }))} />
          </Form.Item>
          {position === 'DOCTOR' && (
            <Form.Item name="specialty" label="Mutaxassislik" rules={[{ required: true, message: 'Mutaxassislikni tanlang' }]} className="mb-0">
              <Select options={SPECIALTIES.map((s) => ({ value: s, label: s }))} />
            </Form.Item>
          )}
        </Section>

        <Section title="Kalendar" hint="Rang kalendar, qabullar va hisobotlarda xodimni ajratadi">
          <div className="flex items-center gap-4">
            <UserAvatar name={fullName || 'Yangi xodim'} color={color} size={48} />
            <Form.Item name="color" rules={[{ required: true }]} className="mb-0">
              <ColorPicker />
            </Form.Item>
          </div>
        </Section>

        <Section title="Holat">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md bg-subtle px-4 py-3">
            <span className="min-w-0">
              <span className="block text-sm text-ink">Faol</span>
              <span className="block text-xs text-muted">Nofaol xodimga yangi qabul yozilmaydi</span>
            </span>
            <Form.Item name="isActive" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
          </label>
        </Section>
      </Form>
    </Drawer>
  );
};
