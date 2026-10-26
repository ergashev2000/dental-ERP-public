import type { ID } from '@/shared/types/common';

export type Gender = 'M' | 'F';

export interface Patient {
  id: ID;
  cardNo: string;
  lastName: string;
  firstName: string;
  middleName?: string;
  /** Tezkor ro'yxatda kiritilmasligi mumkin */
  birthDate?: string;
  gender?: Gender;
  phone: string;
  phone2?: string;
  /** Viloyat va tuman — shared/constants/regions.ts dan */
  region?: string;
  district?: string;
  address?: string;
  source?: string;
  tags: string[];
  allergies: string[];
  conditions: string[];
  medications: string[];
  pregnant?: boolean;
  callConsent: boolean;
  guardian?: { name: string; phone: string };
  createdAt: string;
}

export type PatientInput = Omit<Patient, 'id' | 'cardNo' | 'createdAt'>;

/** Ro'yxat uchun hisoblangan maydonlar bilan */
export interface PatientRow extends Patient {
  debt: number;
  lastVisit?: string;
  nextAppointment?: string;
}

export interface PatientFile {
  id: ID;
  patientId: ID;
  name: string;
  url: string;
  mime: string;
  size: number;
  note?: string;
  uploadedById: ID;
  createdAt: string;
  /** Breket korreksiyasi rasmi bo'lsa */
  orthoVisitId?: ID;
  photoKind?: 'BEFORE' | 'PROGRESS' | 'AFTER';
}

export type PatientSort = 'name' | '-createdAt' | '-lastVisit' | '-debt';

export interface PatientFilters {
  q?: string | null;
  tag?: string | null;
  hasDebt?: boolean | null;
  doctor?: string | null;
  sort?: PatientSort | null;
  page?: number;
  pageSize?: number;
}
