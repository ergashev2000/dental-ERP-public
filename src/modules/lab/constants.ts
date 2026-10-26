import type { StatusMeta } from '@/shared/constants/status';
import { ADULT_LOWER, ADULT_UPPER } from '@/shared/utils/fdi';
import type { LabStatus, LabWorkType } from './types';

/**
 * Status → ohang. Lime ishlatilmaydi: jadvalda ko‘p qator bir xil statusda bo‘ladi (qatorda bitta lime qoidasi).
 * Qaytdi — yashil (bemorni chaqirish kerak), o‘rnatildi — sokin neytral.
 */
export const LAB_STATUS: Record<LabStatus, StatusMeta> = {
  NEW: { label: 'Yangi', tone: 'neutral' },
  SENT: { label: 'Yuborildi', tone: 'info' },
  IN_WORK: { label: 'Tayyorlanmoqda', tone: 'warning' },
  RETURNED: { label: 'Qaytdi', tone: 'success' },
  FITTED: { label: 'O‘rnatildi', tone: 'neutral' },
  REMAKE: { label: 'Qayta ishlashga', tone: 'danger' },
};

/** Ish jarayonidagi bosqichlar tartibi (plitkalar shu tartibda) */
export const LAB_PIPELINE: LabStatus[] = ['NEW', 'SENT', 'IN_WORK', 'RETURNED', 'REMAKE'];

/** Laboratoriya hali qaytarmagan bosqichlar — muddat nazorati shular uchun */
export const PENDING_STATUSES: LabStatus[] = ['NEW', 'SENT', 'IN_WORK', 'REMAKE'];

/** Qatordagi tezkor amal: keyingi bosqich va tugma matni */
export const NEXT_STATUS: Partial<Record<LabStatus, { to: LabStatus; label: string }>> = {
  NEW: { to: 'SENT', label: 'Yuborildi' },
  SENT: { to: 'IN_WORK', label: 'Tayyorlanmoqda' },
  IN_WORK: { to: 'RETURNED', label: 'Qaytdi' },
  RETURNED: { to: 'FITTED', label: 'O‘rnatildi' },
  REMAKE: { to: 'SENT', label: 'Qayta yuborildi' },
};

/** Qayta ishlashga qaytarish mumkin bo‘lgan bosqichlar (sifat yoki moslik muammosi) */
export const CAN_REMAKE: LabStatus[] = ['IN_WORK', 'RETURNED', 'FITTED'];

export const LAB_WORK_TYPE: Record<LabWorkType, string> = {
  PFM_CROWN: 'Metall-keramika toj',
  ZIRCONIA_CROWN: 'Sirkoniy toj',
  BRIDGE: 'Ko‘prik',
  DENTURE: 'Olinadigan protez',
  ALIGNER: 'Elayner/kappa',
  NIGHT_GUARD: 'Tungi kappa',
  VENEER: 'Vinir',
  IMPLANT_CROWN: 'Implant ustidagi toj',
};

/** Butun jag‘ uchun ishlar — tish raqami majburiy emas */
export const WHOLE_JAW_WORK: LabWorkType[] = ['DENTURE', 'ALIGNER', 'NIGHT_GUARD'];

export const WORK_TYPE_OPTIONS = (Object.keys(LAB_WORK_TYPE) as LabWorkType[]).map((k) => ({ value: k, label: LAB_WORK_TYPE[k] }));

/** VITA classical rang shkalasi */
export const SHADES = ['A1', 'A2', 'A3', 'A3.5', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D2', 'D3', 'D4', 'BL1', 'BL2'];

/** FDI tish raqamlari — jag‘ bo‘yicha guruhlangan */
export const TEETH_OPTIONS = [
  { label: 'Yuqori jag‘', options: ADULT_UPPER.map((n) => ({ value: n, label: String(n) })) },
  { label: 'Pastki jag‘', options: ADULT_LOWER.map((n) => ({ value: n, label: String(n) })) },
];

export const teethLabel = (teeth: number[]) => (teeth.length ? teeth.join(', ') : 'Butun jag‘');
