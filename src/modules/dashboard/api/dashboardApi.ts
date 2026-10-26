import dayjs from '@/shared/lib/dayjs';
import { mockDb } from '@/shared/lib/mock/mockDb';
import { currentUser, mockRequest } from '@/shared/lib/mock/mockRequest';
import { invoiceRemaining } from '@/shared/lib/mock/ops/lookup';
import { productRow } from '@/shared/lib/mock/ops/inventoryOps';
import { todayReminderStats } from '@/shared/lib/mock/ops/reminderOps';
import { orthoCaseView } from '@/shared/lib/mock/ops/orthoOps';
import { hasPermission } from '@/shared/constants/roles';
import { getWorkDay, toMin } from '@/shared/utils/schedule';
import { formatMoney } from '@/shared/utils/format';
import type { Appointment } from '@/modules/appointments';
import type { AppNotification, DashboardDay, DashboardSummary, DayVisit } from '../types';

/** Foizdagi o'zgarish; juda kichik bazada (masalan, 1 → 11 = +1000%) chalg'itadi — ko'rsatilmaydi */
const pct = (cur: number, prev: number) => (Math.abs(prev) >= 3 ? Math.round(((cur - prev) / prev) * 100) : null);

const endOf = (a: Appointment) => dayjs(a.start).add(a.durationMin, 'minute');

/** Davrdagi kelmay qolish ulushi (%); o'tgan qabul bo'lmasa — null */
const noShowRate = (list: Appointment[], from: dayjs.Dayjs, to: dayjs.Dayjs) => {
  const past = list.filter(
    (a) => a.status !== 'CANCELLED' && dayjs(a.start).isSameOrAfter(from) && dayjs(a.start).isBefore(to) && endOf(a).isBefore(dayjs()),
  );
  return past.length ? Math.round((past.filter((a) => a.status === 'NO_SHOW').length / past.length) * 100) : null;
};

const dayVisit = (a: Appointment): DayVisit => {
  const p = mockDb.patients.find((x) => x.id === a.patientId);
  return {
    id: a.id,
    start: a.start,
    durationMin: a.durationMin,
    status: a.status,
    patientId: a.patientId,
    patientName: p ? `${p.lastName} ${p.firstName}` : '—',
    doctorName: mockDb.staff.find((s) => s.id === a.doctorId)?.fullName ?? '—',
    chairName: mockDb.chairs.find((c) => c.id === a.chairId)?.name ?? '—',
    serviceNames: a.serviceIds.map((id) => mockDb.services.find((s) => s.id === id)?.name ?? id),
  };
};

const paidOn = (date: dayjs.Dayjs) =>
  mockDb.payments.filter((p) => !p.refunded && dayjs(p.createdAt).isSame(date, 'day')).reduce((s, p) => s + p.amount, 0);

/** Berilgan vaqtdagi umumiy debitorlik (tarixiy holat) */
const receivablesAt = (at: dayjs.Dayjs) =>
  mockDb.invoices
    .filter((i) => i.status !== 'CANCELLED' && dayjs(i.createdAt).isBefore(at))
    .reduce((sum, i) => {
      const paid = mockDb.payments
        .filter((p) => p.invoiceId === i.id && dayjs(p.createdAt).isBefore(at) && !(p.refunded && dayjs(p.refunded.at).isBefore(at)))
        .reduce((s, p) => s + p.amount, 0);
      return sum + Math.max(0, i.total - paid);
    }, 0);

export const dashboardApi = {
  // GET /api/dashboard/summary
  summary: () =>
    mockRequest((): DashboardSummary => {
      const user = currentUser();
      const own = user.role === 'DOCTOR';
      const today = dayjs();
      const mine = mockDb.appointments.filter((a) => !own || a.doctorId === user.staffId);
      const onDay = (d: dayjs.Dayjs) => mine.filter((a) => dayjs(a.start).isSame(d, 'day') && a.status !== 'CANCELLED');

      const todayList = onDay(today);
      const lastWeek = onDay(today.subtract(7, 'day'));

      const monthStart = today.startOf('month');
      const prevStart = monthStart.subtract(1, 'month');
      const prevSame = prevStart.add(today.diff(monthStart, 'day'), 'day').endOf('day');
      const newThis = mockDb.patients.filter((p) => dayjs(p.createdAt).isSameOrAfter(monthStart)).length;
      const newPrev = mockDb.patients.filter((p) => dayjs(p.createdAt).isSameOrAfter(prevStart) && dayjs(p.createdAt).isSameOrBefore(prevSame)).length;

      const receivables = mockDb.invoices.reduce((s, i) => s + invoiceRemaining(i), 0);
      const receivablesPrev = receivablesAt(today.subtract(7, 'day'));

      const canRevenue = hasPermission(user.role, 'dashboard.revenue');
      const revToday = paidOn(today);
      const revPrev = paidOn(today.subtract(7, 'day'));

      const doctors = mockDb.staff.filter((s) => s.position === 'DOCTOR' && s.isActive && (!own || s.id === user.staffId));
      const doctorLoad = doctors
        .map((s) => {
          const wd = getWorkDay(s, today.format('YYYY-MM-DD'));
          const list = todayList.filter((a) => a.doctorId === s.id);
          const workMin = wd
            ? toMin(wd.end) - toMin(wd.start) - (wd.breakStart && wd.breakEnd ? toMin(wd.breakEnd) - toMin(wd.breakStart) : 0)
            : 0;
          const busy = list.reduce((m, a) => m + a.durationMin, 0);
          return {
            doctorId: s.id,
            name: s.fullName,
            specialty: s.specialty,
            color: s.color,
            count: list.length,
            loadPct: workMin ? Math.min(100, Math.round((busy / workMin) * 100)) : 0,
            working: !!wd,
          };
        })
        .filter((d) => d.working || d.count > 0)
        .map(({ working: _w, ...rest }) => rest);

      return {
        today: {
          total: todayList.length,
          arrived: todayList.filter((a) => ['ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(a.status)).length,
          change: pct(todayList.length, lastWeek.length),
        },
        revenue: canRevenue ? { value: revToday, change: pct(revToday, revPrev) } : null,
        newPatients: { value: newThis, change: pct(newThis, newPrev) },
        receivables: { value: receivables, change: pct(receivables, receivablesPrev) },
        doctorLoad,
        reminders: todayReminderStats(),
        weeklyRevenue: canRevenue
          ? Array.from({ length: 7 }, (_, i) => {
              const d = today.subtract(6 - i, 'day');
              return { date: d.format('YYYY-MM-DD'), amount: paidOn(d) };
            })
          : null,
        unconfirmedToday: todayList.filter((a) => a.status === 'SCHEDULED').length,
        noShow: (() => {
          const cur = noShowRate(mine, today.subtract(30, 'day'), today.startOf('day'));
          const prev = noShowRate(mine, today.subtract(60, 'day'), today.subtract(30, 'day'));
          return { value: cur ?? 0, change: cur !== null && prev !== null ? cur - prev : null };
        })(),
      };
    }),

  // GET /api/dashboard/day — bugungi ish kuni uchun hosila ma'lumotlar
  day: () =>
    mockRequest((): DashboardDay => {
      const user = currentUser();
      const own = user.role === 'DOCTOR';
      const now = dayjs();
      const visible = (a: Appointment) => !own || a.doctorId === user.staffId;
      const todayAll = mockDb.appointments
        .filter((a) => dayjs(a.start).isSame(now, 'day') && a.status !== 'CANCELLED')
        .sort((a, b) => a.start.localeCompare(b.start));

      const alerts: DashboardDay['alerts'] = {};
      for (const a of todayAll.filter(visible)) {
        const p = mockDb.patients.find((x) => x.id === a.patientId);
        if (p && (p.allergies.length || p.conditions.length || p.medications.length || p.pregnant))
          alerts[p.id] = { allergies: p.allergies, conditions: p.conditions, medications: p.medications, pregnant: p.pregnant };
      }

      const from = now.subtract(14, 'day').startOf('day');
      const unfinished = mockDb.appointments
        .filter(
          (a) =>
            visible(a) &&
            dayjs(a.start).isAfter(from) &&
            endOf(a).isBefore(now) &&
            ['SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS'].includes(a.status),
        )
        .sort((a, b) => b.start.localeCompare(a.start))
        .map((a) => ({ ...dayVisit(a), reason: ['ARRIVED', 'IN_PROGRESS'].includes(a.status) ? ('open' as const) : ('unmarked' as const) }));

      const chairs = mockDb.chairs
        .filter((c) => c.isActive)
        .map((c) => {
          const list = todayAll.filter((a) => a.chairId === c.id);
          const current = list.find((a) => a.status === 'IN_PROGRESS');
          const upcoming = list.filter((a) => ['SCHEDULED', 'CONFIRMED', 'ARRIVED'].includes(a.status) && endOf(a).isAfter(now));
          const show = (a?: Appointment) => (a ? { ...dayVisit(a), ...(visible(a) ? {} : { patientId: '', patientName: 'Band', serviceNames: [] }) } : undefined);
          return { id: c.id, name: c.name, current: show(current), next: show(upcoming[0]), left: upcoming.length };
        });

      return { alerts, unfinished, chairs };
    }, 200),

  // GET /api/notifications
  notifications: () =>
    mockRequest((): AppNotification[] => {
      const user = currentUser();
      const out: AppNotification[] = [];
      const low = mockDb.products.map((p) => productRow(p.id)).filter((r) => r.stock <= r.minStock || r.state === 'EXPIRED');
      for (const r of low) {
        out.push({
          id: `low-${r.id}`,
          kind: 'LOW_STOCK',
          title: r.stock <= 0 ? `${r.name} tugagan` : r.state === 'EXPIRED' ? `${r.name}: muddati o‘tgan partiya` : `${r.name} kam qoldi`,
          description: `Qoldiq: ${r.stock} ${r.unit} (min. ${r.minStock})`,
          at: new Date().toISOString(),
          link: `/inventory?product=${r.id}`,
        });
      }
      const own = user.role === 'DOCTOR';
      const unconfirmed = mockDb.appointments.filter(
        (a) =>
          a.status === 'SCHEDULED' &&
          (!own || a.doctorId === user.staffId) &&
          dayjs(a.start).isAfter(dayjs()) &&
          dayjs(a.start).isBefore(dayjs().add(1, 'day').endOf('day')),
      );
      if (unconfirmed.length) {
        out.unshift({
          id: 'unconfirmed',
          kind: 'UNCONFIRMED',
          title: `${unconfirmed.length} ta tasdiqlanmagan qabul`,
          description: 'Bugun va ertaga uchun',
          at: new Date().toISOString(),
          link: `/appointments?view=list&status=SCHEDULED`,
        });
      }
      // Bugun yakunlangan, lekin to'lanmagan qabullar — registratura uchun
      if (hasPermission(user.role, 'payment.receive')) {
        for (const inv of mockDb.invoices.filter((i) => invoiceRemaining(i) > 0 && dayjs(i.createdAt).isSame(dayjs(), 'day'))) {
          const p = mockDb.patients.find((x) => x.id === inv.patientId);
          out.unshift({
            id: `due-${inv.id}`,
            kind: 'PAYMENT_DUE',
            title: `To‘lov kutilmoqda: ${p ? `${p.lastName} ${p.firstName}` : ''}`,
            description: `${inv.number} · qoldiq ${formatMoney(invoiceRemaining(inv))}`,
            at: inv.createdAt,
            link: `/billing?invoice=${inv.id}`,
          });
        }
      }
      // Breketli bemorlar: muddatidan o'tib ketgan va qabulga yozilmaganlar
      if (hasPermission(user.role, 'ortho.view')) {
        const overdue = mockDb.orthoCases
          .filter((c) => c.status === 'ACTIVE' && (!own || c.doctorId === user.staffId))
          .map(orthoCaseView)
          .filter((v) => v.overdueDays > 0);
        if (overdue.length) {
          out.unshift({
            id: 'ortho-overdue',
            kind: 'ORTHO_OVERDUE',
            title: `${overdue.length} ta breketli bemor kelmayapti`,
            description: overdue
              .slice(0, 3)
              .map((v) => `${v.patientName} (${v.daysSinceVisit} kun)`)
              .join(', '),
            at: new Date().toISOString(),
            link: '/orthodontics?overdue=true',
          });
        }
      }
      if (!own) {
        for (const t of mockDb.tasks.filter((x) => !x.done)) {
          const { done: _d, ...rest } = t;
          out.unshift(rest);
        }
      }
      return out;
    }, 200),

  // POST /api/notifications/:id/done
  dismiss: (id: string) =>
    mockRequest(() => {
      currentUser();
      const t = mockDb.tasks.find((x) => x.id === id);
      if (t) t.done = true;
      return true;
    }, 100),
};
