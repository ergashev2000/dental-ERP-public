import dayjs from '@/shared/lib/dayjs';
import { mockDb } from '@/shared/lib/mock/mockDb';
import { ApiError, assert, currentUser, matches, mockRequest, paginate } from '@/shared/lib/mock/mockRequest';
import { hasPermission, type Permission } from '@/shared/constants/roles';
import { uid } from '@/shared/lib/mock/helpers';
import { findInvoice, invoiceRemaining, patientFullName, patientName, serviceName, staffName } from '@/shared/lib/mock/ops/lookup';
import { recomputeInvoice } from '@/shared/lib/mock/ops/clinicalOps';
import { formatMoney } from '@/shared/utils/format';
import type {
  CashboxSummary,
  Debtor,
  DiscountInput,
  Invoice,
  InvoiceFilters,
  InvoiceView,
  Payment,
  PaymentFilters,
  PaymentInput,
  PaymentMethod,
  PaymentView,
} from '../types';

const toInvoiceView = (inv: Invoice): InvoiceView => {
  const appt = mockDb.appointments.find((a) => a.id === inv.appointmentId);
  const p = mockDb.patients.find((x) => x.id === inv.patientId);
  return {
    ...inv,
    patientName: patientName(inv.patientId),
    patientPhone: p?.phone ?? '',
    doctorName: staffName(appt?.doctorId),
    remaining: invoiceRemaining(inv),
    lineViews: inv.lines.map((l) => ({ ...l, serviceName: serviceName(l.serviceId), sum: l.price * l.qty - l.discount })),
  };
};

const toPaymentView = (p: Payment): PaymentView => ({
  ...p,
  patientName: patientName(p.patientId),
  invoiceNumber: mockDb.invoices.find((i) => i.id === p.invoiceId)?.number ?? '—',
  receivedByName: staffName(p.receivedById),
});

/** Ruxsatlar matritsasi bo'yicha tekshiruv (Kassir, Egasi va Sozlamalar → Rollar o'zgarishlari hisobga olinadi) */
const requirePerm = (perm: Permission) => {
  const user = currentUser();
  if (!hasPermission(user.role, perm)) throw new ApiError(403, 'Bu amal uchun ruxsat yo‘q');
  return user;
};

export const billingApi = {
  // GET /api/invoices?q=&status=&page=
  invoices: (f: InvoiceFilters) =>
    mockRequest(() => {
      currentUser();
      const rows = mockDb.invoices
        .filter((i) => !f.patientId || i.patientId === f.patientId)
        .filter((i) => !f.status || i.status === f.status)
        .filter((i) => matches(f.q, i.number, patientFullName(i.patientId), mockDb.patients.find((p) => p.id === i.patientId)?.phone))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(toInvoiceView);
      return paginate(rows, f.page ?? 1, f.pageSize ?? 10);
    }),

  // GET /api/invoices/:id
  invoice: (id: string) => mockRequest(() => toInvoiceView(findInvoice(id)), 200),

  // GET /api/patients/:id/open-invoices
  openInvoices: (patientId: string) =>
    mockRequest(
      () =>
        mockDb.invoices
          .filter((i) => i.patientId === patientId && invoiceRemaining(i) > 0)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          .map(toInvoiceView),
      200,
    ),

  // GET /api/payments?q=&method=&from=&to=&page=
  payments: (f: PaymentFilters) =>
    mockRequest(() => {
      currentUser();
      const rows = mockDb.payments
        .filter((p) => !f.patientId || p.patientId === f.patientId)
        .filter((p) => !f.method || p.method === f.method)
        .filter((p) => !f.from || dayjs(p.createdAt).isSameOrAfter(dayjs(f.from).startOf('day')))
        .filter((p) => !f.to || dayjs(p.createdAt).isSameOrBefore(dayjs(f.to).endOf('day')))
        .filter((p) => matches(f.q, patientFullName(p.patientId)))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(toPaymentView);
      return paginate(rows, f.page ?? 1, f.pageSize ?? 10);
    }),

  // GET /api/payments/:id
  payment: (id: string) =>
    mockRequest(() => {
      const p = mockDb.payments.find((x) => x.id === id);
      assert(p, 'To‘lov topilmadi', 404);
      return { payment: toPaymentView(p), invoice: toInvoiceView(findInvoice(p.invoiceId)), clinic: mockDb.clinic };
    }, 150),

  // GET /api/debtors
  debtors: (q?: string | null) =>
    mockRequest((): Debtor[] => {
      requirePerm('billing.view');
      const map = new Map<string, Debtor>();
      for (const inv of mockDb.invoices) {
        const rem = invoiceRemaining(inv);
        if (rem <= 0) continue;
        const p = mockDb.patients.find((x) => x.id === inv.patientId);
        if (!p || !matches(q, patientFullName(p.id), p.phone)) continue;
        const d = map.get(p.id) ?? {
          patientId: p.id,
          patientName: patientName(p.id),
          phone: p.phone,
          debt: 0,
          openInvoices: 0,
          lastPaymentAt: mockDb.payments
            .filter((x) => x.patientId === p.id && !x.refunded)
            .map((x) => x.createdAt)
            .sort()
            .at(-1),
        };
        d.debt += rem;
        d.openInvoices += 1;
        map.set(p.id, d);
      }
      return [...map.values()].sort((a, b) => b.debt - a.debt);
    }),

  // GET /api/cashbox?date=
  cashbox: (date: string) =>
    mockRequest((): CashboxSummary => {
      requirePerm('billing.view');
      const list = mockDb.payments.filter((p) => dayjs(p.createdAt).isSame(dayjs(date), 'day'));
      const active = list.filter((p) => !p.refunded);
      const byMethod = (Object.keys(mockDb.clinic.paymentMethods) as PaymentMethod[])
        .map((method) => {
          const items = active.filter((p) => p.method === method);
          return { method, amount: items.reduce((s, p) => s + p.amount, 0), count: items.length };
        })
        .filter((x) => x.count > 0 || mockDb.clinic.paymentMethods[x.method]);
      return {
        date,
        total: active.reduce((s, p) => s + p.amount, 0),
        refunds: list.filter((p) => p.refunded).reduce((s, p) => s + p.amount, 0),
        byMethod,
        payments: list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(toPaymentView),
      };
    }),

  // POST /api/payments
  receive: (input: PaymentInput) =>
    mockRequest(() => {
      const user = requirePerm('payment.receive');
      const inv = findInvoice(input.invoiceId);
      assert(inv.status !== 'CANCELLED', 'Bekor qilingan hisob-fakturaga to‘lov qabul qilinmaydi');
      assert(mockDb.clinic.paymentMethods[input.method], 'Bu to‘lov turi o‘chirilgan');
      assert(input.amount > 0, 'Summani kiriting');
      // 6-qoida: to'lov qoldiqdan oshmaydi (avans MVPda yo'q)
      const rem = invoiceRemaining(inv);
      assert(input.amount <= rem, `Summa qoldiqdan oshmasligi kerak (qoldiq: ${formatMoney(rem)})`);
      const p: Payment = {
        id: uid('pay'),
        invoiceId: inv.id,
        patientId: inv.patientId,
        amount: input.amount,
        method: input.method,
        note: input.note,
        receivedById: user.staffId,
        createdAt: new Date().toISOString(),
      };
      mockDb.payments.push(p);
      inv.paid += input.amount;
      recomputeInvoice(inv);
      return toPaymentView(p);
    }),

  // POST /api/payments/:id/refund — to'lov o'chirilmaydi, bekor qilish belgisi qo'yiladi (11-qoida)
  refund: (paymentId: string, reason: string) =>
    mockRequest(() => {
      const user = requirePerm('payment.refund');
      assert(reason?.trim(), 'Sababni kiriting');
      const p = mockDb.payments.find((x) => x.id === paymentId);
      assert(p, 'To‘lov topilmadi', 404);
      assert(!p.refunded, 'To‘lov allaqachon bekor qilingan');
      p.refunded = { byId: user.staffId, reason: reason.trim(), at: new Date().toISOString() };
      const inv = findInvoice(p.invoiceId);
      inv.paid = Math.max(0, inv.paid - p.amount);
      recomputeInvoice(inv);
      return toPaymentView(p);
    }),

  // POST /api/invoices/:id/discount — sabab majburiy
  discount: (input: DiscountInput) =>
    mockRequest(() => {
      requirePerm('payment.discount');
      assert(input.reason?.trim(), 'Chegirma sababini kiriting');
      assert(input.value > 0, 'Chegirma qiymatini kiriting');
      if (input.mode === 'percent') assert(input.value <= 100, 'Foiz 100 dan oshmasin');
      const inv = findInvoice(input.invoiceId);
      assert(inv.status !== 'CANCELLED', 'Bekor qilingan hisob-faktura');
      const snapshot = structuredClone({ lines: inv.lines, discount: inv.discount, discountReason: inv.discountReason });
      if (input.lineIndex !== null) {
        const line = inv.lines[input.lineIndex];
        assert(line, 'Qator topilmadi', 404);
        const gross = line.price * line.qty;
        const amount = input.mode === 'percent' ? Math.round((gross * input.value) / 100) : input.value;
        assert(amount <= gross, 'Chegirma qator summasidan oshmasin');
        line.discount = amount;
      } else {
        const base = inv.lines.reduce((s, l) => s + l.price * l.qty - l.discount, 0);
        const amount = input.mode === 'percent' ? Math.round((base * input.value) / 100) : input.value;
        assert(amount <= base, 'Chegirma summadan oshmasin');
        inv.discount = amount;
      }
      inv.discountReason = input.reason.trim();
      recomputeInvoice(inv);
      if (inv.total < inv.paid) {
        Object.assign(inv, snapshot);
        recomputeInvoice(inv);
        assert(false, 'Chegirmadan keyin summa to‘langan summadan kam bo‘lib qoladi');
      }
      return toInvoiceView(inv);
    }),
};
