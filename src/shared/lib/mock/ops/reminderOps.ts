import dayjs from '@/shared/lib/dayjs';
import type { Appointment } from '@/modules/appointments/types';
import type { CallLog, CallResult, ReminderJob, ReminderRule } from '@/modules/reminders/types';
import { toMin } from '@/shared/utils/schedule';
import { mockDb } from '../mockDb';
import { uid } from '../helpers';
import { patientName, staffName } from './lookup';

/** Ruxsat etilgan qo'ng'iroq oynasiga suradi (oraliq tashqarisi / yakshanba) */
export const shiftIntoWindow = (iso: string) => {
  const s = mockDb.reminderSettings;
  let t = dayjs(iso);
  for (let guard = 0; guard < 8; guard++) {
    const min = t.hour() * 60 + t.minute();
    if (s.skipSunday && t.isoWeekday() === 7) {
      t = t.add(1, 'day').startOf('day').add(toMin(s.callWindowStart), 'minute');
      continue;
    }
    if (min < toMin(s.callWindowStart)) {
      t = t.startOf('day').add(toMin(s.callWindowStart), 'minute');
      continue;
    }
    if (min >= toMin(s.callWindowEnd)) {
      t = t.add(1, 'day').startOf('day').add(toMin(s.callWindowStart), 'minute');
      continue;
    }
    break;
  }
  return t.toISOString();
};

const ruleTime = (rule: ReminderRule, start: string) =>
  rule.kind === 'BEFORE_HOURS'
    ? dayjs(start).subtract(rule.hours ?? 2, 'hour').toISOString()
    : dayjs(start)
        .subtract(1, 'day')
        .startOf('day')
        .add(toMin(rule.time ?? '18:00'), 'minute')
        .toISOString();

/**
 * Qabul uchun eslatma navbatini yaratadi (9-qoida: rozilik bo'lmasa qo'shilmaydi).
 * Vaqti o'tgan yoki qabuldan keyinga surilgan qoidalar o'tkazib yuboriladi.
 */
export const scheduleReminders = (appt: Appointment) => {
  const patient = mockDb.patients.find((p) => p.id === appt.patientId);
  if (!appt.reminderEnabled || !patient?.callConsent) return 0;
  let created = 0;
  for (const rule of mockDb.reminderRules.filter((r) => r.isActive)) {
    const at = shiftIntoWindow(ruleTime(rule, appt.start));
    if (dayjs(at).isBefore(dayjs()) || !dayjs(at).isBefore(dayjs(appt.start))) continue;
    mockDb.reminderJobs.push({
      id: uid('j'),
      appointmentId: appt.id,
      patientId: appt.patientId,
      ruleId: rule.id,
      type: 'APPOINTMENT',
      scheduledAt: at,
      attempt: 0,
      maxAttempts: rule.retries + 1,
      status: 'PENDING',
      updatedAt: new Date().toISOString(),
    });
    created++;
  }
  return created;
};

/** Qabul bekor qilinsa / ko'chirilsa: PENDING eslatmalar SKIPPED bo'ladi */
export const skipPendingReminders = (appointmentId: string) => {
  let n = 0;
  for (const j of mockDb.reminderJobs) {
    if (j.appointmentId === appointmentId && j.status === 'PENDING') {
      j.status = 'SKIPPED';
      j.updatedAt = new Date().toISOString();
      n++;
    }
  }
  return n;
};

export const addTask = (task: Omit<(typeof mockDb.tasks)[number], 'id' | 'done' | 'at'>) => {
  mockDb.tasks.unshift({ ...task, id: uid('task'), at: new Date().toISOString(), done: false });
};

const KEY: Partial<Record<CallResult, CallLog['keyPressed']>> = {
  CONFIRMED: '1',
  CANCELLED_BY_PATIENT: '2',
  OPERATOR_REQUESTED: '3',
};

/** Qo'ng'iroqni boshlash: PENDING/NO_ANSWER/BUSY → CALLING */
export const startCall = (job: ReminderJob) => {
  job.status = 'CALLING';
  job.attempt += 1;
  job.maxAttempts = Math.max(job.maxAttempts, job.attempt);
  job.updatedAt = new Date().toISOString();
};

/**
 * Qo'ng'iroq natijasini qo'llash (9.8-bo'lim, 3-band):
 * 1 → qabul CONFIRMED; 2 → qabul CANCELLED + bildirishnoma; 3 → administratorga vazifa;
 * NO_ANSWER/BUSY → qoidadagi interval bo'yicha qayta urinish.
 */
export const applyCallResult = (job: ReminderJob, result: CallResult, durationSec: number) => {
  const now = dayjs();
  const patient = mockDb.patients.find((p) => p.id === job.patientId);
  mockDb.callLogs.push({
    id: uid('cl'),
    jobId: job.id,
    patientId: job.patientId,
    phone: patient?.phone ?? '',
    startedAt: now.subtract(durationSec, 'second').toISOString(),
    durationSec,
    result,
    keyPressed: KEY[result],
    attempt: job.attempt,
  });

  job.status = result;
  job.updatedAt = now.toISOString();
  const appt = job.appointmentId ? mockDb.appointments.find((a) => a.id === job.appointmentId) : undefined;
  const when = appt ? `${dayjs(appt.start).format('DD.MM HH:mm')} (${staffName(appt.doctorId)})` : 'profilaktik ko‘rik';

  if (result === 'CONFIRMED' && appt && appt.status === 'SCHEDULED') {
    appt.status = 'CONFIRMED';
  }
  if (result === 'CANCELLED_BY_PATIENT' && appt && ['SCHEDULED', 'CONFIRMED'].includes(appt.status)) {
    appt.status = 'CANCELLED';
    appt.cancelReason = "Bemor qo‘ng‘iroqda bekor qildi";
    skipPendingReminders(appt.id);
    addTask({
      kind: 'CALL_CANCELLED',
      title: "Bemor qo‘ng‘iroqda qabulni bekor qildi",
      description: `${patientName(job.patientId)} — ${when}`,
      link: `/appointments?appointment=${appt.id}`,
    });
  }
  if (result === 'OPERATOR_REQUESTED') {
    addTask({
      kind: 'OPERATOR',
      title: 'Qayta qo‘ng‘iroq qiling',
      description: `${patientName(job.patientId)} administrator bilan gaplashmoqchi — ${when}`,
      link: appt ? `/appointments?appointment=${appt.id}` : `/patients/${job.patientId}`,
    });
  }
  if (result === 'FAILED') {
    addTask({
      kind: 'CALL_FAILED',
      title: "Qo‘ng‘iroq amalga oshmadi",
      description: `${patientName(job.patientId)} — raqamni tekshiring`,
      link: `/patients/${job.patientId}?tab=reminders`,
    });
  }
  if ((result === 'NO_ANSWER' || result === 'BUSY') && job.attempt < job.maxAttempts) {
    const rule = mockDb.reminderRules.find((r) => r.id === job.ruleId);
    const next = shiftIntoWindow(now.add(rule?.retryIntervalMin ?? 30, 'minute').toISOString());
    if (!appt || dayjs(next).isBefore(dayjs(appt.start))) {
      job.status = 'PENDING';
      job.scheduledAt = next;
    }
  }
};

/**
 * Bugungi eslatmalar holati: bugungi qabullar bo'yicha joblar (kecha 18:00 da qilingan bo'lsa ham)
 * va bugun qilingan qo'ng'iroqlar — har job uchun oxirgi holat.
 */
export const todayReminderStats = () => {
  const today = dayjs();
  const todayAppts = new Set(mockDb.appointments.filter((a) => dayjs(a.start).isSame(today, 'day')).map((a) => a.id));
  const calledToday = new Set(mockDb.callLogs.filter((l) => dayjs(l.startedAt).isSame(today, 'day')).map((l) => l.jobId));
  const jobs = mockDb.reminderJobs.filter((j) => (j.appointmentId && todayAppts.has(j.appointmentId)) || calledToday.has(j.id));
  const count = (...s: string[]) => jobs.filter((j) => s.includes(j.status)).length;
  return {
    confirmed: count('CONFIRMED'),
    cancelled: count('CANCELLED_BY_PATIENT'),
    noAnswer: count('NO_ANSWER', 'BUSY', 'FAILED', 'OPERATOR_REQUESTED'),
    pending: mockDb.reminderJobs.filter((j) => ['PENDING', 'CALLING'].includes(j.status) && dayjs(j.scheduledAt).isBefore(today.endOf('day'))).length,
  };
};
