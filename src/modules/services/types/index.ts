import type { ID } from '@/shared/types/common';

export interface ServiceMaterial {
  productId: ID;
  qty: number;
}

export interface Service {
  id: ID;
  code: string;
  name: string;
  category: string;
  price: number;
  durationMin: number;
  perTooth: boolean;
  isActive: boolean;
  materials: ServiceMaterial[];
}

export type ServiceInput = Omit<Service, 'id'>;
