import { App, Form, Modal, Switch, TimePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import { useEffect } from 'react';
import dayjs from '@/shared/lib/dayjs';
import { WEEKDAYS } from '@/shared/constants/options';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { useSaveSchedule } from '../hooks/useStaff';
import type { Staff, WorkDay } from '../types';

interface Row {
  on: boolean;
  time?: [Dayjs, Dayjs];
  lunch?: [Dayjs, Dayjs];
}

const t = (v: string) => dayjs(v, 'HH:mm');
const f = (d: Dayjs) => d.format('HH:mm');

/** Hafta kunlari × ish vaqti; dam olish kuni Switch bilan */
export const ScheduleModal = ({ staff, onClose }: { staff: Staff | null; onClose: () => void }) => {
  const [form] = Form.useForm<{ days: Row[] }>();
  const { message } = App.useApp();
  const save = useSaveSchedule();
  const days = Form.useWatch('days', form);

  useEffect(() => {
    if (!staff) return;
    form.setFieldsValue({
      days: WEEKDAYS.map((w): Row => {
        const d = staff.schedule.find((s) => s.weekday === w.value);
        return d
          ? { on: true, time: [t(d.start), t(d.end)], lunch: d.breakStart && d.breakEnd ? [t(d.breakStart), t(d.breakEnd)] : undefined }
          : { on: false, time: [t('09:00'), t('18:00')] };
      }),
    });
  }, [staff, form]);

  const submit = ({ days: rows }: { days: Row[] }) => {
    if (!staff) return;
    const schedule: WorkDay[] = rows
      .map((r, i) => ({ r, weekday: WEEKDAYS[i]!.value }))
      .filter(({ r }) => r.on && r.time)
      .map(({ r, weekday }) => ({
        weekday,
        start: f(r.time![0]),
        end: f(r.time![1]),
        breakStart: r.lunch ? f(r.lunch[0]) : undefined,
        breakEnd: r.lunch ? f(r.lunch[1]) : undefined,
      }));
    save.mutate(
      { id: staff.id, schedule },
      {
        onSuccess: () => {
          message.success('Ish jadvali saqlandi');
          onClose();
        },
        onError: (e) => message.error(errorMessage(e)),
      },
    );
  };

  return (
    <Modal
      open={!!staff}
      onCancel={onClose}
      title={`Ish jadvali — ${staff?.fullName ?? ''}`}
      okText="Saqlash"
      cancelText="Bekor qilish"
      onOk={() => form.submit()}
      confirmLoading={save.isPending}
      width={640}
      destroyOnHidden
    >
      <Form form={form} onFinish={submit} className="mt-4">
        <div className="mb-1 hidden grid-cols-[148px_1fr_1fr] gap-3 px-1 text-xs text-muted sm:grid">
          <span>Kun</span>
          <span>Ish vaqti</span>
          <span>Tushlik (ixtiyoriy)</span>
        </div>
        <Form.List name="days">
          {(fields) => (
            <div className="flex flex-col divide-y divide-line-soft">
              {fields.map((field, i) => {
                const on = days?.[i]?.on;
                return (
                  <div key={field.key} className="grid items-center gap-2 py-2.5 sm:grid-cols-[148px_1fr_1fr] sm:gap-3">
                    <label className="flex cursor-pointer items-center justify-between gap-3 px-1 sm:justify-start">
                      <span className={on ? 'text-ink' : 'text-muted'}>{WEEKDAYS[i]!.label}</span>
                      <Form.Item name={[field.name, 'on']} valuePropName="checked" noStyle>
                        <Switch size="small" aria-label={`${WEEKDAYS[i]!.label}: ishlaydi`} />
                      </Form.Item>
                    </label>
                    {on ? (
                      <>
                        <Form.Item name={[field.name, 'time']} className="mb-0" rules={[{ required: true, message: 'Vaqt' }]}>
                          <TimePicker.RangePicker format="HH:mm" minuteStep={15} className="w-full" placeholder={['Boshlanish', 'Tugash']} />
                        </Form.Item>
                        <Form.Item name={[field.name, 'lunch']} className="mb-0">
                          <TimePicker.RangePicker format="HH:mm" minuteStep={15} className="w-full" placeholder={['Tushlik', '']} allowClear />
                        </Form.Item>
                      </>
                    ) : (
                      <span className="hidden text-sm text-muted sm:col-span-2 sm:block">Dam olish kuni</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};
