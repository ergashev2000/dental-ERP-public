import type { ProductRow } from '../types';

type StockPair = Pick<ProductRow, 'stock' | 'minStock'>;

/** Buyurtma taklifi (taxminiy): minimal qoldiqning ikki barobarigacha to'ldirish — minStock × 2 − qoldiq */
export const suggestReorder = (p: StockPair) => Math.max(Math.ceil(p.minStock * 2 - Math.max(p.stock, 0)), 0);

/** Minimal qoldiq belgilangan va qoldiq unga yetgan (yoki tugagan) */
export const needsReorder = (p: StockPair) => p.minStock > 0 && p.stock <= p.minStock;
