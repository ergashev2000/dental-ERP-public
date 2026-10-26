import type { ID } from '@/shared/types/common';

export type ToothCondition =
  | 'HEALTHY'
  | 'CARIES'
  | 'FILLING'
  | 'ROOT_CANAL'
  | 'CROWN'
  | 'IMPLANT'
  | 'MISSING'
  | 'EXTRACTION_PLANNED'
  | 'PLANNED';

export type Surface = 'M' | 'D' | 'O' | 'B' | 'L';
export type SurfaceState = 'CARIES' | 'FILLING';
export type SurfaceMap = Partial<Record<Surface, SurfaceState>>;

export interface ToothRecord {
  patientId: ID;
  tooth: number;
  conditions: ToothCondition[];
  surfaces: SurfaceMap;
  note?: string;
  updatedAt: string;
}

export interface ToothHistory {
  id: ID;
  patientId: ID;
  tooth: number;
  action: string;
  oldValue?: string;
  newValue?: string;
  doctorId: ID;
  appointmentId?: ID;
  createdAt: string;
}

export interface ToothHistoryView extends ToothHistory {
  doctorName: string;
}

export type Dentition = 'adult' | 'child' | 'mixed';

export interface ToothPatch {
  conditions: ToothCondition[];
  surfaces: SurfaceMap;
  note?: string;
}
