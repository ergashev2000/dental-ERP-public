import { Alert, App, Button, Checkbox, DatePicker, Form, Modal, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/shared/constants/routes';
import dayjs from '@/shared/lib/dayjs';
import { DoctorSelect } from '@/shared/components/ui';
import { DURATIONS } from '@/shared/constants/options';
import { usePermission, useCurrentUser } from '@/shared/hooks/usePermission';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { formatDuration } from '@/shared/utils/format';
import { useChairs } from '@/modules/settings';
import { useMoveAppointment, useSlotCheck, useSlots } from '../hooks/useAppointments';
import { useNewAppointment } from '../store/appointmentModalStore';
import { SlotPicker } from './SlotPicker';

interface Values {
  doctorId: string;
  date: Dayjs;
  time: string;
  durationMin: number;
  chairId: string;
  rescheduleReminders?: boolean;
}

/**
 * Global qabul oynasi (store orqali boshqariladi):
 * - mode=move — qabulni ko'chirish oynasi;
 * - mode=create — tezkor oyna (QuickBookingDrawer); prefill.full=true bo'lsa — to'liq sahifaga (prefill URL orqali).
 */
export const NewAppointmentModal = () => {
  const { open, mode, prefill, appointment, close } = useNewAppointment();
  const navigate = useNavigate();
  const [form] = Form.useForm<Values>();
  const { message } = App.useApp();
  const isMobile = useIsMobile();
  const user = useCurrentUser();
  const manageAll = usePermission('appointment.manageAll');
  const move = useMoveAppointment();
  const { data: chairs = [] } = useChairs();
  const isMove = mode === 'move';

  useEffect(() => {
    if (!open || mode !== 'create' || !prefill.full) return;
    const q = new URLSearchParams();
    if (prefill.patientId) q.set('patient', prefill.patientId);
    if (prefill.doctorId) q.set('doctor', prefill.doctorId);
    if (prefill.chairId) q.set('chair', prefill.chairId);
    if (prefill.start) q.set('start', prefill.start);
    if (prefill.date) q.set('date', prefill.date);
    close();
    navigate(`${ROUTES.newAppointment}${q.size ? `?${q.toString()}` : ''}`);
  }, [open, mode, prefill, close, navigate]);

  const v = Form.useWatch([], form) as Partial<Values> | undefined;
  const dateStr = v?.date?.format('YYYY-MM-DD');
  const { data: slots = [], isFetching: slotsLoading } = useSlots({ doctorId: v?.doctorId, date: dateStr, durationMin: v?.durationMin, excludeId: appointment?.id });
  const start = dateStr && v?.time ? dayjs(`${dateStr} ${v.time}`, 'YYYY-MM-DD HH:mm').toISOString() : undefined;
  const { data: check } = useSlotCheck({ doctorId: v?.doctorId, chairId: v?.chairId, start, durationMin: v?.durationMin, excludeId: appointment?.id });
  const conflict = check?.error ?? null;

  useEffect(() => {
    if (!open || !isMove || !appointment) return;
    form.resetFields();
    const at = prefill.start ?? appointment.start;
    form.setFieldsValue({
      doctorId: prefill.doctorId ?? appointment.doctorId,
      chairId: prefill.chairId ?? appointment.chairId,
      date: dayjs(at),
      time: dayjs(at).format('HH:mm'),
      durationMin: appointment.durationMin,
      rescheduleReminders: true,
    });
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- faqat oyna ochilganda to'ldiriladi
  }, [open]);

  const submit = async (values: Values) => {
    if (conflict || !appointment) return;
    try {
      await move.mutateAsync({
        id: appointment.id,
        doctorId: values.doctorId,
        chairId: values.chairId,
        start: dayjs(`${values.date.format('YYYY-MM-DD')} ${values.time}`, 'YYYY-MM-DD HH:mm').toISOString(),
        durationMin: values.durationMin,
        rescheduleReminders: !!values.rescheduleReminders,
      });
      message.success('Qabul ko‘chirildi');
      close();
    } catch (e) {
      message.error(errorMessage(e));
    }
  };

  const slotOptions = useMemo(() => (v?.time && !slots.includes(v.time) ? [...slots, v.time].sort() : slots), [slots, v?.time]);

  return (
    <Modal
      open={open && isMove}
      onCancel={close}
      width={isMobile ? '100%' : 600}
      title="Qabulni ko‘chirish"
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={close}>Bekor qilish</Button>
          <Button type="primary" loading={move.isPending} disabled={!!conflict} onClick={() => form.submit()}>
            Ko‘chirish
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={(x) => void submit(x)} className="mt-4" requiredMark={false}>
        {appointment && (
          <div className="mb-4 rounded-md bg-subtle px-4 py-3 text-sm">
            <span className="font-medium">{appointment.patientName}</span> · {appointment.serviceNames.join(', ')}
          </div>
        )}
        <div className="grid gap-x-3 sm:grid-cols-2">
          <Form.Item name="doctorId" label="Shifokor" rules={[{ required: true, message: 'Shifokorni tanlang' }]}>
            <DoctorSelect date={dateStr} only={manageAll ? undefined : user ? [user.staffId] : []} />
          </Form.Item>
          <Form.Item name="date" label="Sana" rules={[{ required: true, message: 'Sanani tanlang' }]}>
            <DatePicker format="DD.MM.YYYY" className="w-full" allowClear={false} disabledDate={(d) => d.isBefore(dayjs().startOf('day'))} />
          </Form.Item>
          <Form.Item name="durationMin" label="Davomiylik" rules={[{ required: true }]}>
            <Select options={DURATIONS.map((d) => ({ value: d, label: formatDuration(d) }))} />
          </Form.Item>
          <Form.Item name="chairId" label="Kabinet" rules={[{ required: true, message: 'Kabinetni tanlang' }]}>
            <Select options={chairs.filter((c) => c.isActive).map((c) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
        </div>
        <Form.Item name="time" label="Vaqt (faqat bo‘sh vaqtlar)" rules={[{ required: true, message: 'Vaqtni tanlang' }]}>
          <SlotPicker slots={slotOptions} loading={slotsLoading && !slots.length} disabled={!v?.doctorId || !dateStr} />
        </Form.Item>
        {conflict && <Alert type="error" showIcon className="mb-4" message={conflict} />}
        <Form.Item name="rescheduleReminders" valuePropName="checked" className="mb-0">
          <Checkbox>Bemorga qayta eslatma yuborilsin (qabul tasdiqlanmagan holatga qaytadi)</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
};
