import type { ID } from '@/shared/types/common';

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD';
export type InvoiceStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'CANCELLED';

export interface InvoiceLine {
  serviceId: ID;
  tooth?: number;
  qty: number;
  price: number;
  /** Qator chegirmasi — summada */
  discount: number;
}

export interface Invoice {
  id: ID;
  number: string;
  patientId: ID;
  appointmentId: ID;
  /** Breket shartnomasi bo'yicha hisob-faktura (appointmentId bo'sh bo'ladi) */
  orthoCaseId?: ID;
  lines: InvoiceLine[];
  /** Butun invoice bo'yicha qo'shimcha chegirma (summada) */
  discount: number;
  discountReason?: string;
  total: number;
  paid: number;
  status: InvoiceStatus;
  createdAt: string;
}

export interface InvoiceLineView extends InvoiceLine {
  serviceName: string;
  sum: number;
}

export interface InvoiceView extends Invoice {
  patientName: string;
  patientPhone: string;
  doctorName: string;
  remaining: number;
  lineViews: InvoiceLineView[];
}

export interface Payment {
  id: ID;
  invoiceId: ID;
  patientId: ID;
  amount: number;
  method: PaymentMethod;
  receivedById: ID;
  note?: string;
  refunded?: { byId: ID; reason: string; at: string };
  createdAt: string;
}

export interface PaymentView extends Payment {
  patientName: string;
  invoiceNumber: string;
  receivedByName: string;
}

export interface PaymentInput {
  invoiceId: ID;
  amount: number;
  method: PaymentMethod;
  note?: string;
}

export interface DiscountInput {
  invoiceId: ID;
  /** null — butun invoice */
  lineIndex: number | null;
  mode: 'percent' | 'amount';
  value: number;
  reason: string;
}

export interface Debtor {
  patientId: ID;
  patientName: string;
  phone: string;
  debt: number;
  lastPaymentAt?: string;
  openInvoices: number;
}

export interface CashboxSummary {
  date: string;
  total: number;
  refunds: number;
  byMethod: { method: PaymentMethod; amount: number; count: number }[];
  payments: PaymentView[];
}

export interface InvoiceFilters {
  q?: string | null;
  status?: InvoiceStatus | null;
  patientId?: string;
  page?: number;
  pageSize?: number;
}

export interface PaymentFilters {
  q?: string | null;
  method?: PaymentMethod | null;
  patientId?: string;
  from?: string | null;
  to?: string | null;
  page?: number;
  pageSize?: number;
}
