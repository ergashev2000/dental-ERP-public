import type { ID } from '@/shared/types/common';
import type { Surface } from '@/modules/dental-chart/types';

export type PlanItemStatus = 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export interface TreatmentPlanItem {
  id: ID;
  patientId: ID;
  stage: number;
  tooth?: number;
  surfaces?: Surface[];
  serviceId: ID;
  price: number;
  /** Chegirma foizda (0–100) */
  discount: number;
  doctorId: ID;
  status: PlanItemStatus;
  appointmentId?: ID;
  createdAt: string;
}

export interface PlanItemView extends TreatmentPlanItem {
  serviceName: string;
  serviceCode: string;
  doctorName: string;
  total: number;
}

export interface PlanItemInput {
  patientId: ID;
  stage: number;
  tooth?: number;
  surfaces?: Surface[];
  serviceId: ID;
  price: number;
  discount: number;
  doctorId: ID;
}
