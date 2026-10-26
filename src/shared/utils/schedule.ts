import dayjs from '@/shared/lib/dayjs';
import type { Staff, WorkDay } from '@/modules/staff/types';

export interface ClinicHours {
  workDays: number[];
  workStart: string;
  workEnd: string;
}

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

export const fromMin = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

export const minOfDay = (iso: string) => {
  const d = dayjs(iso);
  return d.hour() * 60 + d.minute();
};

export const isOnTimeOff = (staff: Staff, date: string) => {
  const d = dayjs(date).format('YYYY-MM-DD');
  return staff.timeOff.some((t) => d >= t.from && d <= t.to);
};

/** Shifokorning shu kungi ish vaqti (ta'til yoki dam olish kuni bo'lsa null) */
export const getWorkDay = (staff: Staff, date: string): WorkDay | null => {
  if (!staff.isActive || isOnTimeOff(staff, date)) return null;
  const wd = dayjs(date).isoWeekday();
  return staff.schedule.find((s) => s.weekday === wd) ?? null;
};

export const doctorOffReason = (staff: Staff, date: string): string | null => {
  if (!staff.isActive) return 'Nofaol';
  if (isOnTimeOff(staff, date)) {
    const t = staff.timeOff.find((x) => {
      const d = dayjs(date).format('YYYY-MM-DD');
      return d >= x.from && d <= x.to;
    });
    return t ? `Ta’tilda: ${t.reason}` : "Ta’tilda";
  }
  if (!getWorkDay(staff, date)) return 'Bu kuni ishlamaydi';
  return null;
};

/**
 * Berilgan vaqt oralig'i shifokor jadvali va klinika ish vaqtiga to'g'ri keladimi.
 * Mos kelmasa — sabab matni qaytadi.
 */
export const checkWorkingTime = (
  staff: Staff,
  clinic: ClinicHours,
  startIso: string,
  durationMin: number,
): string | null => {
  const date = dayjs(startIso).format('YYYY-MM-DD');
  const wd = dayjs(startIso).isoWeekday();
  if (!clinic.workDays.includes(wd)) return 'Klinika bu kuni ishlamaydi';
  const s = minOfDay(startIso);
  const e = s + durationMin;
  if (s < toMin(clinic.workStart) || e > toMin(clinic.workEnd)) return 'Klinika ish vaqtidan tashqarida';
  const off = doctorOffReason(staff, date);
  if (off) return `Shifokor: ${off.toLowerCase()}`;
  const day = getWorkDay(staff, date)!;
  if (s < toMin(day.start) || e > toMin(day.end)) return 'Shifokorning ish vaqtidan tashqarida';
  if (day.breakStart && day.breakEnd) {
    const bs = toMin(day.breakStart);
    const be = toMin(day.breakEnd);
    if (s < be && e > bs) return 'Shifokorning tushlik vaqtiga to‘g‘ri keladi';
  }
  return null;
};

export const overlaps = (aStart: string, aDur: number, bStart: string, bDur: number) => {
  const a1 = dayjs(aStart).valueOf();
  const a2 = a1 + aDur * 60000;
  const b1 = dayjs(bStart).valueOf();
  const b2 = b1 + bDur * 60000;
  return a1 < b2 && b1 < a2;
};
