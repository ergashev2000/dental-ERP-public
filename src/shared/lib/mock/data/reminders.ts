import dayjs from '@/shared/lib/dayjs';
import type { CallLog, CallResult, ReminderJob, ReminderRule, ReminderSettings, VoiceTemplates } from '@/modules/reminders/types';
import { createRng, dt } from '../helpers';
import { appointmentsSeed } from './appointments';
import { patientsSeed } from './patients';

const rng = createRng(1301);

export const reminderRulesSeed: ReminderRule[] = [
  { id: 'r1', name: 'Bir kun oldin', kind: 'DAY_BEFORE_AT', time: '18:00', retries: 2, retryIntervalMin: 30, isActive: true },
  { id: 'r2', name: '2 soat oldin', kind: 'BEFORE_HOURS', hours: 2, retries: 1, retryIntervalMin: 15, isActive: true },
];

export const reminderSettingsSeed: ReminderSettings = {
  callWindowStart: '09:00',
  callWindowEnd: '20:00',
  skipSunday: true,
  smsFallback: false,
  recallEnabled: true,
  recallMonths: 6,
};

export const voiceTemplatesSeed: VoiceTemplates = {
  uz: 'Assalomu alaykum, {ism}. Siz {sana} kuni soat {vaqt} da {klinika} klinikasida shifokor {shifokor} qabuliga yozilgansiz. Tasdiqlash uchun 1 ni, bekor qilish uchun 2 ni, administrator bilan gaplashish uchun 3 ni bosing.',
  ru: 'Здравствуйте, {ism}. Вы записаны на {sana} в {vaqt} в клинику {klinika} на приём к врачу {shifokor}. Для подтверждения нажмите 1, для отмены — 2, чтобы поговорить с администратором — 3.',
};

export const reminderJobsSeed: ReminderJob[] = [];
export const callLogsSeed: CallLog[] = [];

let jobN = 0;
let logN = 0;

const phoneOf = (patientId: string) => patientsSeed.find((p) => p.id === patientId)?.phone ?? '';
const KEY: Partial<Record<CallResult, CallLog['keyPressed']>> = {
  CONFIRMED: '1',
  CANCELLED_BY_PATIENT: '2',
  OPERATOR_REQUESTED: '3',
};

/** Tugallangan job: har urinish uchun CallLog yoziladi */
const finishedJob = (
  appointmentId: string,
  patientId: string,
  ruleId: 'r1' | 'r2',
  firstAt: string,
  results: CallResult[],
) => {
  const rule = reminderRulesSeed.find((r) => r.id === ruleId)!;
  const job: ReminderJob = {
    id: `j${++jobN}`,
    appointmentId,
    patientId,
    ruleId,
    type: 'APPOINTMENT',
    scheduledAt: firstAt,
    attempt: results.length,
    maxAttempts: rule.retries + 1,
    status: results[results.length - 1]!,
    updatedAt: firstAt,
  };
  results.forEach((result, i) => {
    const startedAt = dayjs(firstAt).add(i * rule.retryIntervalMin, 'minute').toISOString();
    const answered = !['NO_ANSWER', 'BUSY', 'FAILED'].includes(result);
    callLogsSeed.push({
      id: `cl${++logN}`,
      jobId: job.id,
      patientId,
      phone: phoneOf(patientId),
      startedAt,
      durationSec: answered ? rng.int(18, 42) : rng.int(8, 30),
      result,
      keyPressed: KEY[result],
      attempt: i + 1,
    });
    job.updatedAt = dayjs(startedAt).add(40, 'second').toISOString();
  });
  reminderJobsSeed.push(job);
};

const pendingJob = (appointmentId: string | undefined, patientId: string, ruleId: string | undefined, at: string, type: ReminderJob['type'] = 'APPOINTMENT') => {
  const rule = reminderRulesSeed.find((r) => r.id === ruleId);
  reminderJobsSeed.push({
    id: `j${++jobN}`,
    appointmentId,
    patientId,
    ruleId,
    type,
    scheduledAt: at,
    attempt: 0,
    maxAttempts: rule ? rule.retries + 1 : 2,
    status: 'PENDING',
    updatedAt: dt(0, '08:00'),
  });
};

const consent = (patientId: string) => patientsSeed.find((p) => p.id === patientId)?.callConsent ?? false;
const r1At = (start: string) => dayjs(start).subtract(1, 'day').hour(18).minute(0).second(0).millisecond(0).toISOString();
const r2At = (start: string) => dayjs(start).subtract(2, 'hour').toISOString();
const inWindow = (iso: string) => {
  const h = dayjs(iso).hour();
  return h >= 9 && h < 20;
};

// 1) Bugungi qabullar uchun kechagi 18:00 dagi r1 natijalari
const TODAY_R1: Record<string, CallResult[]> = {
  a1: ['CONFIRMED'],
  a2: ['CONFIRMED'],
  a3: ['CONFIRMED'],
  a4: ['CONFIRMED'],
  a5: ['CONFIRMED'],
  a6: ['NO_ANSWER', 'CONFIRMED'],
  a9: ['CANCELLED_BY_PATIENT'],
  a7: ['NO_ANSWER', 'NO_ANSWER'],
};

for (const a of appointmentsSeed) {
  const offset = dayjs(a.start).startOf('day').diff(dayjs().startOf('day'), 'day');
  if (!a.reminderEnabled || !consent(a.patientId)) continue;

  if (offset === 0) {
    const r1 = TODAY_R1[a.id];
    if (r1) finishedJob(a.id, a.patientId, 'r1', r1At(a.start), r1);
    if (['SCHEDULED', 'CONFIRMED'].includes(a.status) && inWindow(r2At(a.start))) {
      if (dayjs(r2At(a.start)).isAfter(dayjs())) pendingJob(a.id, a.patientId, 'r2', r2At(a.start));
      // vaqti o'tgan "2 soat oldin" qo'ng'iroqlari allaqachon bajarilgan (p3 — faqat 2/3 javobsiz holati qoladi)
      else if (a.id !== 'a7') finishedJob(a.id, a.patientId, 'r2', r2At(a.start), a.status === 'CONFIRMED' ? ['CONFIRMED'] : ['NO_ANSWER', 'NO_ANSWER']);
    }
  } else if (offset > 0) {
    pendingJob(a.id, a.patientId, 'r1', r1At(a.start));
    if (inWindow(r2At(a.start))) pendingJob(a.id, a.patientId, 'r2', r2At(a.start));
  } else if (offset >= -6) {
    // O'tgan hafta: tarix
    let r1: CallResult[];
    if (a.status === 'NO_SHOW') r1 = ['NO_ANSWER', 'NO_ANSWER', 'NO_ANSWER'];
    else if (a.status === 'CANCELLED') r1 = ['CANCELLED_BY_PATIENT'];
    else if (rng.chance(0.15)) r1 = ['BUSY', 'CONFIRMED'];
    else if (rng.chance(0.08)) r1 = ['OPERATOR_REQUESTED'];
    else r1 = ['CONFIRMED'];
    finishedJob(a.id, a.patientId, 'r1', r1At(a.start), r1);
    if (a.status === 'COMPLETED' && inWindow(r2At(a.start))) {
      finishedJob(a.id, a.patientId, 'r2', r2At(a.start), rng.chance(0.2) ? ['NO_ANSWER', 'CONFIRMED'] : ['CONFIRMED']);
    }
  }
}

// 2) Profilaktika: p8 — oxirgi tashrifdan 7 oy o'tgan
pendingJob(undefined, 'p8', undefined, dt(0, '11:00'), 'RECALL');
