import { App, Button, DatePicker, Form, Input, Modal } from 'antd';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';
import { Trash2 } from '@/shared/icons';
import dayjs from '@/shared/lib/dayjs';
import { EmptyState, StatusTag } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { formatDate } from '@/shared/utils/format';
import { useAddTimeOff, useRemoveTimeOff } from '../hooks/useStaff';
import type { Staff } from '../types';

/** Ta'til yoki kasallik kunlari — bu kunlarda qabul yozib bo'lmaydi */
export const TimeOffModal = ({ staff, onClose }: { staff: Staff | null; onClose: () => void }) => {
  const [form] = Form.useForm<{ range: [Dayjs, Dayjs]; reason: string }>();
  const { message, modal } = App.useApp();
  const add = useAddTimeOff();
  const remove = useRemoveTimeOff();
  const [today] = useState(() => dayjs().format('YYYY-MM-DD'));

  return (
    <Modal open={!!staff} onCancel={onClose} footer={null} title={`Ta’til va kasallik — ${staff?.fullName ?? ''}`} width={560} destroyOnHidden>
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
        onFinish={(v) =>
          staff &&
          add.mutate(
            { id: staff.id, timeOff: { from: v.range[0].format('YYYY-MM-DD'), to: v.range[1].format('YYYY-MM-DD'), reason: v.reason } },
            {
              onSuccess: () => {
                message.success('Qo‘shildi');
                form.resetFields();
              },
              onError: (e) => message.error(errorMessage(e)),
            },
          )
        }
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Form.Item name="range" label="Sana oralig‘i" rules={[{ required: true, message: 'Sanani tanlang' }]} className="mb-0">
            <DatePicker.RangePicker format="DD.MM.YYYY" className="w-full" />
          </Form.Item>
          <Form.Item name="reason" label="Sabab" rules={[{ required: true, message: 'Sababni kiriting' }]} className="mb-0">
            <Input placeholder="Ta’til / kasallik" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={add.isPending}>
            Qo‘shish
          </Button>
        </div>
      </Form>
      <div className="mt-6">
        {!staff?.timeOff.length ? (
          <EmptyState compact title="Rejalashtirilgan ta’til yo‘q" description="Yuqoridagi formada sanalar va sababni kiriting" />
        ) : (
          <ul className="m-0 list-none divide-y divide-line-soft p-0">
            {staff.timeOff.map((t, i) => (
              <li key={`${t.from}-${i}`} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="tabular-nums text-ink">
                      {formatDate(t.from)} – {formatDate(t.to)}
                    </span>
                    {t.to < today ? (
                      <StatusTag tone="neutral" dot={false}>O‘tgan</StatusTag>
                    ) : t.from <= today ? (
                      <StatusTag tone="warning">Hozir</StatusTag>
                    ) : (
                      <StatusTag tone="info" dot={false}>Rejada</StatusTag>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted">{t.reason}</div>
                </div>
                <Button
                  shape="circle"
                  aria-label="O‘chirish"
                  icon={<Trash2 size={18} strokeWidth={1.5} />}
                  loading={remove.isPending && remove.variables?.index === i}
                  onClick={() =>
                    modal.confirm({
                      title: 'Ta’tilni o‘chirish',
                      content: `${formatDate(t.from)} – ${formatDate(t.to)}: ${t.reason}`,
                      okText: 'O‘chirish',
                      okButtonProps: { danger: true },
                      cancelText: 'Bekor qilish',
                      onOk: () => remove.mutateAsync({ id: staff.id, index: i }).catch((e: unknown) => message.error(errorMessage(e))),
                    })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
};
