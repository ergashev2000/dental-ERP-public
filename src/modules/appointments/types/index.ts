import type { ID } from '@/shared/types/common';
import type { PaymentMethod } from '@/modules/billing/types';
import type { SurfaceMap } from '@/modules/dental-chart/types';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface PlannedItem {
  serviceId: ID;
  tooth?: number;
  /** Tishning qaysi yuzasi: karies topildi / plomba qo'yildi */
  surfaces?: SurfaceMap;
  price: number;
  discount: number;
}

export interface Appointment {
  id: ID;
  patientId: ID;
  doctorId: ID;
  chairId: ID;
  start: string;
  durationMin: number;
  serviceIds: ID[];
  status: AppointmentStatus;
  note?: string;
  source: string;
  reminderEnabled: boolean;
  cancelReason?: string;
  doctorNote?: string;
  /** Yozishda belgilangan ishlar (tish raqami bilan) — yakunlashda oldindan to'ldiriladi */
  plannedItems?: PlannedItem[];
  createdById: ID;
  createdAt: string;
}

/** Ro'yxat va kalendar uchun boyitilgan qabul */
export interface AppointmentView extends Appointment {
  patientName: string;
  patientPhone: string;
  doctorName: string;
  chairName: string;
  serviceNames: string[];
  /** Eslatma holati: asosiy job'ning oxirgi natijasi */
  reminder?: { status: string; attempt: number; maxAttempts: number };
  /** Shifokor boshqa shifokorning qabulini ko'rsa — faqat "band" */
  masked?: boolean;
  /** Kelmay qolish xavfi (bemor tarixidan; TZ 5-bo'lim — AI bashoratining mock'i) */
  noShowRisk?: 'HIGH' | 'MEDIUM';
}

export interface AppointmentInput {
  patientId: ID;
  doctorId: ID;
  chairId: ID;
  start: string;
  durationMin: number;
  serviceIds: ID[];
  note?: string;
  source: string;
  reminderEnabled: boolean;
  allowPast?: boolean;
  /** Bemor hozir klinikada — qabul darhol "Keldi" holatida yaratiladi */
  arrived?: boolean;
  plannedItems?: PlannedItem[];
}

export interface MoveInput {
  id: ID;
  doctorId: ID;
  chairId: ID;
  start: string;
  durationMin: number;
  rescheduleReminders: boolean;
}

export interface CompleteItem {
  planItemId?: ID;
  serviceId: ID;
  tooth?: number;
  /** Tish yuzalari — yakunlashda tish sxemasiga yoziladi */
  surfaces?: SurfaceMap;
  price: number;
  discount: number;
}

/** Keyingi tashrif — yakunlash bilan birga yaratiladi */
export interface FollowUpInput {
  start: string;
  durationMin: number;
  serviceIds: ID[];
  note?: string;
}

export interface CompleteInput {
  appointmentId: ID;
  items: CompleteItem[];
  materials: { productId: ID; qty: number }[];
  doctorNote?: string;
  followUp?: FollowUpInput;
  /** Yakunlash bilan birga olingan to'lov (qolgani qarz bo'lib qoladi) */
  payment?: { amount: number; method: PaymentMethod; note?: string };
}

export interface CompleteResult {
  invoiceId: ID;
  invoiceTotal: number;
  followUpId?: ID;
  followUpStart?: string;
  paymentId?: ID;
  paid: number;
  /** Shu qabul bo'yicha qolgan qarz */
  debt: number;
  warnings: string[];
}

export interface AppointmentFilters {
  from?: string;
  to?: string;
  doctor?: string | null;
  status?: AppointmentStatus | null;
  q?: string | null;
  page?: number;
  pageSize?: number;
  includeCancelled?: boolean;
  patientId?: string;
}

export interface SlotQuery {
  doctorId: ID;
  date: string;
  durationMin: number;
  excludeId?: ID;
  allowPast?: boolean;
}

/* ---------- Tezkor qabul (TZ 4-bo'lim) ---------- */

export interface SuggestQuery {
  serviceIds: ID[];
  durationMin?: number;
  doctorId?: ID;
  patientId?: ID;
  /** YYYY-MM-DD — shu kundan boshlab qidiriladi (standart: bugun) */
  from?: string;
  limit?: number;
}

/** Aqlli vaqt taklifi: shifokor + kreslo + vaqt birga */
export interface SlotSuggestion {
  doctorId: ID;
  doctorName: string;
  specialty?: string;
  chairId: ID;
  chairName: string;
  start: string;
  durationMin: number;
  /** Bemorning odatdagi shifokori */
  usualDoctor: boolean;
}

export interface WaitlistEntry {
  id: ID;
  patientId: ID;
  patientName: string;
  patientPhone: string;
  serviceIds: ID[];
  serviceNames: string[];
  doctorId?: ID;
  doctorName?: string;
  /** Kelishi mumkin bo'lgan oraliq (YYYY-MM-DD) */
  from: string;
  to: string;
  note?: string;
  status: 'ACTIVE' | 'BOOKED' | 'REMOVED';
  createdAt: string;
}

export type WaitlistInput = Pick<WaitlistEntry, 'patientId' | 'serviceIds' | 'doctorId' | 'from' | 'to' | 'note'>;

/** Telegram bot yoki sayt vidjeti orqali kelgan yozilish so'rovi */
export interface OnlineRequest {
  id: ID;
  name: string;
  phone: string;
  /** Telefon bo'yicha topilgan mavjud bemor */
  patientId?: ID;
  serviceId?: ID;
  serviceName?: string;
  preferredDate: string;
  preferredTime?: string;
  channel: 'TELEGRAM' | 'SITE';
  note?: string;
  status: 'NEW' | 'APPROVED' | 'DECLINED';
  createdAt: string;
}
