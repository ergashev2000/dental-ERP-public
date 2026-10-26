import dayjs from '@/shared/lib/dayjs';
import type { Invoice, InvoiceLine, Payment, PaymentMethod } from '@/modules/billing/types';
import { createRng } from '../helpers';
import { appointmentsSeed } from './appointments';
import { servicesSeed } from './catalog';

const rng = createRng(4242);

/** Qabul bo'yicha tish raqamlari (tish bo'yicha xizmatlar uchun) */
const TEETH: Record<string, number> = {
  a2: 16,
  a3: 14,
  a13: 14,
  a16: 36,
  a91: 23,
  a93: 64,
};

const linesFor = (appointmentId: string, serviceIds: string[]): InvoiceLine[] =>
  serviceIds.flatMap((sid) => {
    const s = servicesSeed.find((x) => x.id === sid)!;
    if (appointmentId === 'a91' && s.code === 'O301') {
      return [23, 24].map((tooth) => ({ serviceId: sid, tooth, qty: 1, price: s.price, discount: 0 }));
    }
    const tooth = s.perTooth ? (TEETH[appointmentId] ?? rng.pick([16, 26, 36, 46, 15, 25, 37, 47])) : undefined;
    return [{ serviceId: sid, tooth, qty: 1, price: s.price, discount: 0 }];
  });

const sumLines = (lines: InvoiceLine[]) => lines.reduce((s, l) => s + l.price * l.qty - l.discount, 0);

export const invoicesSeed: Invoice[] = [];
export const paymentsSeed: Payment[] = [];

let invNo = 100;
let payNo = 0;

const addPayment = (inv: Invoice, amount: number, method: PaymentMethod, at: string, receivedById = 's6') => {
  paymentsSeed.push({
    id: `pay${++payNo}`,
    invoiceId: inv.id,
    patientId: inv.patientId,
    amount,
    method,
    receivedById,
    createdAt: at,
  });
  inv.paid += amount;
};

const METHODS: PaymentMethod[] = ['CASH', 'CASH', 'CASH', 'CARD', 'CARD', 'TRANSFER', 'TRANSFER', 'TRANSFER'];

const completed = appointmentsSeed
  .filter((a) => a.status === 'COMPLETED')
  .sort((a, b) => a.start.localeCompare(b.start));

for (const a of completed) {
  const lines = linesFor(a.id, a.serviceIds);
  const total = sumLines(lines);
  const createdAt = dayjs(a.start).add(a.durationMin, 'minute').toISOString();
  const inv: Invoice = {
    id: `inv${invNo + 1}`,
    number: `INV-${dayjs(createdAt).year()}-${String(++invNo).padStart(4, '0')}`,
    patientId: a.patientId,
    appointmentId: a.id,
    lines,
    discount: 0,
    total,
    paid: 0,
    status: 'UNPAID',
    createdAt,
  };
  const payAt = dayjs(createdAt).add(5, 'minute').toISOString();

  if (a.id === 'a1') {
    // naqd va karta aralash
    addPayment(inv, total / 2, 'CASH', payAt);
    addPayment(inv, total / 2, 'CARD', payAt);
  } else if (a.id === 'a2') {
    // qisman: 450 000 qarz qoladi
    addPayment(inv, total - 450_000, 'CASH', payAt);
  } else if (a.id === 'a91') {
    // p7 — eski 1 200 000 qarz
    addPayment(inv, 1_500_000, 'CASH', payAt);
    addPayment(inv, total - 1_200_000 - 1_500_000, 'CARD', dayjs(payAt).add(14, 'day').toISOString());
  } else if (rng.chance(0.2) && total >= 400_000) {
    // bo'lib to'lash
    const first = Math.round(total / 2 / 1000) * 1000;
    addPayment(inv, first, rng.pick(METHODS), payAt);
    addPayment(inv, total - first, rng.pick(METHODS), payAt);
  } else {
    addPayment(inv, total, rng.pick(METHODS), payAt);
  }

  inv.status = inv.paid >= inv.total ? 'PAID' : inv.paid > 0 ? 'PARTIAL' : 'UNPAID';
  invoicesSeed.push(inv);
}
