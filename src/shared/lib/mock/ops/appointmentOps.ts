import dayjs from '@/shared/lib/dayjs';
import type { Appointment } from '@/modules/appointments/types';
import { checkWorkingTime, fromMin, getWorkDay, overlaps, toMin } from '@/shared/utils/schedule';
import { mockDb } from '../mockDb';
import { chairName, findStaff, patientName } from './lookup';

const ACTIVE = ['SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'];

export const isBlocking = (a: Appointment) => ACTIVE.includes(a.status);

interface Candidate {
  doctorId: string;
  chairId?: string;
  start: string;
  durationMin: number;
  excludeId?: string;
  allowPast?: boolean;
}

/** Shifokor bandligi (1-qoida) */
export const doctorConflict = (c: Candidate) =>
  mockDb.appointments.find(
    (a) => a.id !== c.excludeId && a.doctorId === c.doctorId && isBlocking(a) && overlaps(a.start, a.durationMin, c.start, c.durationMin),
  );

/** Kreslo bandligi (1-qoida) */
export const chairConflict = (c: Candidate) =>
  c.chairId
    ? mockDb.appointments.find(
        (a) => a.id !== c.excludeId && a.chairId === c.chairId && isBlocking(a) && overlaps(a.start, a.durationMin, c.start, c.durationMin),
      )
    : undefined;

/**
 * 1–3-qoidalar: konflikt, ish vaqti/ta'til/klinika vaqti, o'tgan vaqt.
 * Muammo bo'lsa — foydalanuvchiga ko'rsatiladigan matn.
 */
export const validateSlot = (c: Candidate): string | null => {
  if (!c.allowPast && dayjs(c.start).isBefore(dayjs())) return "O‘tgan vaqtga qabul yozib bo‘lmaydi";
  const doctor = findStaff(c.doctorId);
  const work = checkWorkingTime(doctor, mockDb.clinic, c.start, c.durationMin);
  if (work) return work;
  const dc = doctorConflict(c);
  if (dc) {
    return `Shifokor bu vaqtda band: ${dayjs(dc.start).format('HH:mm')}–${dayjs(dc.start).add(dc.durationMin, 'minute').format('HH:mm')} (${patientName(dc.patientId)})`;
  }
  const cc = chairConflict(c);
  if (cc) {
    return `${chairName(cc.chairId)} bu vaqtda band: ${dayjs(cc.start).format('HH:mm')}–${dayjs(cc.start).add(cc.durationMin, 'minute').format('HH:mm')}`;
  }
  return null;
};

/** Tanlangan shifokor, sana va davomiylik bo'yicha bo'sh slotlar (kreslo hisobga olinmaydi) */
export const freeSlots = (doctorId: string, date: string, durationMin: number, excludeId?: string, allowPast?: boolean) => {
  const doctor = findStaff(doctorId);
  const day = getWorkDay(doctor, date);
  if (!day) return [];
  const step = mockDb.clinic.slotStep;
  const from = Math.max(toMin(day.start), toMin(mockDb.clinic.workStart));
  const to = Math.min(toMin(day.end), toMin(mockDb.clinic.workEnd));
  const out: string[] = [];
  for (let m = from; m + durationMin <= to; m += step) {
    const time = fromMin(m);
    const start = dayjs(`${date} ${time}`, 'YYYY-MM-DD HH:mm').toISOString();
    const c: Candidate = { doctorId, start, durationMin, excludeId, allowPast };
    if (!validateSlot(c)) out.push(time);
  }
  return out;
};
