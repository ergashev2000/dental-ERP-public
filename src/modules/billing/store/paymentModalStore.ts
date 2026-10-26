import { create } from 'zustand';

interface State {
  open: boolean;
  patientId?: string;
  invoiceId?: string;
  /** Qabul yakunlangandan keyin ochilgan bo'lsa: shifokor va keyingi tashrif holati */
  doctorId?: string;
  followUpBooked?: boolean;
  show: (p?: { patientId?: string; invoiceId?: string; doctorId?: string; followUpBooked?: boolean }) => void;
  close: () => void;
}

/** Global "To'lov qabul qilish" oynasi */
export const usePaymentModal = create<State>((set) => ({
  open: false,
  show: (p = {}) => set({ open: true, patientId: p.patientId, invoiceId: p.invoiceId, doctorId: p.doctorId, followUpBooked: p.followUpBooked }),
  close: () => set({ open: false }),
}));
