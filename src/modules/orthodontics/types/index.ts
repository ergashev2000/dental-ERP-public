import type { ID } from '@/shared/types/common';

/** Davolash bosqichlari — tartibi muhim (progress shu tartibda hisoblanadi) */
export const ORTHO_STAGES = ['CONSULTATION', 'DIAGNOSTICS', 'BONDING', 'ADJUSTMENT', 'DEBONDING', 'RETENTION'] as const;
export type OrthoStage = (typeof ORTHO_STAGES)[number];

/** ACTIVE — davolanmoqda; PAUSED — vaqtincha to'xtatilgan; FINISHED — tugagan */
export type OrthoStatus = 'ACTIVE' | 'PAUSED' | 'FINISHED';

export type OrthoAppliance = 'METAL' | 'CERAMIC' | 'SAPPHIRE' | 'SELF_LIGATING' | 'ALIGNER';
export type OrthoJaw = 'UPPER' | 'LOWER' | 'BOTH';

export interface OrthoCase {
  id: ID;
  patientId: ID;
  doctorId: ID;
  stage: OrthoStage;
  status: OrthoStatus;
  appliance: OrthoAppliance;
  jaw: OrthoJaw;
  /** Davolash boshlangan sana (YYYY-MM-DD) */
  startDate: string;
  /** Taxminiy davomiylik, oyda */
  plannedMonths: number;
  /** Korreksiyalar orasidagi oraliq (kun) — shundan oshsa "kelmayapti" deb belgilanadi */
  visitIntervalDays: number;
  /** Shartnoma summasi */
  totalPrice: number;
  /** Boshlang'ich to'lov (davolash boshlanganda) */
  initialPayment: number;
  /** Oylik to'lov miqdori (boshlang'ichdan keyin, har oy) */
  monthlyPayment: number;
  /** Shartnoma bo'yicha hisob-faktura (to'lovlar mavjud kassa orqali) */
  invoiceId?: ID;
  note?: string;
  /** Registraturaning oxirgi qo'ng'irog'i */
  lastContact?: { at: string; note: string; byId: ID };
  createdAt: string;
}

export interface OrthoVisit {
  id: ID;
  caseId: ID;
  date: string;
  stage: OrthoStage;
  /** Bajarilgan ishlar (masalan, "Duga almashtirildi") */
  work: string[];
  note?: string;
  doctorId: ID;
  /** Qabul orqali yakunlangan bo'lsa */
  appointmentId?: ID;
  createdAt: string;
}

export interface OrthoPhoto {
  id: ID;
  url: string;
  name: string;
  kind: 'BEFORE' | 'PROGRESS' | 'AFTER';
  createdAt: string;
}

export interface OrthoVisitView extends OrthoVisit {
  doctorName: string;
  photos: OrthoPhoto[];
}

export interface OrthoCaseView extends OrthoCase {
  patientName: string;
  patientPhone: string;
  doctorName: string;
  /** Oxirgi tashrif (korreksiya yoki yakunlangan qabul) */
  lastVisit?: string;
  /** Kelajakdagi yozilgan qabul */
  nextAppointment?: string;
  /** Kelishi kerak bo'lgan sana (oxirgi tashrif + oraliq) */
  dueDate: string;
  /** Oxirgi tashrifdan beri o'tgan kun */
  daysSinceVisit: number;
  /** Muddatdan o'tgan kun (0 — o'tmagan yoki qabulga yozilgan) */
  overdueDays: number;
  paid: number;
  remaining: number;
  nextPaymentDate?: string;
  paymentOverdue: boolean;
  /** Bosqich bo'yicha progress, 0–100 */
  progress: number;
  visitsCount: number;
}

export interface OrthoCaseDetail extends OrthoCaseView {
  visits: OrthoVisitView[];
  /** Oylik to'lov jadvali */
  schedule: { date: string; amount: number; paid: boolean }[];
}

export type OrthoCaseInput = Omit<OrthoCase, 'id' | 'invoiceId' | 'lastContact' | 'createdAt' | 'status'> & { status?: OrthoStatus };

export interface OrthoVisitInput {
  caseId: ID;
  date: string;
  stage: OrthoStage;
  work: string[];
  note?: string;
  photos: { file: File; kind: OrthoPhoto['kind'] }[];
}

export interface OrthoFilters {
  q?: string | null;
  stage?: OrthoStage | null;
  doctor?: string | null;
  status?: OrthoStatus | 'ALL' | null;
  overdue?: boolean | null;
  debt?: boolean | null;
}

export interface OrthoStats {
  active: number;
  overdue: number;
  paymentOverdue: number;
  thisWeek: number;
}
