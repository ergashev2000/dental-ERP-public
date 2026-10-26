import { DatePicker, Form, Input, Select, Switch } from 'antd';
import type { Dayjs } from 'dayjs';
import { CalendarPlus } from '@/shared/icons';
import { useEffect } from 'react';
import dayjs from '@/shared/lib/dayjs';
import { ServiceSelect } from '@/shared/components/ui';
import { DURATIONS } from '@/shared/constants/options';
import { cn } from '@/shared/utils/cn';
import { formatDuration } from '@/shared/utils/format';
import { useSlots } from '../hooks/useAppointments';
import { SlotPicker } from './SlotPicker';

export interface FollowUpValues {
  enabled: boolean;
  date?: Dayjs;
  time?: string;
  durationMin: number;
  serviceIds: string[];
  note?: string;
}

const PRESETS = [
  { label: '1 hafta', add: [1, 'week'] },
  { label: '2 hafta', add: [2, 'week'] },
  { label: '1 oy', add: [1, 'month'] },
  { label: '3 oy', add: [3, 'month'] },
  { label: '6 oy', add: [6, 'month'] },
] as const;

interface Props {
  doctorId: string;
  /** Davolash rejasidagi qolgan xizmatlar — keyingi tashrif uchun taklif */
  suggestedServiceIds: string[];
  /** Reja bo'lmasa — nazorat ko'rigi xizmati */
  fallbackServiceId?: string;
}

/** Yakunlash oynasidagi "Keyingi tashrif" bo'limi (Form ichida, name="followUp") */
export const FollowUpFields = ({ doctorId, suggestedServiceIds, fallbackServiceId }: Props) => {
  const form = Form.useFormInstance();
  // maydonlar alohida kuzatiladi (Dayjs obyektini chuqur solishtirish ogohlantirishidan qochish uchun)
  const enabled = Form.useWatch(['followUp', 'enabled'], form) as boolean | undefined;
  const date = Form.useWatch(['followUp', 'date'], form) as Dayjs | undefined;
  const durationMin = Form.useWatch(['followUp', 'durationMin'], form) as number | undefined;
  const dateStr = date?.format('YYYY-MM-DD');
  const { data: slots = [], isFetching } = useSlots({ doctorId, date: enabled ? dateStr : undefined, durationMin });

  // Yoqilganda — rejadagi keyingi xizmatlar va 1 haftadan keyingi sana taklif qilinadi
  useEffect(() => {
    if (!enabled || date) return;
    form.setFieldValue(['followUp', 'date'], dayjs().add(1, 'week'));
    const current = form.getFieldValue(['followUp', 'serviceIds']) as string[] | undefined;
    const initial = suggestedServiceIds.length ? suggestedServiceIds.slice(0, 2) : fallbackServiceId ? [fallbackServiceId] : [];
    if (!current?.length && initial.length) form.setFieldValue(['followUp', 'serviceIds'], initial);
  }, [enabled, date, suggestedServiceIds, fallbackServiceId, form]);

  const setDate = (d: Dayjs) => {
    form.setFieldValue(['followUp', 'date'], d);
    form.setFieldValue(['followUp', 'time'], undefined);
  };

  return (
    <div className={cn('mb-6 rounded-md p-4', enabled ? 'bg-subtle' : 'ring-1 ring-inset ring-line')}>
      <div className="flex items-center gap-3">
        <CalendarPlus size={18} strokeWidth={1.5} className="text-ink" />
        <div className="flex-1">
          <div className="font-medium">Keyingi tashrif</div>
          <div className="text-xs text-muted">Bemor qachon qayta kelishini hozir belgilash — shu shifokorga qabul yaratiladi</div>
        </div>
        <Form.Item name={['followUp', 'enabled']} valuePropName="checked" className="mb-0">
          <Switch />
        </Form.Item>
      </div>

      {enabled && (
        <div className="mt-4">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setDate(dayjs().add(p.add[0], p.add[1]))}
                className="cursor-pointer rounded-pill bg-surface px-3 py-1 text-xs transition-colors duration-150 hover:bg-lime-soft"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid gap-x-3 sm:grid-cols-2">
            <Form.Item name={['followUp', 'date']} label="Sana" rules={[{ required: true, message: 'Sanani tanlang' }]}>
              <DatePicker
                format="DD.MM.YYYY"
                className="w-full"
                allowClear={false}
                disabledDate={(d) => d.isBefore(dayjs().add(1, 'day').startOf('day'))}
                onChange={() => form.setFieldValue(['followUp', 'time'], undefined)}
              />
            </Form.Item>
            <Form.Item name={['followUp', 'durationMin']} label="Davomiylik">
              <Select options={DURATIONS.map((d) => ({ value: d, label: formatDuration(d) }))} />
            </Form.Item>
          </div>
          <Form.Item name={['followUp', 'serviceIds']} label="Xizmat(lar)" rules={[{ required: true, message: 'Kamida bitta xizmat' }]}>
            <ServiceSelect
              mode="multiple"
              onChange={(_, services) => {
                const total = services.reduce((s, x) => s + x.durationMin, 0);
                if (total) form.setFieldValue(['followUp', 'durationMin'], DURATIONS.find((d) => d >= total) ?? 120);
              }}
            />
          </Form.Item>
          <Form.Item name={['followUp', 'time']} label="Vaqt (faqat bo‘sh slotlar)" rules={[{ required: true, message: 'Vaqtni tanlang' }]}>
            <SlotPicker slots={slots} loading={isFetching && !slots.length} emptyText="Shifokor bu kuni ishlamaydi yoki bo‘sh vaqt yo‘q — boshqa sanani tanlang" />
          </Form.Item>
          <Form.Item name={['followUp', 'note']} label="Izoh" className="mb-0">
            <Input placeholder="Masalan: 47-tishni davolash davomi" maxLength={200} />
          </Form.Item>
        </div>
      )}
    </div>
  );
};
