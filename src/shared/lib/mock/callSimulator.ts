/**
 * Qo'ng'iroq simulyatsiyasi (faqat VITE_MOCK_CALLS=true bo'lsa ishlaydi).
 * Haqiqiy tizimda qo'ng'iroqni backend (IP-telefoniya / ovozli robot) qiladi.
 *
 * - har 20 soniyada vaqti kelgan bitta PENDING yozuv CALLING ga o'tadi;
 * - 5 soniyadan keyin tasodifiy natija oladi;
 * - qabul statusi tegishlicha yangilanadi (reminderOps.applyCallResult).
 */
import dayjs from '@/shared/lib/dayjs';
import type { CallResult, ReminderJob } from '@/modules/reminders/types';
import { toMin } from '@/shared/utils/schedule';
import { mockDb } from './mockDb';
import { applyCallResult, startCall } from './ops/reminderOps';

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

export const onCallsChanged = (l: Listener) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export const MOCK_CALLS_ENABLED = import.meta.env.VITE_MOCK_CALLS === 'true';

const pickResult = (): CallResult => {
  const r = Math.random();
  if (r < 0.6) return 'CONFIRMED';
  if (r < 0.75) return 'NO_ANSWER';
  if (r < 0.85) return 'CANCELLED_BY_PATIENT';
  if (r < 0.95) return 'BUSY';
  return 'OPERATOR_REQUESTED';
};

/** Qo'ng'iroqni boshlab, 5 soniyadan keyin natija beradi */
export const simulateCall = (job: ReminderJob, forced?: CallResult) => {
  startCall(job);
  emit();
  setTimeout(() => {
    const result = forced ?? pickResult();
    const answered = !['NO_ANSWER', 'BUSY', 'FAILED'].includes(result);
    applyCallResult(job, result, answered ? 15 + Math.floor(Math.random() * 25) : 8 + Math.floor(Math.random() * 20));
    emit();
  }, 5000);
};

const inCallWindow = () => {
  const s = mockDb.reminderSettings;
  const now = dayjs();
  if (s.skipSunday && now.isoWeekday() === 7) return false;
  const m = now.hour() * 60 + now.minute();
  return m >= toMin(s.callWindowStart) && m < toMin(s.callWindowEnd);
};

const tick = () => {
  if (!inCallWindow()) return;
  if (mockDb.reminderJobs.some((j) => j.status === 'CALLING')) return;
  const due = mockDb.reminderJobs
    .filter((j) => j.status === 'PENDING' && dayjs(j.scheduledAt).isBefore(dayjs()))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];
  if (due) simulateCall(due);
};

let timer: ReturnType<typeof setInterval> | null = null;

export const startCallSimulator = () => {
  if (!MOCK_CALLS_ENABLED || timer) return () => undefined;
  timer = setInterval(tick, 20_000);
  return () => {
    if (timer) clearInterval(timer);
    timer = null;
  };
};
