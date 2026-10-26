import { App, Button, Input, Modal } from 'antd';
import { useState } from 'react';
import { PhoneText, StatusTag, UserAvatar } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { cn } from '@/shared/utils/cn';
import { formatDate } from '@/shared/utils/format';
import { useNewAppointment } from '@/modules/appointments';
import { useLogOrthoContact } from '../hooks/useOrtho';
import { AutoCallButton } from './AutoCallButton';
import type { OrthoCaseView } from '../types';

const QUICK = ['Qabulga yozildi', 'Javob bermadi', 'Keyinroq qo‘ng‘iroq qilish kerak', 'Kelishdan bosh tortdi'];

/** Kechikkan bemorga qo'ng'iroq natijasini yozish (registratura uchun) */
export const ContactModal = ({ c, onClose }: { c: OrthoCaseView | null; onClose: () => void }) => {
  const { message } = App.useApp();
  const log = useLogOrthoContact();
  const openNew = useNewAppointment((s) => s.show);
  const [note, setNote] = useState('');

  const save = (text = note) =>
    c &&
    log.mutate(
      { id: c.id, note: text },
      {
        onSuccess: () => {
          message.success('Qo‘ng‘iroq natijasi saqlandi');
          onClose();
          if (text === 'Qabulga yozildi') openNew({ patientId: c.patientId, doctorId: c.doctorId });
        },
        onError: (e) => message.error(errorMessage(e)),
      },
    );

  return (
    <Modal
      open={!!c}
      onCancel={onClose}
      afterClose={() => setNote('')}
      title="Qo‘ng‘iroq natijasi"
      destroyOnHidden
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          {c && <AutoCallButton ids={[c.id]} onDone={onClose} className="sm:mr-auto" />}
          <Button onClick={onClose}>Bekor qilish</Button>
          <Button type="primary" loading={log.isPending} disabled={!note.trim()} onClick={() => save()}>
            Saqlash
          </Button>
        </div>
      }
    >
      {c && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-md bg-subtle px-4 py-3">
            <UserAvatar name={c.patientName} size={40} />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-base text-ink">{c.patientName}</div>
              <PhoneText phone={c.patientPhone} className="text-sm" />
            </div>
            {c.overdueDays > 0 && <StatusTag tone="danger">{c.daysSinceVisit} kun kelmagan</StatusTag>}
          </div>
          {c.lastContact && (
            <div className="text-xs text-muted">
              Oxirgi qo‘ng‘iroq {formatDate(c.lastContact.at)}: <span className="text-ink">{c.lastContact.note}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Tez javoblar">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                aria-pressed={note === q}
                onClick={() => setNote(q)}
                className={cn(
                  'h-8 cursor-pointer rounded-pill border-0 px-3 text-sm transition-colors duration-150',
                  note === q ? 'bg-ink text-on-ink' : 'bg-subtle text-ink hover:bg-subtle-strong',
                )}
              >
                {q}
              </button>
            ))}
          </div>
          <Input.TextArea rows={2} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Yoki o‘zingiz yozing" aria-label="Qo‘ng‘iroq natijasi" />
          <div className="text-xs text-muted">«Qabulga yozildi» tanlansa, saqlangach qabul oynasi ochiladi.</div>
        </div>
      )}
    </Modal>
  );
};
