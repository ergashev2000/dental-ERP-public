import dayjs from '@/shared/lib/dayjs';
import type { Batch, MovementType, ProductRow, StockMovement, StockState } from '@/modules/inventory/types';
import { formatNumber } from '@/shared/utils/format';
import { mockDb } from '../mockDb';
import { ApiError } from '../mockRequest';
import { uid } from '../helpers';
import { findProduct } from './lookup';

const round = (n: number) => +n.toFixed(3);

export const isExpired = (b: Batch) => !!b.expiresAt && dayjs(b.expiresAt).endOf('day').isBefore(dayjs());

export const productBatches = (productId: string) => mockDb.batches.filter((b) => b.productId === productId);

export const productStock = (productId: string) =>
  round(productBatches(productId).reduce((s, b) => s + b.remaining, 0));

export const usableStock = (productId: string) =>
  round(
    productBatches(productId)
      .filter((b) => !isExpired(b))
      .reduce((s, b) => s + b.remaining, 0),
  );

export const productRow = (productId: string): ProductRow => {
  const p = findProduct(productId);
  const batches = productBatches(productId);
  const stock = productStock(productId);
  const live = batches.filter((b) => b.remaining > 0);
  const totalQty = live.reduce((s, b) => s + b.remaining, 0);
  const avgCost = totalQty ? Math.round(live.reduce((s, b) => s + b.remaining * b.unitCost, 0) / totalQty) : 0;
  const nearestExpiry = live
    .map((b) => b.expiresAt)
    .filter((x): x is string => !!x)
    .sort()
    .at(0);
  const hasExpired = live.some(isExpired);
  const expiring = !!nearestExpiry && dayjs(nearestExpiry).diff(dayjs(), 'day') < 30;
  let state: StockState = 'OK';
  if (stock <= 0) state = 'OUT';
  else if (hasExpired) state = 'EXPIRED';
  else if (stock <= p.minStock) state = 'LOW';
  else if (expiring) state = 'EXPIRING';
  return { ...p, stock, usable: usableStock(productId), avgCost, nearestExpiry, state };
};

interface MoveMeta {
  type: MovementType;
  byId: string;
  reason?: string;
  refType?: StockMovement['refType'];
  refId?: string;
  at?: string;
}

export const pushMovement = (productId: string, batchId: string | undefined, qty: number, meta: MoveMeta) => {
  const m: StockMovement = {
    id: uid('mv'),
    productId,
    batchId,
    type: meta.type,
    qty: round(qty),
    balanceAfter: productStock(productId),
    reason: meta.reason,
    refType: meta.refType,
    refId: meta.refId,
    byId: meta.byId,
    createdAt: meta.at ?? new Date().toISOString(),
  };
  mockDb.movements.push(m);
  return m;
};

/**
 * FEFO chiqim: avval muddati eng yaqin partiyadan olinadi.
 * USAGE uchun muddati o'tgan partiyalar o'tkazib yuboriladi (ogohlantirish qaytadi).
 * Qoldiqdan ko'p chiqim qilib bo'lmaydi (10-bo'lim, 7-qoida).
 */
export const consumeFefo = (productId: string, qty: number, meta: MoveMeta & { batchId?: string }) => {
  const product = findProduct(productId);
  const warnings: string[] = [];
  const skipExpired = meta.type === 'USAGE' || meta.type === 'MANUAL';
  let batches = productBatches(productId)
    .filter((b) => b.remaining > 0)
    .sort((a, b) => (a.expiresAt ?? '9999').localeCompare(b.expiresAt ?? '9999') || a.receivedAt.localeCompare(b.receivedAt));

  if (meta.batchId) batches = batches.filter((b) => b.id === meta.batchId);

  if (skipExpired) {
    const expired = batches.filter(isExpired);
    if (expired.length) {
      warnings.push(
        `${product.name}: muddati o‘tgan partiya (${expired.map((b) => b.docNo ?? b.id).join(', ')}) o‘tkazib yuborildi, keyingi partiyadan olindi`,
      );
    }
    batches = batches.filter((b) => !isExpired(b));
  }

  const available = round(batches.reduce((s, b) => s + b.remaining, 0));
  if (qty > available + 1e-9) {
    throw new ApiError(
      422,
      `${product.name}: qoldiq yetarli emas (kerak ${formatNumber(qty, 2)} ${product.unit}, mavjud ${formatNumber(available, 2)} ${product.unit})`,
    );
  }

  let left = qty;
  for (const b of batches) {
    if (left <= 0) break;
    const take = round(Math.min(b.remaining, left));
    b.remaining = round(b.remaining - take);
    left = round(left - take);
    pushMovement(productId, b.id, -take, meta);
  }
  return warnings;
};

export const addBatch = (batch: Omit<Batch, 'id' | 'remaining'>, meta: MoveMeta) => {
  const b: Batch = { ...batch, id: uid('b'), remaining: batch.qty };
  mockDb.batches.push(b);
  pushMovement(b.productId, b.id, b.qty, meta);
  return b;
};
