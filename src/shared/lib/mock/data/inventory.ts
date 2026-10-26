import dayjs from '@/shared/lib/dayjs';
import type { Batch, StockMovement } from '@/modules/inventory/types';
import { createRng, d, day } from '../helpers';
import { appointmentsSeed } from './appointments';

const rng = createRng(777);

/** [id, productId, qty, remaining, unitCost, receivedDaysAgo, expiresInDays?, supplierId] */
type BatchSeed = [string, string, number, number, number, number, number | null, string];

const BATCHES: BatchSeed[] = [
  ['b1', 'pr1', 40, 24, 12_000, 28, 200, 'sp1'],
  ['b2', 'pr1', 50, 40, 11_500, 9, 400, 'sp3'],
  ['b3', 'pr2', 10, 3.5, 60_000, 26, 150, 'sp1'],
  ['b4', 'pr3', 100, 13, 9_000, 29, 90, 'sp2'],
  ['b5', 'pr3', 50, 25, 9_500, 12, 300, 'sp2'],
  ['b6', 'pr4', 20, 12, 85_000, 25, null, 'sp3'],
  ['b7', 'pr5', 300, 240, 500, 24, 500, 'sp3'],
  ['b8', 'pr6', 30, 0, 3_000, 27, 180, 'sp1'],
  ['b9', 'pr7', 500, 350, 1_200, 27, 700, 'sp1'],
  ['b10', 'pr7', 500, 500, 1_150, 6, 720, 'sp1'],
  ['b11', 'pr8', 500, 410, 400, 22, 700, 'sp1'],
  ['b12', 'pr9', 30, 14, 15_000, 20, 360, 'sp2'],
  ['b13', 'pr10', 5, 3, 2_500_000, 18, 900, 'sp2'],
  ['b14', 'pr11', 100, 40, 800, 26, 12, 'sp3'],
  ['b15', 'pr11', 100, 80, 850, 10, 365, 'sp3'],
  ['b16', 'pr12', 5, 2, 350_000, 23, 120, 'sp3'],
  ['b17', 'pr13', 10, 6, 40_000, 21, 240, 'sp1'],
  ['b18', 'pr14', 20, 11, 45_000, 19, 300, 'sp1'],
  ['b19', 'pr15', 1000, 200, 300, 29, 900, 'sp1'],
  ['b20', 'pr15', 1000, 1000, 290, 4, 900, 'sp1'],
  ['b21', 'pr16', 50, 8, 6_000, 29, -10, 'sp3'],
  ['b22', 'pr16', 30, 12, 6_500, 8, 200, 'sp3'],
];

export const batchesSeed: Batch[] = BATCHES.map(([id, productId, qty, remaining, unitCost, ago, exp, supplierId], i) => ({
  id,
  productId,
  qty,
  remaining,
  unitCost,
  expiresAt: exp === null ? undefined : d(exp),
  supplierId,
  receivedAt: day(-ago).hour(10).toISOString(),
  docNo: `KR-${String(210 + i).padStart(4, '0')}`,
}));

const completedByDate = appointmentsSeed
  .filter((a) => a.status === 'COMPLETED' && dayjs(a.start).isBefore(dayjs()))
  .sort((a, b) => a.start.localeCompare(b.start));

/**
 * Harakatlar tarixi: har partiya uchun kirim + ishlatilgan miqdor 1–3 ta USAGE chiqimiga bo'linadi.
 * Qoldiq (balanceAfter) xronologik tartibda hisoblanadi — partiyalar qoldig'i bilan mos keladi.
 */
const buildMovements = (): StockMovement[] => {
  const raw: Omit<StockMovement, 'balanceAfter'>[] = [];
  let n = 0;
  for (const b of batchesSeed) {
    raw.push({
      id: `mv${++n}`,
      productId: b.productId,
      batchId: b.id,
      type: 'IN',
      qty: b.qty,
      refType: 'RECEIPT',
      refId: b.docNo,
      byId: 's6',
      createdAt: b.receivedAt,
    });
    let used = +(b.qty - b.remaining).toFixed(2);
    if (used <= 0) continue;
    const limit = b.expiresAt && dayjs(b.expiresAt).isBefore(dayjs()) ? dayjs(b.expiresAt) : dayjs();
    const candidates = completedByDate.filter((a) => dayjs(a.start).isAfter(b.receivedAt) && dayjs(a.start).isBefore(limit));
    const parts = Math.min(candidates.length || 1, rng.int(1, 3));
    for (let i = 0; i < parts; i++) {
      const isLast = i === parts - 1;
      const portion = isLast ? used : +(used * (rng.int(30, 60) / 100)).toFixed(2);
      used = +(used - portion).toFixed(2);
      const appt = candidates.length ? candidates[Math.floor(((i + 1) / (parts + 1)) * candidates.length)] : undefined;
      raw.push({
        id: `mv${++n}`,
        productId: b.productId,
        batchId: b.id,
        type: 'USAGE',
        qty: -portion,
        refType: appt ? 'APPOINTMENT' : undefined,
        refId: appt?.id,
        reason: 'Qabulda ishlatildi',
        byId: appt?.doctorId ?? 's1',
        createdAt: appt ? dayjs(appt.start).add(appt.durationMin, 'minute').toISOString() : dayjs(b.receivedAt).add(3, 'day').toISOString(),
      });
    }
  }
  raw.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const balance: Record<string, number> = {};
  return raw.map((m) => {
    balance[m.productId] = +((balance[m.productId] ?? 0) + m.qty).toFixed(2);
    return { ...m, balanceAfter: balance[m.productId]! };
  });
};

export const movementsSeed: StockMovement[] = buildMovements();
