import { useEffect } from 'react';
import { usePermission } from '@/shared/hooks/usePermission';
import { useNewAppointment } from '../store/appointmentModalStore';

/** Matn kiritilmoqda yoki ochiq oyna (Drawer/Modal) bor — yorliq ishlamaydi */
export const hotkeyBlocked = (t: EventTarget | null) =>
  (t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) ||
  !!document.querySelector('.ant-drawer-open, .ant-modal-wrap:not([style*="display: none"])');

const typing = hotkeyBlocked;

/**
 * Klaviatura yorliqlari (TZ 4-bo'lim): N — yangi qabul.
 * Matn kiritilayotganda va ochiq oynada ishlamaydi.
 */
export const useAppointmentHotkeys = () => {
  const can = usePermission('appointment.manage');
  const show = useNewAppointment((s) => s.show);
  useEffect(() => {
    if (!can) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        show({});
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [can, show]);
};
