import dayjs from '@/shared/lib/dayjs';
import { mockDb } from '@/shared/lib/mock/mockDb';
import { assert, currentUser, matches, mockRequest, paginate, requireRole } from '@/shared/lib/mock/mockRequest';
import { uid } from '@/shared/lib/mock/helpers';
import { findAppointment, findPatient, patientFullName, patientName, staffName } from '@/shared/lib/mock/ops/lookup';
import { applyCallResult, todayReminderStats } from '@/shared/lib/mock/ops/reminderOps';
import { simulateCall } from '@/shared/lib/mock/callSimulator';
import { isValidUzPhone } from '@/shared/utils/format';
import type {
  CallLog,
  CallLogFilters,
  CallLogView,
  JobView,
  QueueSummary,
  ReminderJob,
  ReminderRule,
  RulesPayload,
  TemplateLang,
} from '../types';

const toJobView = (j: ReminderJob): JobView => {
  const appt = j.appointmentId ? mockDb.appointments.find((a) => a.id === j.appointmentId) : undefined;
  const rule = mockDb.reminderRules.find((r) => r.id === j.ruleId);
  return {
    ...j,
    patientName: patientName(j.patientId),
    phone: mockDb.patients.find((p) => p.id === j.patientId)?.phone ?? '',
    appointmentStart: appt?.start,
    doctorName: appt ? staffName(appt.doctorId) : undefined,
    ruleName: j.type === 'RECALL' ? 'Profilaktika' : rule ? rule.name : 'Qo‘lda',
  };
};

const toLogView = (l: CallLog): CallLogView => ({ ...l, patientName: patientName(l.patientId) });

const requireQueue = () => requireRole('ADMIN', 'RECEPTIONIST');

const findJob = (id: string) => {
  const j = mockDb.reminderJobs.find((x) => x.id === id);
  assert(j, 'Eslatma topilmadi', 404);
  return j;
};

export const remindersApi = {
  // GET /api/reminders/queue — bugun va ertaga + vaqti o'tgan kutilayotganlar
  queue: (q?: string | null) =>
    mockRequest(() => {
      requireQueue();
      const from = dayjs().startOf('day');
      const to = dayjs().add(1, 'day').endOf('day');
      return mockDb.reminderJobs
        .filter(
          (j) =>
            (dayjs(j.scheduledAt).isAfter(from) && dayjs(j.scheduledAt).isBefore(to)) ||
            j.status === 'CALLING' ||
            (j.status === 'PENDING' && dayjs(j.scheduledAt).isBefore(from)),
        )
        .map(toJobView)
        .filter((j) => matches(q, patientFullName(j.patientId), j.phone))
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    }, 250),

  // GET /api/reminders/summary — bugungi natijalar
  summary: () =>
    mockRequest((): QueueSummary => {
      currentUser();
      return todayReminderStats();
    }, 200),

  // GET /api/reminders/calls?from=&to=&result=&q=&page=
  calls: (f: CallLogFilters) =>
    mockRequest(() => {
      const user = currentUser();
      // Shifokor faqat bemor kartasidagi tarixni ko'radi
      if (!f.patientId && !f.appointmentId) requireQueue();
      else assert(user, 'Ruxsat yo‘q', 403);
      const jobIds = f.appointmentId
        ? new Set(mockDb.reminderJobs.filter((j) => j.appointmentId === f.appointmentId).map((j) => j.id))
        : null;
      const rows = mockDb.callLogs
        .filter((l) => !f.patientId || l.patientId === f.patientId)
        .filter((l) => !jobIds || jobIds.has(l.jobId))
        .filter((l) => !f.result || l.result === f.result)
        .filter((l) => !f.from || dayjs(l.startedAt).isSameOrAfter(dayjs(f.from).startOf('day')))
        .filter((l) => !f.to || dayjs(l.startedAt).isSameOrBefore(dayjs(f.to).endOf('day')))
        .filter((l) => matches(f.q, patientFullName(l.patientId), l.phone))
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .map(toLogView);
      return paginate(rows, f.page ?? 1, f.pageSize ?? 15);
    }),

  // GET /api/appointments/:id/reminders — qabul drawer'i uchun
  appointmentJobs: (appointmentId: string) =>
    mockRequest(() => {
      currentUser();
      return mockDb.reminderJobs
        .filter((j) => j.appointmentId === appointmentId)
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
        .map(toJobView);
    }, 200),

  // POST /api/reminders/jobs/:id/call — "Hozir qo'ng'iroq qilish"
  callNow: (jobId: string) =>
    mockRequest(() => {
      requireQueue();
      const j = findJob(jobId);
      assert(j.status !== 'CALLING', 'Qo‘ng‘iroq allaqachon ketmoqda');
      assert(['PENDING', 'NO_ANSWER', 'BUSY', 'FAILED', 'OPERATOR_REQUESTED'].includes(j.status), 'Bu eslatma yakunlangan');
      const p = findPatient(j.patientId);
      assert(p.callConsent, 'Bemor qo‘ng‘iroq orqali eslatishga rozilik bermagan');
      simulateCall(j);
      return toJobView(j);
    }, 200),

  // POST /api/appointments/:id/call — qabul drawer'idan
  callForAppointment: (appointmentId: string) =>
    mockRequest(() => {
      requireQueue();
      const a = findAppointment(appointmentId);
      const p = findPatient(a.patientId);
      assert(p.callConsent, 'Bemor qo‘ng‘iroq orqali eslatishga rozilik bermagan');
      assert(['SCHEDULED', 'CONFIRMED'].includes(a.status), 'Faqat kutilayotgan qabul uchun qo‘ng‘iroq qilinadi');
      assert(!mockDb.reminderJobs.some((j) => j.appointmentId === a.id && j.status === 'CALLING'), 'Qo‘ng‘iroq allaqachon ketmoqda');
      const job: ReminderJob = {
        id: uid('j'),
        appointmentId: a.id,
        patientId: a.patientId,
        type: 'APPOINTMENT',
        scheduledAt: new Date().toISOString(),
        attempt: 0,
        maxAttempts: 1,
        status: 'PENDING',
        updatedAt: new Date().toISOString(),
      };
      mockDb.reminderJobs.push(job);
      simulateCall(job);
      return toJobView(job);
    }, 200),

  // POST /api/reminders/jobs/:id/skip
  skip: (jobId: string) =>
    mockRequest(() => {
      requireQueue();
      const j = findJob(jobId);
      assert(j.status === 'PENDING' || j.status === 'NO_ANSWER' || j.status === 'BUSY', 'Faqat kutilayotgan eslatmani o‘tkazib yuborish mumkin');
      j.status = 'SKIPPED';
      j.updatedAt = new Date().toISOString();
      return toJobView(j);
    }),

  // POST /api/reminders/jobs/:id/confirm — qo'lda tasdiqlash
  confirmManually: (jobId: string) =>
    mockRequest(() => {
      requireQueue();
      const j = findJob(jobId);
      assert(j.status !== 'CALLING', 'Qo‘ng‘iroq tugashini kuting');
      applyCallResult(j, 'CONFIRMED', 0);
      // qo'lda tasdiqlash qo'ng'iroq logiga "0 s" bilan yoziladi
      return toJobView(j);
    }),

  // GET /api/reminders/rules
  rules: () =>
    mockRequest((): RulesPayload => {
      requireQueue();
      return { rules: mockDb.reminderRules, settings: mockDb.reminderSettings };
    }, 200),

  // PUT /api/reminders/rules
  saveRules: (payload: RulesPayload) =>
    mockRequest(() => {
      requireRole('OWNER', 'ADMIN');
      for (const r of payload.rules) {
        assert(r.name.trim(), 'Qoida nomini kiriting');
        assert(r.retries >= 0 && r.retries <= 3, 'Qayta urinishlar 0–3 oralig‘ida');
        if (r.kind === 'BEFORE_HOURS') assert((r.hours ?? 0) > 0, 'Soatni kiriting');
        else assert(r.time, 'Vaqtni kiriting');
      }
      assert(payload.settings.callWindowStart < payload.settings.callWindowEnd, 'Qo‘ng‘iroq oralig‘i noto‘g‘ri');
      mockDb.reminderRules = payload.rules.map((r): ReminderRule => ({ ...r, id: r.id || uid('r') }));
      mockDb.reminderSettings = payload.settings;
      return { rules: mockDb.reminderRules, settings: mockDb.reminderSettings };
    }),

  // GET /api/reminders/templates
  templates: () =>
    mockRequest(() => {
      requireQueue();
      return { templates: mockDb.voiceTemplates, clinic: { name: mockDb.clinic.name, address: mockDb.clinic.address } };
    }, 200),

  // PUT /api/reminders/templates/:lang
  saveTemplate: (lang: TemplateLang, text: string) =>
    mockRequest(() => {
      requireRole('OWNER', 'ADMIN');
      assert(text.trim().length >= 20, 'Matn juda qisqa');
      mockDb.voiceTemplates[lang] = text.trim();
      return mockDb.voiceTemplates;
    }),

  // POST /api/reminders/test-call
  testCall: (phone: string, lang: TemplateLang) =>
    mockRequest(() => {
      requireRole('OWNER', 'ADMIN');
      assert(isValidUzPhone(phone), 'Telefon raqam noto‘g‘ri');
      const ok = Math.random() > 0.15;
      return ok
        ? { ok, message: `Test qo‘ng‘iroq ${lang === 'uz' ? 'o‘zbek' : 'rus'} tilida yuborildi. Natija: tinglandi, "1" bosildi.` }
        : { ok, message: 'Test qo‘ng‘iroq: abonent javob bermadi.' };
    }, 1500),
};
