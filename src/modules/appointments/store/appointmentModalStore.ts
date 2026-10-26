import { create } from 'zustand';
import type { AppointmentView } from '../types';

export interface AppointmentPrefill {
  patientId?: string;
  doctorId?: string;
  chairId?: string;
  /** ISO — sana va vaqt */
  start?: string;
  /** Faqat sana (YYYY-MM-DD) — vaqtni foydalanuvchi bo'sh slotlardan tanlaydi */
  date?: string;
  /** Tezkor qabul: oldindan tanlangan xizmatlar (takroriy qabul, kutish ro'yxati) */
  serviceIds?: string[];
  /** Bemor qidiruv maydoni uchun boshlang'ich matn (onlayn so'rovdagi telefon) */
  search?: string;
  /** Yangi bemor uchun ism (onlayn so'rovdan) */
  newPatientName?: string;
  note?: string;
  source?: string;
  /** Qabul yozilgach yopiladigan manba yozuvlar */
  onlineRequestId?: string;
  waitlistId?: string;
  /** true — tish sxemali to'liq sahifa (Hozir qabul, muolajalar bilan) */
  full?: boolean;
}

interface State {
  open: boolean;
  /** create — yangi qabul; move — mavjud qabulni ko'chirish */
  mode: 'create' | 'move';
  prefill: AppointmentPrefill;
  appointment: AppointmentView | null;
  show: (prefill?: AppointmentPrefill) => void;
  showMove: (appointment: AppointmentView, prefill?: AppointmentPrefill) => void;
  close: () => void;
}

/** Global "Yangi qabul" (tezkor oyna) / "Ko'chirish" oynasi (header, kalendar, bemor kartasidan ochiladi) */
export const useNewAppointment = create<State>((set) => ({
  open: false,
  mode: 'create',
  prefill: {},
  appointment: null,
  show: (prefill = {}) => set({ open: true, mode: 'create', prefill, appointment: null }),
  showMove: (appointment, prefill = {}) => set({ open: true, mode: 'move', appointment, prefill }),
  close: () => set({ open: false }),
}));
