import type { ID } from '@/shared/types/common';

export interface Product {
  id: ID;
  name: string;
  sku?: string;
  category: string;
  unit: string;
  minStock: number;
  location?: string;
  note?: string;
}

export type ProductInput = Omit<Product, 'id'>;

export interface Batch {
  id: ID;
  productId: ID;
  qty: number;
  remaining: number;
  unitCost: number;
  expiresAt?: string;
  supplierId?: ID;
  receivedAt: string;
  docNo?: string;
}

export type MovementType = 'IN' | 'USAGE' | 'MANUAL' | 'WRITE_OFF' | 'ADJUSTMENT';

export interface StockMovement {
  id: ID;
  productId: ID;
  batchId?: ID;
  type: MovementType;
  /** Ishorali: kirim +, chiqim − */
  qty: number;
  balanceAfter: number;
  reason?: string;
  refType?: 'APPOINTMENT' | 'RECEIPT';
  refId?: ID;
  byId: ID;
  createdAt: string;
}

export interface Supplier {
  id: ID;
  name: string;
  phone: string;
  contact?: string;
  note?: string;
}

export type SupplierInput = Omit<Supplier, 'id'>;

export type StockState = 'OK' | 'LOW' | 'OUT' | 'EXPIRING' | 'EXPIRED';

export interface ProductRow extends Product {
  stock: number;
  /** Muddati o'tmagan (ishlatish mumkin bo'lgan) qoldiq */
  usable: number;
  avgCost: number;
  nearestExpiry?: string;
  state: StockState;
}

export interface BatchView extends Batch {
  supplierName?: string;
  expired: boolean;
}

export interface MovementView extends StockMovement {
  productName: string;
  unit: string;
  byName: string;
  refLabel?: string;
}

export interface ReceiptInput {
  date: string;
  supplierId?: ID;
  docNo?: string;
  lines: { productId: ID; qty: number; unitCost: number; expiresAt?: string }[];
}

export interface IssueInput {
  type: 'MANUAL' | 'WRITE_OFF' | 'ADJUSTMENT';
  productId: ID;
  /** MANUAL/WRITE_OFF: chiqim miqdori; ADJUSTMENT: haqiqiy sanalgan qoldiq */
  qty: number;
  batchId?: ID;
  reason?: string;
}

export type StockFilter = 'all' | 'low' | 'out' | 'expiring';

export interface StockFilters {
  q?: string | null;
  category?: string | null;
  stock?: StockFilter;
}

export interface MovementFilters {
  q?: string | null;
  type?: MovementType | null;
  productId?: string;
  page?: number;
  pageSize?: number;
}
