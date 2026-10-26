import type { ID } from '@/shared/types/common';
import type { StaffColor } from '@/shared/theme/tokens';
import type { AppointmentStatus } from '@/modules/appointments';

export interface Trend {
  value: number;
  /** Foizda, o'tgan davrga nisbatan; null — solishtirish uchun ma'lumot yo'q */
  change: number | null;
}

export interface DashboardSummary {
  today: { total: number; arrived: number; change: number | null };
  revenue: Trend | null;
  newPatients: Trend;
  receivables: Trend;
  doctorLoad: { doctorId: ID; name: string; specialty?: string; color: StaffColor; count: number; loadPct: number }[];
  reminders: { confirmed: number; cancelled: number; noAnswer: number; pending: number };
  weeklyRevenue: { date: string; amount: number }[] | null;
  unconfirmedToday: number;
  /** Kelmay qolish ulushi (oxirgi 30 kun, %); change — oldingi 30 kunga nisbatan farq (foiz punkti) */
  noShow: Trend;
}

/** Bosh sahifadagi qisqa qabul ko'rinishi (kreslolar, yakunlanmagan tashriflar) */
export interface DayVisit {
  id: ID;
  start: string;
  durationMin: number;
  status: AppointmentStatus;
  patientId: ID;
  patientName: string;
  doctorName: string;
  chairName: string;
  serviceNames: string[];
}

export interface MedicalFlags {
  allergies: string[];
  conditions: string[];
  medications: string[];
  pregnant?: boolean;
}

export interface ChairNow {
  id: ID;
  name: string;
  /** Hozir kresloda (Qabulda) */
  current?: DayVisit;
  /** Keyingi bemor (keldi yoki kutilmoqda) */
  next?: DayVisit;
  /** Bugun shu kresloda qolgan qabullar soni */
  left: number;
}

export interface DashboardDay {
  /** patientId → tibbiy ogohlantirish (faqat bugungi ko'rinadigan qabullar bemorlari) */
  alerts: Record<ID, MedicalFlags>;
  /** Vaqti o'tgan, lekin yakunlanmagan yoki holati belgilanmagan tashriflar (oxirgi 14 kun) */
  unfinished: (DayVisit & { reason: 'open' | 'unmarked' })[];
  chairs: ChairNow[];
}

export type NotificationKind = 'LOW_STOCK' | 'UNCONFIRMED' | 'CALL_FAILED' | 'CALL_CANCELLED' | 'OPERATOR' | 'PAYMENT_DUE' | 'ORTHO_OVERDUE';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  at: string;
  link: string;
}
