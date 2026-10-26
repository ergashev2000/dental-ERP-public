import dayjs from '@/shared/lib/dayjs';
import { mockDb } from '@/shared/lib/mock/mockDb';
import { ApiError, assert, currentUser, matches, mockRequest, paginate } from '@/shared/lib/mock/mockRequest';
import { uid } from '@/shared/lib/mock/helpers';
import {
  chairName,
  findAppointment,
  findPatient,
  findService,
  serviceName,
  staffName,
} from '@/shared/lib/mock/ops/lookup';
import { freeSlots, validateSlot } from '@/shared/lib/mock/ops/appointmentOps';
import { scheduleReminders, skipPendingReminders } from '@/shared/lib/mock/ops/reminderOps';
import { consumeFefo, usableStock } from '@/shared/lib/mock/ops/inventoryOps';
import { logOrthoVisitFromAppointment } from '@/shared/lib/mock/ops/orthoOps';
import { applyTreatmentToTooth, getToothRecord, nextInvoiceNumber, recomputeInvoice } from '@/shared/lib/mock/ops/clinicalOps';
import { hasPermission } from '@/shared/constants/roles';
import { formatMoney, formatNumber, fullName } from '@/shared/utils/format';
import type { UserRecord } from '@/modules/auth/types';
import type { Invoice, Payment } from '@/modules/billing/types';
import type {
  Appointment,
  AppointmentFilters,
  AppointmentInput,
  AppointmentStatus,
  AppointmentView,
  CompleteInput,
  CompleteResult,
  MoveInput,
  SlotQuery,
} from '../types';

const reminderSummary = (appointmentId: string): AppointmentView['reminder'] => {
  const jobs = mockDb.reminderJobs.filter((j) => j.appointmentId === appointmentId);
  if (!jobs.length) return undefined;
  const done = jobs.filter((j) => j.status !== 'PENDING').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const j = done ?? jobs.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0]!;
  return { status: j.status, attempt: j.attempt, maxAttempts: j.maxAttempts };
};

const toView = (a: Appointment, user: UserRecord): AppointmentView => {
  const masked = user.role === 'DOCTOR' && a.doctorId !== user.staffId;
  const p = mockDb.patients.find((x) => x.id === a.patientId);
  if (masked) {
    return {
      ...a,
      patientId: '',
      note: undefined,
      cancelReason: undefined,
      doctorNote: undefined,
      patientName: 'Band',
      patientPhone: '',
      doctorName: staffName(a.doctorId),
      chairName: chairName(a.chairId),
      serviceNames: [],
      masked: true,
    };
  }
  return {
    ...a,
    patientName: p ? `${p.lastName} ${p.firstName}` : '—',
    patientPhone: p?.phone ?? '',
    doctorName: staffName(a.doctorId),
    chairName: chairName(a.chairId),
    serviceNames: a.serviceIds.map(serviceName),
    reminder: reminderSummary(a.id),
    noShowRisk: noShowRisk(a),
  };
};

/** Kelmay qolish xavfi: bemorning oldingi "Kelmadi" qabullari soni (faqat kelajakdagi faol qabullar uchun) */
const noShowRisk = (a: Appointment): AppointmentView['noShowRisk'] => {
  if (!['SCHEDULED', 'CONFIRMED'].includes(a.status)) return undefined;
  const missed = mockDb.appointments.filter((x) => x.patientId === a.patientId && x.status === 'NO_SHOW').length;
  return missed >= 2 ? 'HIGH' : missed === 1 ? 'MEDIUM' : undefined;
};

/** Shifokor faqat o'z qabullarini boshqaradi */
const assertCanManage = (a: Pick<Appointment, 'doctorId'>, user: UserRecord) => {
  if (!hasPermission(user.role, 'appointment.manageAll') && a.doctorId !== user.staffId) {
    throw new ApiError(403, 'Faqat o‘z qabullaringizni boshqara olasiz');
  }
};

const TRANSITIONS: Partial<Record<AppointmentStatus, AppointmentStatus[]>> = {
  SCHEDULED: ['CONFIRMED', 'ARRIVED', 'NO_SHOW'],
  CONFIRMED: ['ARRIVED', 'NO_SHOW', 'SCHEDULED'],
  ARRIVED: ['IN_PROGRESS'],
};

export interface CompletionDraft {
  appointment: AppointmentView;
  planItems: { id: string; serviceId: string; serviceName: string; tooth?: number; price: number; discount: number; stage: number; status: string }[];
  products: { id: string; name: string; unit: string; usable: number }[];
}

export const appointmentsApi = {
  // GET /api/appointments?from=&to=&doctor=&status=&q=&page=
  list: (f: AppointmentFilters) =>
    mockRequest(() => {
      const user = currentUser();
      const own = !hasPermission(user.role, 'appointment.viewAll');
      const rows = mockDb.appointments
        .filter((a) => !own || a.doctorId === user.staffId)
        .filter((a) => !f.patientId || a.patientId === f.patientId)
        .filter((a) => !f.from || dayjs(a.start).isSameOrAfter(dayjs(f.from).startOf('day')))
        .filter((a) => !f.to || dayjs(a.start).isSameOrBefore(dayjs(f.to).endOf('day')))
        .filter((a) => !f.doctor || a.doctorId === f.doctor)
        .filter((a) => (f.status ? a.status === f.status : f.includeCancelled !== false || a.status !== 'CANCELLED'))
        .filter((a) => {
          const p = mockDb.patients.find((x) => x.id === a.patientId);
          return matches(f.q, fullName(p), p?.phone, p?.cardNo);
        })
        .sort((a, b) => (f.patientId ? b.start.localeCompare(a.start) : a.start.localeCompare(b.start)))
        .map((a) => toView(a, user));
      return paginate(rows, f.page ?? 1, f.pageSize ?? 10);
    }),

  // GET /api/appointments/calendar?from=&to=&doctor=
  range: (from: string, to: string, opts: { doctor?: string | null; includeCancelled?: boolean } = {}) =>
    mockRequest(() => {
      const user = currentUser();
      return mockDb.appointments
        .filter(
          (a) =>
            dayjs(a.start).isSameOrAfter(dayjs(from).startOf('day')) &&
            dayjs(a.start).isSameOrBefore(dayjs(to).endOf('day')) &&
            (!opts.doctor || a.doctorId === opts.doctor) &&
            (opts.includeCancelled || a.status !== 'CANCELLED'),
        )
        .sort((a, b) => a.start.localeCompare(b.start))
        .map((a) => toView(a, user));
    }, 250),

  // GET /api/appointments/:id
  get: (id: string) =>
    mockRequest(() => {
      const user = currentUser();
      const v = toView(findAppointment(id), user);
      if (v.masked) throw new ApiError(403, 'Bu qabul boshqa shifokorga tegishli');
      return v;
    }, 200),

  // GET /api/appointments/slots?doctor=&date=&duration=
  slots: (q: SlotQuery) =>
    mockRequest(() => freeSlots(q.doctorId, q.date, q.durationMin, q.excludeId, q.allowPast), 150),

  // POST /api/appointments/check — kreslo/shifokor konflikti (UI oldindan ko'rsatadi)
  check: (c: { doctorId: string; chairId?: string; start: string; durationMin: number; excludeId?: string; allowPast?: boolean }) =>
    mockRequest(() => ({ error: validateSlot(c) }), 120),

  // POST /api/appointments
  create: (input: AppointmentInput) =>
    mockRequest(() => {
      const user = currentUser();
      assertCanManage(input, user);
      findPatient(input.patientId);
      const allowPast = !!input.allowPast && hasPermission(user.role, 'appointment.backdate');
      assert(input.serviceIds.length > 0, 'Kamida bitta xizmat tanlang');
      const err = validateSlot({ ...input, allowPast });
      if (err) throw new ApiError(422, err);
      const patient = findPatient(input.patientId);
      const a: Appointment = {
        id: uid('a'),
        patientId: input.patientId,
        doctorId: input.doctorId,
        chairId: input.chairId,
        start: input.start,
        durationMin: input.durationMin,
        serviceIds: input.serviceIds,
        status: input.arrived ? 'ARRIVED' : 'SCHEDULED',
        note: input.note,
        source: input.source,
        reminderEnabled: !input.arrived && input.reminderEnabled && patient.callConsent,
        plannedItems: input.plannedItems?.length ? input.plannedItems : undefined,
        createdById: user.staffId,
        createdAt: new Date().toISOString(),
      };
      mockDb.appointments.push(a);
      const reminders = input.arrived ? 0 : scheduleReminders(a);
      return { appointment: toView(a, user), reminders };
    }),

  // PUT /api/appointments/:id/move
  move: (input: MoveInput) =>
    mockRequest(() => {
      const user = currentUser();
      const a = findAppointment(input.id);
      assertCanManage(a, user);
      assertCanManage(input, user);
      assert(['SCHEDULED', 'CONFIRMED'].includes(a.status), 'Faqat «Yozilgan» yoki «Tasdiqlangan» qabulni ko‘chirish mumkin');
      const err = validateSlot({ ...input, excludeId: a.id });
      if (err) throw new ApiError(422, err);
      Object.assign(a, { doctorId: input.doctorId, chairId: input.chairId, start: input.start, durationMin: input.durationMin });
      skipPendingReminders(a.id);
      let reminders = 0;
      if (input.rescheduleReminders) {
        a.status = 'SCHEDULED';
        reminders = scheduleReminders(a);
      }
      return { appointment: toView(a, user), reminders };
    }),

  // PATCH /api/appointments/:id/status
  setStatus: (id: string, status: AppointmentStatus) =>
    mockRequest(() => {
      const user = currentUser();
      const a = findAppointment(id);
      assertCanManage(a, user);
      assert(TRANSITIONS[a.status]?.includes(status), 'Bu status o‘zgarishi mumkin emas');
      // 4-qoida: NO_SHOW faqat qabul vaqti o'tgandan keyin
      if (status === 'NO_SHOW') assert(dayjs(a.start).isBefore(dayjs()), '“Kelmadi” faqat qabul vaqti o‘tgandan keyin qo‘yiladi');
      a.status = status;
      if (['ARRIVED', 'NO_SHOW'].includes(status)) skipPendingReminders(a.id);
      return toView(a, user);
    }),

  // POST /api/appointments/:id/cancel
  cancel: (id: string, reason: string) =>
    mockRequest(() => {
      const user = currentUser();
      const a = findAppointment(id);
      assertCanManage(a, user);
      assert(reason?.trim(), 'Bekor qilish sababini kiriting');
      assert(['SCHEDULED', 'CONFIRMED', 'ARRIVED'].includes(a.status), 'Bu qabulni bekor qilib bo‘lmaydi');
      a.status = 'CANCELLED';
      a.cancelReason = reason.trim();
      skipPendingReminders(a.id);
      return toView(a, user);
    }),

  // GET /api/appointments/:id/completion-draft
  completionDraft: (id: string) =>
    mockRequest((): CompletionDraft => {
      const user = currentUser();
      const a = findAppointment(id);
      assertCanManage(a, user);
      const planItems = mockDb.treatmentPlans
        .filter((t) => t.patientId === a.patientId && ['PLANNED', 'IN_PROGRESS'].includes(t.status))
        .sort((x, y) => x.stage - y.stage)
        .map((t) => ({
          id: t.id,
          serviceId: t.serviceId,
          serviceName: serviceName(t.serviceId),
          tooth: t.tooth,
          price: t.price,
          discount: t.discount,
          stage: t.stage,
          status: t.status,
        }));
      return {
        appointment: toView(a, user),
        planItems,
        products: mockDb.products.map((p) => ({ id: p.id, name: p.name, unit: p.unit, usable: usableStock(p.id) })),
      };
    }),

  // POST /api/appointments/:id/complete
  complete: (input: CompleteInput) =>
    mockRequest((): CompleteResult => {
      const user = currentUser();
      assert(hasPermission(user.role, 'appointment.complete'), 'Qabulni yakunlash uchun ruxsat yo‘q', 403);
      const a = findAppointment(input.appointmentId);
      assertCanManage(a, user);
      // 5-qoida: yakunlangan qabul qayta ochilmaydi
      assert(a.status !== 'COMPLETED', 'Qabul allaqachon yakunlangan');
      assert(['ARRIVED', 'IN_PROGRESS', 'CONFIRMED', 'SCHEDULED'].includes(a.status), 'Bu qabulni yakunlab bo‘lmaydi');
      assert(input.items.length > 0, 'Kamida bitta bajarilgan muolaja kiriting');

      for (const it of input.items) {
        const s = findService(it.serviceId);
        if (s.perTooth) assert(it.tooth, `"${s.name}" uchun tish raqamini tanlang`);
        if (it.tooth) {
          const rec = getToothRecord(a.patientId, it.tooth);
          // 10-qoida: yo'q tishga faqat implant yoki ortopediya
          if (rec?.conditions.includes('MISSING')) {
            assert(
              s.code === 'S203' || s.category === 'Ortopediya',
              `${it.tooth}-tish yo‘q: unga faqat implant yoki ortopediya xizmati qo‘shiladi`,
            );
          }
        }
      }

      // 7-qoida: qoldiqdan ko'p chiqim yo'q — avval hammasini tekshiramiz
      const shortages = input.materials
        .filter((m) => m.qty > 0)
        .map((m) => {
          const p = mockDb.products.find((x) => x.id === m.productId);
          const usable = usableStock(m.productId);
          return m.qty > usable + 1e-9 ? `${p?.name}: kerak ${formatNumber(m.qty, 2)}, mavjud ${formatNumber(usable, 2)} ${p?.unit}` : null;
        })
        .filter(Boolean);
      if (shortages.length) throw new ApiError(422, `Omborda yetarli emas — ${shortages.join('; ')}`);

      // Keyingi tashrif slotini oldindan tekshiramiz (hech narsa o'zgarmasidan oldin)
      const pay = input.payment && input.payment.amount > 0 ? input.payment : undefined;
      if (pay) {
        assert(hasPermission(user.role, 'payment.receive'), 'To‘lov qabul qilish uchun ruxsat yo‘q', 403);
        assert(mockDb.clinic.paymentMethods[pay.method], 'Bu to‘lov turi o‘chirilgan');
      }

      if (input.followUp) {
        assert(input.followUp.serviceIds.length > 0, 'Keyingi tashrif uchun xizmat tanlang');
        const err = validateSlot({ doctorId: a.doctorId, chairId: a.chairId, start: input.followUp.start, durationMin: input.followUp.durationMin });
        if (err) throw new ApiError(422, `Keyingi tashrif: ${err}`);
      }

      const now = new Date().toISOString();
      const inv: Invoice = {
        id: uid('inv'),
        number: nextInvoiceNumber(),
        patientId: a.patientId,
        appointmentId: a.id,
        lines: input.items.map((it) => ({
          serviceId: it.serviceId,
          tooth: it.tooth,
          qty: 1,
          price: it.price,
          discount: Math.round((it.price * it.discount) / 100),
        })),
        discount: 0,
        total: 0,
        paid: 0,
        status: 'UNPAID',
        createdAt: now,
      };
      recomputeInvoice(inv);
      if (pay) assert(pay.amount <= inv.total, `To‘lov summasi jami summadan oshmasin (${formatMoney(inv.total)})`);
      mockDb.invoices.push(inv);

      const warnings: string[] = [];
      for (const m of input.materials.filter((x) => x.qty > 0)) {
        warnings.push(
          ...consumeFefo(m.productId, m.qty, {
            type: 'USAGE',
            byId: user.staffId,
            refType: 'APPOINTMENT',
            refId: a.id,
            reason: 'Qabulda ishlatildi',
          }),
        );
      }

      for (const it of input.items) {
        const s = findService(it.serviceId);
        const plan = it.planItemId ? mockDb.treatmentPlans.find((t) => t.id === it.planItemId) : undefined;
        if (plan) {
          plan.status = 'DONE';
          plan.appointmentId = a.id;
        } else {
          const stage = Math.max(1, ...mockDb.treatmentPlans.filter((t) => t.patientId === a.patientId).map((t) => t.stage));
          mockDb.treatmentPlans.push({
            id: uid('tp'),
            patientId: a.patientId,
            stage,
            tooth: it.tooth,
            serviceId: it.serviceId,
            price: it.price,
            discount: it.discount,
            doctorId: a.doctorId,
            status: 'DONE',
            appointmentId: a.id,
            createdAt: now,
          });
        }
        if (it.tooth) applyTreatmentToTooth(a.patientId, it.tooth, s.code, s.name, a.doctorId, a.id, it.surfaces);
      }

      a.status = 'COMPLETED';
      a.doctorNote = input.doctorNote;
      skipPendingReminders(a.id);
      // Breketli bemor — korreksiya tarixiga ham yoziladi
      logOrthoVisitFromAppointment(a, input.items.map((it) => serviceName(it.serviceId)), input.doctorNote);

      let followUp: Appointment | undefined;
      if (input.followUp) {
        followUp = {
          id: uid('a'),
          patientId: a.patientId,
          doctorId: a.doctorId,
          chairId: a.chairId,
          start: input.followUp.start,
          durationMin: input.followUp.durationMin,
          serviceIds: input.followUp.serviceIds,
          status: 'SCHEDULED',
          note: input.followUp.note || 'Qayta tashrif',
          source: a.source,
          reminderEnabled: true,
          createdById: user.staffId,
          createdAt: now,
        };
        mockDb.appointments.push(followUp);
        scheduleReminders(followUp);
      }

      let payment: Payment | undefined;
      if (pay) {
        payment = {
          id: uid('pay'),
          invoiceId: inv.id,
          patientId: inv.patientId,
          amount: pay.amount,
          method: pay.method,
          note: pay.note,
          receivedById: user.staffId,
          createdAt: new Date().toISOString(),
        };
        mockDb.payments.push(payment);
        inv.paid += pay.amount;
        recomputeInvoice(inv);
      }
      return {
        invoiceId: inv.id,
        invoiceTotal: inv.total,
        followUpId: followUp?.id,
        followUpStart: followUp?.start,
        paymentId: payment?.id,
        paid: inv.paid,
        debt: Math.max(0, inv.total - inv.paid),
        warnings,
      };
    }, 600),
};
