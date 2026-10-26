export type ReportType = 'revenue' | 'doctors' | 'services' | 'appointments' | 'reminders' | 'inventory';

export interface ReportQuery {
  from: string;
  to: string;
  doctor?: string | null;
}

export interface RevenueReport {
  total: number;
  refunds: number;
  byDay: { date: string; amount: number }[];
  byMethod: { method: string; amount: number; count: number }[];
}

export interface DoctorsReportRow {
  doctorId: string;
  name: string;
  total: number;
  completed: number;
  noShow: number;
  cancelled: number;
  /** null — ruxsat yo'q (shifokor o'z hisobotini daromadsiz ko'radi) */
  amount: number | null;
}

export interface ServicesReportRow {
  serviceId: string;
  code: string;
  name: string;
  count: number;
  amount: number | null;
}

export interface AppointmentsReport {
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  noShowPct: number;
  bySource: { source: string; count: number }[];
}

export interface RemindersReport {
  calls: number;
  confirmed: number;
  confirmRate: number;
  byResult: { result: string; count: number }[];
  noShowRateWith: number;
  noShowRateWithout: number;
  withCount: number;
  withoutCount: number;
}

export interface InventoryReport {
  inSum: number;
  outSum: number;
  topUsed: { productId: string; name: string; unit: string; qty: number; cost: number }[];
}
