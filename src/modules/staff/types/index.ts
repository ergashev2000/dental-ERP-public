import type { ID } from '@/shared/types/common';
import type { StaffColor } from '@/shared/theme/tokens';

export type StaffPosition = 'OWNER' | 'ADMIN' | 'DOCTOR' | 'ASSISTANT' | 'RECEPTIONIST' | 'CASHIER' | 'STOREKEEPER';

export interface WorkDay {
  /** ISO hafta kuni: 1 = dushanba ... 7 = yakshanba */
  weekday: number;
  start: string;
  end: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface TimeOff {
  from: string;
  to: string;
  reason: string;
}

export interface Staff {
  id: ID;
  fullName: string;
  position: StaffPosition;
  specialty?: string;
  phone: string;
  color: StaffColor;
  isActive: boolean;
  schedule: WorkDay[];
  timeOff: TimeOff[];
}

export type StaffInput = Omit<Staff, 'id' | 'schedule' | 'timeOff'>;
