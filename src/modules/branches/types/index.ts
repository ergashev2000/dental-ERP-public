export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  chairs: number;
  isActive: boolean;
  /** Mock ko'rsatkichlar — filiallarni solishtirish uchun (oy boshidan) */
  stats: { revenue: number; appointments: number; noShowRate: number; newPatients: number };
}

export type BranchInput = Pick<Branch, 'name' | 'address' | 'phone' | 'chairs' | 'isActive'>;
