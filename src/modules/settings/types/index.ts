import type { ID } from '@/shared/types/common';
import type { Role } from '@/shared/constants/roles';
import type { PaymentMethod } from '@/modules/billing/types';

export interface ClinicSettings {
  name: string;
  logoUrl?: string;
  address: string;
  phone: string;
  /** ISO hafta kunlari (1–7) */
  workDays: number[];
  workStart: string;
  workEnd: string;
  slotStep: 10 | 15 | 30;
  paymentMethods: Record<PaymentMethod, boolean>;
  receiptHeader: string;
  receiptFooter: string;
}

export interface Chair {
  id: ID;
  name: string;
  isActive: boolean;
}

export interface UserView {
  id: ID;
  username: string;
  role: Role;
  staffId: ID;
  staffName: string;
  isActive: boolean;
}

export interface UserInput {
  username: string;
  role: Role;
  staffId: ID;
  isActive: boolean;
  password?: string;
}
