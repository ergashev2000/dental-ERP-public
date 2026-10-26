import { App, Button, Form, Input, Segmented, TimePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import { useEffect } from 'react';
import dayjs from '@/shared/lib/dayjs';
import { PhoneInput, phoneRules } from '@/shared/components/ui';
import { WEEKDAYS } from '@/shared/constants/options';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { cn } from '@/shared/utils/cn';
import { useClinic, useUpdateClinic } from '../hooks/useSettings';
import type { ClinicSettings } from '../types';
import { SettingsSection } from './SettingsSection';

interface Values {
  name: string;
  address: string;
  phone: string;
  workDays: number[];
  hours: [Dayjs, Dayjs];
  slotStep: ClinicSettings['slotStep'];
}

const toValues = (d: ClinicSettings): Values => ({
  name: d.name,
  address: d.address,
  phone: d.phone,
  workDays: d.workDays,
  hours: [dayjs(d.workStart, 'HH:mm'), dayjs(d.workEnd, 'HH:mm')],
  slotStep: d.slotStep,
});

/** Ish kunlari: 7 ta doira-tugma (tanlangani — ink). Form.Item ichida value/onChange oladi */
const WeekdayPicker = ({ value = [], onChange }: { value?: number[]; onChange?: (v: number[]) => void }) => (
  <div role="group" aria-label="Ish kunlari" className="flex flex-wrap gap-1.5">
    {WEEKDAYS.map((w) => {
      const on = value.includes(w.value);
      return (
        <button
          key={w.value}
          type="button"
          title={w.label}
          aria-label={w.label}
          aria-pressed={on}
          onClick={() => onChange?.(on ? value.filter((d) => d !== w.value) : [...value, w.value].sort((a, b) => a - b))}
          className={cn(
            'grid size-11 cursor-pointer place-items-center rounded-full border-0 font-sans text-sm transition-[transform,background-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-95',
            on ? 'bg-ink text-on-ink' : 'bg-subtle text-muted hover:bg-subtle-strong',
          )}
        >
          {w.short}
        </button>
      );
    })}
  </div>
);

export const ClinicTab = () => {
  const { data } = useClinic();
  const update = useUpdateClinic();
  const { message } = App.useApp();
  const [form] = Form.useForm<Values>();
  const days = Form.useWatch('workDays', form);
  const hours = Form.useWatch('hours', form);
  const step = Form.useWatch('slotStep', form);

  useEffect(() => {
    if (data) form.setFieldsValue(toValues(data));
  }, [data, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      className="flex flex-col gap-4"
      onFinish={(v) =>
        update.mutate(
          {
            name: v.name,
            address: v.address,
            phone: v.phone,
            workDays: v.workDays,
            workStart: v.hours[0].format('HH:mm'),
            workEnd: v.hours[1].format('HH:mm'),
            slotStep: v.slotStep,
          },
          { onSuccess: () => message.success('Klinika ma’lumotlari saqlandi'), onError: (e) => message.error(errorMessage(e)) },
        )
      }
    >
      <SettingsSection title="Asosiy ma’lumotlar" description="Chek, hujjatlar va bemorlarga yuboriladigan eslatmalarda shu nom, manzil va telefon ko‘rinadi.">
        <Form.Item name="name" label="Klinika nomi" rules={[{ required: true, message: 'Nomini kiriting' }]}>
          <Input maxLength={80} />
        </Form.Item>
        <Form.Item name="address" label="Manzil" rules={[{ required: true, message: 'Manzilni kiriting' }]}>
          <Input maxLength={200} />
        </Form.Item>
        <Form.Item name="phone" label="Telefon" rules={phoneRules()} className="mb-0 sm:max-w-80">
          <PhoneInput />
        </Form.Item>
      </SettingsSection>

      <SettingsSection
        title="Ish vaqti"
        description="Qabullar kalendari shu kunlar va soatlar bo‘yicha chiziladi. Ish vaqtidan tashqari kataklar kulrang bo‘ladi."
      >
        <Form.Item name="workDays" label="Ish kunlari" rules={[{ required: true, message: 'Kamida bitta kun' }]}>
          <WeekdayPicker />
        </Form.Item>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Form.Item name="hours" label="Ish soatlari" rules={[{ required: true, message: 'Ish vaqtini kiriting' }]}>
            <TimePicker.RangePicker format="HH:mm" minuteStep={30} className="w-full" />
          </Form.Item>
          <Form.Item
            name="slotStep"
            label="Kalendar qadami"
            tooltip="Qabul vaqtlari shu oraliq bilan taklif qilinadi: 09:00, 09:15, 09:30…"
          >
            <Segmented
              block
              options={[
                { value: 10, label: '10 daq.' },
                { value: 15, label: '15 daq.' },
                { value: 30, label: '30 daq.' },
              ]}
            />
          </Form.Item>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="inline-flex h-7.5 items-center rounded-pill bg-subtle px-3 tabular-nums">Haftada {days?.length ?? 0} kun</span>
          {hours?.[0] && hours?.[1] && (
            <span className="inline-flex h-7.5 items-center rounded-pill bg-subtle px-3 tabular-nums">
              {hours[0].format('HH:mm')}–{hours[1].format('HH:mm')}
            </span>
          )}
          {step && <span className="inline-flex h-7.5 items-center rounded-pill bg-subtle px-3 tabular-nums">har {step} daqiqada slot</span>}
        </div>
      </SettingsSection>

      <div className="flex flex-wrap justify-end gap-2">
        <Button disabled={!data} onClick={() => data && form.setFieldsValue(toValues(data))}>
          Bekor qilish
        </Button>
        <Button type="primary" htmlType="submit" loading={update.isPending}>
          Saqlash
        </Button>
      </div>
    </Form>
  );
};
