import type { ID } from '@/shared/types/common';

/** Buyurtma bosqichlari: Yangi → Yuborildi → Tayyorlanmoqda → Qaytdi → O‘rnatildi (+ Qayta ishlashga) */
export type LabStatus = 'NEW' | 'SENT' | 'IN_WORK' | 'RETURNED' | 'FITTED' | 'REMAKE';

export type LabWorkType = 'PFM_CROWN' | 'ZIRCONIA_CROWN' | 'BRIDGE' | 'DENTURE' | 'ALIGNER' | 'NIGHT_GUARD' | 'VENEER' | 'IMPLANT_CROWN';

export interface DentalLab {
  id: ID;
  name: string;
  phone: string;
  /** O‘rtacha tayyorlash muddati (kun) — yangi buyurtmada muddatni taklif qilish uchun */
  leadDays: number;
}

export interface LabStatusEvent {
  status: LabStatus;
  at: string;
  byName: string;
  note?: string;
}

export interface LabOrder {
  id: ID;
  number: string;
  patientId: ID;
  doctorId: ID;
  teeth: number[];
  workType: LabWorkType;
  /** VITA rang shkalasi (A2, B1 …) */
  shade?: string;
  labId: ID;
  /** YYYY-MM-DD */
  sentDate?: string;
  /** YYYY-MM-DD — laboratoriya qaytarishi kerak bo‘lgan sana */
  dueDate: string;
  returnedAt?: string;
  price: number;
  note?: string;
  status: LabStatus;
  history: LabStatusEvent[];
  createdAt: string;
}

export interface LabOrderView extends LabOrder {
  patientName: string;
  patientCardNo: string;
  patientPhone: string;
  doctorName: string;
  labName: string;
  /** Muddat o‘tgan va hali qaytmagan */
  overdue: boolean;
  /** Muddatgacha qolgan kun (manfiy — kechikkan) */
  daysLeft: number;
}

export type LabOrderInput = Pick<LabOrder, 'patientId' | 'doctorId' | 'teeth' | 'workType' | 'shade' | 'labId' | 'sentDate' | 'dueDate' | 'price' | 'note'>;

/** Sahifa filtri: plitka (aniq status / muddati o‘tgan) yoki segment (faol / hammasi / o‘rnatilgan) */
export type LabStatusFilter = 'ACTIVE' | 'ALL' | 'OVERDUE' | LabStatus;
