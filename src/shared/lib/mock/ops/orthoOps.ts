import dayjs from '@/shared/lib/dayjs';
import type { Appointment } from '@/modules/appointments/types';
import { ORTHO_STAGES, type OrthoCase, type OrthoCaseView } from '@/modules/orthodontics/types';
import { mockDb } from '../mockDb';
import { uid } from '../helpers';
import { invoiceRemaining, lastVisit, nextAppointment, staffName } from './lookup';

/** Oylik to'lov jadvali: boshlang'ich to'lov + har oy `monthlyPayment` (summa tugaguncha) */
export const orthoSchedule = (c: OrthoCase, paid: number) => {
  const out: { date: string; amount: number; paid: boolean }[] = [];
  const start = dayjs(c.startDate);
  let rest = c.totalPrice;
  if (c.initialPayment > 0) {
    out.push({ date: c.startDate, amount: Math.min(c.initialPayment, rest), paid: false });
    rest -= Math.min(c.initialPayment, rest);
  }
  const monthly = c.monthlyPayment > 0 ? c.monthlyPayment : rest;
  for (let k = 1; rest > 0 && k <= 120; k++) {
    const amount = Math.min(monthly, rest);
    out.push({ date: start.add(k, 'month').format('YYYY-MM-DD'), amount, paid: false });
    rest -= amount;
  }
  let acc = 0;
  for (const it of out) {
    acc += it.amount;
    it.paid = acc <= paid;
  }
  return out;
};

export const orthoCaseView = (c: OrthoCase): OrthoCaseView => {
  const p = mockDb.patients.find((x) => x.id === c.patientId);
  const visits = mockDb.orthoVisits.filter((v) => v.caseId === c.id);
  const today = dayjs().startOf('day');
  // Oxirgi tashrif: korreksiya yozuvi yoki davolash boshlangandan keyingi yakunlangan qabul
  const candidates = [c.startDate, ...visits.map((v) => v.date), lastVisit(c.patientId)].filter(
    (x): x is string => !!x && !dayjs(x).isBefore(dayjs(c.startDate), 'day'),
  );
  const last = candidates.sort((a, b) => dayjs(a).valueOf() - dayjs(b).valueOf()).at(-1)!;
  const next = nextAppointment(c.patientId);
  const due = dayjs(last).startOf('day').add(c.visitIntervalDays, 'day');
  const overdueDays = c.status === 'ACTIVE' && !next ? Math.max(0, today.diff(due, 'day')) : 0;

  const inv = c.invoiceId ? mockDb.invoices.find((i) => i.id === c.invoiceId) : undefined;
  const paid = inv?.paid ?? 0;
  const remaining = inv ? invoiceRemaining(inv) : 0;
  const nextPay = remaining > 0 ? orthoSchedule(c, paid).find((x) => !x.paid) : undefined;

  const idx = ORTHO_STAGES.indexOf(c.stage);
  return {
    ...c,
    patientName: p ? `${p.lastName} ${p.firstName}` : '—',
    patientPhone: p?.phone ?? '',
    doctorName: staffName(c.doctorId),
    lastVisit: last,
    nextAppointment: next,
    dueDate: due.format('YYYY-MM-DD'),
    daysSinceVisit: Math.max(0, today.diff(dayjs(last).startOf('day'), 'day')),
    overdueDays,
    paid,
    remaining,
    nextPaymentDate: nextPay?.date,
    paymentOverdue: !!nextPay && dayjs(nextPay.date).isBefore(today),
    progress: c.status === 'FINISHED' ? 100 : Math.round(((idx + 1) / ORTHO_STAGES.length) * 100),
    visitsCount: visits.length,
  };
};

/** Bemorning faol (yoki oxirgi) breket davolashi */
export const activeOrthoCase = (patientId: string) => {
  const list = mockDb.orthoCases.filter((c) => c.patientId === patientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return list.find((c) => c.status !== 'FINISHED') ?? list[0];
};

/** Breketli bemorning qabuli yakunlanganda — korreksiya tarixiga avtomatik yoziladi */
export const logOrthoVisitFromAppointment = (a: Appointment, work: string[], note?: string) => {
  const c = activeOrthoCase(a.patientId);
  if (!c || c.status !== 'ACTIVE') return;
  mockDb.orthoVisits.push({
    id: uid('ov'),
    caseId: c.id,
    date: dayjs(a.start).format('YYYY-MM-DD'),
    stage: c.stage,
    work,
    note,
    doctorId: a.doctorId,
    appointmentId: a.id,
    createdAt: new Date().toISOString(),
  });
};
