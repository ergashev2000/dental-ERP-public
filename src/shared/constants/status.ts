import type { Tone } from '@/shared/theme/tokens';
import type { AppointmentStatus } from '@/modules/appointments/types';
import type { InvoiceStatus, PaymentMethod } from '@/modules/billing/types';
import type { PlanItemStatus } from '@/modules/treatments/types';
import type { CallResult } from '@/modules/reminders/types';
import type { MovementType, StockState } from '@/modules/inventory/types';
import type { ToothCondition } from '@/modules/dental-chart/types';
import type { OrthoAppliance, OrthoJaw, OrthoStage, OrthoStatus } from '@/modules/orthodontics/types';

export interface StatusMeta {
  label: string;
  tone: Tone;
}

export const APPOINTMENT_STATUS: Record<AppointmentStatus, StatusMeta> = {
  SCHEDULED: { label: 'Yozilgan', tone: 'info' },
  CONFIRMED: { label: 'Tasdiqlangan', tone: 'success' },
  ARRIVED: { label: 'Keldi', tone: 'warning' },
  IN_PROGRESS: { label: 'Qabulda', tone: 'primary' },
  COMPLETED: { label: 'Yakunlandi', tone: 'neutral' },
  CANCELLED: { label: 'Bekor qilindi', tone: 'neutral' },
  NO_SHOW: { label: 'Kelmadi', tone: 'danger' },
};

export const INVOICE_STATUS: Record<InvoiceStatus, StatusMeta> = {
  UNPAID: { label: "To‘lanmagan", tone: 'danger' },
  PARTIAL: { label: 'Qisman', tone: 'warning' },
  PAID: { label: "To‘langan", tone: 'success' },
  CANCELLED: { label: 'Bekor', tone: 'neutral' },
};

export const PLAN_STATUS: Record<PlanItemStatus, StatusMeta> = {
  PLANNED: { label: 'Rejada', tone: 'info' },
  IN_PROGRESS: { label: 'Jarayonda', tone: 'primary' },
  DONE: { label: 'Bajarildi', tone: 'success' },
  CANCELLED: { label: 'Bekor', tone: 'neutral' },
};

export const CALL_RESULT: Record<CallResult, StatusMeta> = {
  PENDING: { label: 'Navbatda', tone: 'info' },
  CALLING: { label: "Qo‘ng‘iroq ketmoqda", tone: 'primary' },
  CONFIRMED: { label: 'Tasdiqladi', tone: 'success' },
  CANCELLED_BY_PATIENT: { label: 'Bekor qildi', tone: 'danger' },
  OPERATOR_REQUESTED: { label: "Operator so‘radi", tone: 'warning' },
  NO_ANSWER: { label: 'Javob bermadi', tone: 'warning' },
  BUSY: { label: 'Band', tone: 'warning' },
  FAILED: { label: 'Xato', tone: 'danger' },
  SKIPPED: { label: "O‘tkazib yuborildi", tone: 'neutral' },
};

export const STOCK_STATE: Record<StockState, StatusMeta> = {
  OK: { label: 'Yetarli', tone: 'success' },
  LOW: { label: 'Kam qoldi', tone: 'warning' },
  OUT: { label: 'Tugagan', tone: 'danger' },
  EXPIRING: { label: 'Muddati yaqin', tone: 'warning' },
  EXPIRED: { label: "Muddati o‘tgan", tone: 'danger' },
};

export const MOVEMENT_TYPE: Record<MovementType, StatusMeta> = {
  IN: { label: 'Kirim', tone: 'success' },
  USAGE: { label: 'Qabulda ishlatildi', tone: 'info' },
  MANUAL: { label: "Chiqim (qo‘lda)", tone: 'neutral' },
  WRITE_OFF: { label: 'Hisobdan chiqarish', tone: 'danger' },
  ADJUSTMENT: { label: 'Tuzatish', tone: 'warning' },
};

export const TOOTH_CONDITION: Record<ToothCondition, { label: string; short: string }> = {
  HEALTHY: { label: "Sog‘lom", short: "Sog‘lom" },
  CARIES: { label: 'Karies', short: 'Karies' },
  FILLING: { label: 'Plomba', short: 'Plomba' },
  ROOT_CANAL: { label: 'Kanal davolangan', short: 'Kanal' },
  CROWN: { label: 'Qoplama (koronka)', short: 'Koronka' },
  IMPLANT: { label: 'Implant', short: 'Implant' },
  MISSING: { label: "Yo‘q (olib tashlangan)", short: "Yo‘q" },
  EXTRACTION_PLANNED: { label: 'Olib tashlash rejalashtirilgan', short: 'Olib tashlash' },
  PLANNED: { label: 'Davolash rejalashtirilgan', short: 'Rejada' },
};

export const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  CASH: 'Naqd pul',
  TRANSFER: 'Kartaga o‘tkazish',
  CARD: 'Karta orqali',
};

/** Breket davolash bosqichlari (tartib bilan) */
export const ORTHO_STAGE: Record<OrthoStage, StatusMeta & { hint: string }> = {
  CONSULTATION: { label: 'Konsultatsiya', tone: 'neutral', hint: 'Ko‘rik va maslahat' },
  DIAGNOSTICS: { label: 'Diagnostika', tone: 'info', hint: 'Rentgen, qolip, reja' },
  BONDING: { label: 'Breket o‘rnatish', tone: 'primary', hint: 'Breketlar yopishtiriladi' },
  ADJUSTMENT: { label: 'Muntazam korreksiya', tone: 'primary', hint: 'Har oy duga va ligatura' },
  DEBONDING: { label: 'Breketni olish', tone: 'warning', hint: 'Breketlar olinadi' },
  RETENTION: { label: 'Retensiya', tone: 'success', hint: 'Ushlab turish davri (retainer)' },
};

export const ORTHO_STATUS: Record<OrthoStatus, StatusMeta> = {
  ACTIVE: { label: 'Davolanmoqda', tone: 'primary' },
  PAUSED: { label: 'To‘xtatilgan', tone: 'warning' },
  FINISHED: { label: 'Tugagan', tone: 'neutral' },
};

export const ORTHO_APPLIANCE: Record<OrthoAppliance, string> = {
  METAL: 'Metall breket',
  CERAMIC: 'Keramik breket',
  SAPPHIRE: 'Sapfir breket',
  SELF_LIGATING: 'Ligaturasiz breket',
  ALIGNER: 'Elayner (kappa)',
};

export const ORTHO_JAW: Record<OrthoJaw, string> = {
  UPPER: 'Yuqori jag‘',
  LOWER: 'Pastki jag‘',
  BOTH: 'Ikkala jag‘',
};
