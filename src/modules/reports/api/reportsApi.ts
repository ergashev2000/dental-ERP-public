import dayjs from '@/shared/lib/dayjs';
import { mockDb } from '@/shared/lib/mock/mockDb';
import { ApiError, currentUser, mockRequest } from '@/shared/lib/mock/mockRequest';
import { hasPermission } from '@/shared/constants/roles';
import { PAYMENT_METHOD } from '@/shared/constants/status';
import { sourceLabel } from '@/shared/constants/options';
import type {
  AppointmentsReport,
  DoctorsReportRow,
  InventoryReport,
  RemindersReport,
  ReportQuery,
  RevenueReport,
  ServicesReportRow,
} from '../types';

const inRange = (iso: string, q: ReportQuery) =>
  dayjs(iso).isSameOrAfter(dayjs(q.from).startOf('day')) && dayjs(iso).isSameOrBefore(dayjs(q.to).endOf('day'));

/** Shifokor faqat o'z hisobotini (daromadsiz) ko'radi; registratura — ruxsat yo'q */
const scope = (q: ReportQuery) => {
  const user = currentUser();
  if (!hasPermission(user.role, 'report.view')) throw new ApiError(403, 'Hisobotlar uchun ruxsat yo‘q');
  const revenue = hasPermission(user.role, 'report.revenue');
  const doctor = user.role === 'DOCTOR' ? user.staffId : q.doctor || null;
  return { revenue, doctor };
};

const appts = (q: ReportQuery, doctor: string | null) =>
  mockDb.appointments.filter((a) => inRange(a.start, q) && (!doctor || a.doctorId === doctor) && dayjs(a.start).isBefore(dayjs()));

export const reportsApi = {
  // GET /api/reports/revenue?from=&to=&doctor=
  revenue: (q: ReportQuery) =>
    mockRequest((): RevenueReport => {
      const { revenue, doctor } = scope(q);
      if (!revenue) throw new ApiError(403, 'Tushum hisobotini faqat administrator ko‘radi');
      const payments = mockDb.payments.filter((p) => {
        if (!inRange(p.createdAt, q)) return false;
        if (!doctor) return true;
        const inv = mockDb.invoices.find((i) => i.id === p.invoiceId);
        return mockDb.appointments.find((a) => a.id === inv?.appointmentId)?.doctorId === doctor;
      });
      const active = payments.filter((p) => !p.refunded);
      const days = dayjs(q.to).diff(dayjs(q.from), 'day') + 1;
      return {
        total: active.reduce((s, p) => s + p.amount, 0),
        refunds: payments.filter((p) => p.refunded).reduce((s, p) => s + p.amount, 0),
        byDay: Array.from({ length: Math.min(days, 92) }, (_, i) => {
          const d = dayjs(q.from).add(i, 'day');
          return { date: d.format('YYYY-MM-DD'), amount: active.filter((p) => dayjs(p.createdAt).isSame(d, 'day')).reduce((s, p) => s + p.amount, 0) };
        }),
        byMethod: Object.entries(PAYMENT_METHOD)
          .map(([method, label]) => {
            const items = active.filter((p) => p.method === method);
            return { method: label, amount: items.reduce((s, p) => s + p.amount, 0), count: items.length };
          })
          .filter((x) => x.count > 0),
      };
    }),

  // GET /api/reports/doctors
  doctors: (q: ReportQuery) =>
    mockRequest((): DoctorsReportRow[] => {
      const { revenue, doctor } = scope(q);
      const list = appts(q, doctor);
      return mockDb.staff
        .filter((s) => s.position === 'DOCTOR' && (!doctor || s.id === doctor))
        .map((s) => {
          const mine = list.filter((a) => a.doctorId === s.id);
          const done = mine.filter((a) => a.status === 'COMPLETED');
          const amount = mockDb.invoices
            .filter((i) => i.status !== 'CANCELLED' && done.some((a) => a.id === i.appointmentId))
            .reduce((sum, i) => sum + i.total, 0);
          return {
            doctorId: s.id,
            name: s.fullName,
            total: mine.length,
            completed: done.length,
            noShow: mine.filter((a) => a.status === 'NO_SHOW').length,
            cancelled: mine.filter((a) => a.status === 'CANCELLED').length,
            amount: revenue ? amount : null,
          };
        });
    }),

  // GET /api/reports/services
  services: (q: ReportQuery) =>
    mockRequest((): ServicesReportRow[] => {
      const { revenue, doctor } = scope(q);
      const done = new Set(appts(q, doctor).filter((a) => a.status === 'COMPLETED').map((a) => a.id));
      const map = new Map<string, ServicesReportRow>();
      for (const inv of mockDb.invoices.filter((i) => done.has(i.appointmentId) && i.status !== 'CANCELLED')) {
        for (const l of inv.lines) {
          const s = mockDb.services.find((x) => x.id === l.serviceId);
          if (!s) continue;
          const row = map.get(s.id) ?? { serviceId: s.id, code: s.code, name: s.name, count: 0, amount: revenue ? 0 : null };
          row.count += l.qty;
          if (row.amount !== null) row.amount += l.price * l.qty - l.discount;
          map.set(s.id, row);
        }
      }
      return [...map.values()].sort((a, b) => b.count - a.count);
    }),

  // GET /api/reports/appointments
  appointments: (q: ReportQuery) =>
    mockRequest((): AppointmentsReport => {
      const { doctor } = scope(q);
      const list = appts(q, doctor);
      const noShow = list.filter((a) => a.status === 'NO_SHOW').length;
      const sources = new Map<string, number>();
      for (const a of list) sources.set(sourceLabel(a.source), (sources.get(sourceLabel(a.source)) ?? 0) + 1);
      return {
        total: list.length,
        completed: list.filter((a) => a.status === 'COMPLETED').length,
        cancelled: list.filter((a) => a.status === 'CANCELLED').length,
        noShow,
        noShowPct: list.length ? (noShow / list.length) * 100 : 0,
        bySource: [...sources.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
      };
    }),

  // GET /api/reports/reminders
  reminders: (q: ReportQuery) =>
    mockRequest((): RemindersReport => {
      const { doctor } = scope(q);
      const logs = mockDb.callLogs.filter((l) => inRange(l.startedAt, q));
      const byResult = new Map<string, number>();
      for (const l of logs) byResult.set(l.result, (byResult.get(l.result) ?? 0) + 1);
      const list = appts(q, doctor).filter((a) => ['COMPLETED', 'NO_SHOW'].includes(a.status));
      const withRem = list.filter((a) => mockDb.reminderJobs.some((j) => j.appointmentId === a.id && j.status !== 'SKIPPED'));
      const without = list.filter((a) => !withRem.includes(a));
      const rate = (arr: typeof list) => (arr.length ? (arr.filter((a) => a.status === 'NO_SHOW').length / arr.length) * 100 : 0);
      const confirmed = logs.filter((l) => l.result === 'CONFIRMED').length;
      const jobs = new Set(logs.map((l) => l.jobId)).size;
      return {
        calls: logs.length,
        confirmed,
        confirmRate: jobs ? (confirmed / jobs) * 100 : 0,
        byResult: [...byResult.entries()].map(([result, count]) => ({ result, count })).sort((a, b) => b.count - a.count),
        noShowRateWith: rate(withRem),
        noShowRateWithout: rate(without),
        withCount: withRem.length,
        withoutCount: without.length,
      };
    }),

  // GET /api/reports/inventory
  inventory: (q: ReportQuery) =>
    mockRequest((): InventoryReport => {
      scope(q);
      const moves = mockDb.movements.filter((m) => inRange(m.createdAt, q));
      const cost = (m: (typeof moves)[number]) => {
        const b = mockDb.batches.find((x) => x.id === m.batchId);
        return Math.abs(m.qty) * (b?.unitCost ?? 0);
      };
      const used = new Map<string, { qty: number; cost: number }>();
      for (const m of moves.filter((x) => x.type === 'USAGE' || x.type === 'MANUAL')) {
        const cur = used.get(m.productId) ?? { qty: 0, cost: 0 };
        cur.qty += Math.abs(m.qty);
        cur.cost += cost(m);
        used.set(m.productId, cur);
      }
      return {
        inSum: Math.round(moves.filter((m) => m.type === 'IN').reduce((s, m) => s + cost(m), 0)),
        outSum: Math.round(moves.filter((m) => m.qty < 0).reduce((s, m) => s + cost(m), 0)),
        topUsed: [...used.entries()]
          .map(([productId, v]) => {
            const p = mockDb.products.find((x) => x.id === productId);
            return { productId, name: p?.name ?? '—', unit: p?.unit ?? '', qty: +v.qty.toFixed(2), cost: Math.round(v.cost) };
          })
          .sort((a, b) => b.cost - a.cost)
          .slice(0, 10),
      };
    }),
};
