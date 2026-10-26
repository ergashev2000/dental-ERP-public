import type { ID } from '@/shared/types/common';

export type DocTemplateKey = 'GENERAL_CONSENT' | 'IMPLANT_CONSENT' | 'EXTRACTION_CONSENT' | 'BRACES_CONTRACT' | 'PRESCRIPTION';

export type DocStatus = 'DRAFT' | 'SIGNED';

/** Shablondagi qo‘shimcha maydonlar: {tish}, {narx} */
export type DocField = 'tish' | 'narx';

export interface DocTemplate {
  key: DocTemplateKey;
  title: string;
  description: string;
  fields: DocField[];
  /** Imzo kimniki: rozilik va shartnomada — bemor, retseptda — shifokor */
  signer: 'patient' | 'doctor';
  body: string;
}

export interface PatientDocument {
  id: ID;
  number: string;
  patientId: ID;
  templateKey: DocTemplateKey;
  title: string;
  /** To‘ldirilgan (placeholder'lar o‘rniga qiymatlar qo‘yilgan) matn */
  body: string;
  doctorId: ID;
  teeth: number[];
  price?: number;
  status: DocStatus;
  createdAt: string;
  createdByName: string;
  signedAt?: string;
  /** Imzo rasmi (data URL) */
  signature?: string;
  /** "Bemor tanishib chiqdi" belgisi */
  acknowledged: boolean;
}

export interface DocumentView extends PatientDocument {
  doctorName: string;
}

/** Shablonni to‘ldirish uchun kontekst: bemor, klinika, standart shifokor */
export interface DocumentContext {
  patientName: string;
  patientCardNo: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  /** Joriy foydalanuvchi shifokor bo‘lsa — o‘zi, aks holda bemorning oxirgi qabuli shifokori */
  defaultDoctorId?: ID;
}

export interface DocumentInput {
  patientId: ID;
  templateKey: DocTemplateKey;
  body: string;
  doctorId: ID;
  teeth: number[];
  price?: number;
  /** Berilsa — hujjat imzolanadi (Imzolangan) */
  signature?: string;
  acknowledged?: boolean;
}
