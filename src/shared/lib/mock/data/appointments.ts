import type { Appointment, AppointmentStatus } from '@/modules/appointments/types';
import { checkWorkingTime } from '@/shared/utils/schedule';
import { createRng, dt } from '../helpers';
import { clinicSeed, servicesSeed, svc } from './catalog';
import { staffSeed } from './staff';

interface Extra {
  note?: string;
  cancelReason?: string;
  reminderEnabled?: boolean;
  createdOffset?: number;
  createdTime?: string;
  source?: string;
}

const duration = (codes: string[]) =>
  codes.reduce((sum, c) => sum + (servicesSeed.find((s) => s.code === c)?.durationMin ?? 30), 0);

const DOCTOR_CHAIR: Record<string, string> = { s1: 'c1', s2: 'c2', s3: 'c3', s4: 'c3' };

const ap = (
  id: string,
  offset: number,
  time: string,
  patientId: string,
  doctorId: string,
  codes: string[],
  status: AppointmentStatus,
  extra: Extra = {},
): Appointment => ({
  id,
  patientId,
  doctorId,
  chairId: DOCTOR_CHAIR[doctorId] ?? 'c1',
  start: dt(offset, time),
  durationMin: duration(codes),
  serviceIds: codes.map(svc),
  status,
  note: extra.note,
  source: extra.source ?? 'PHONE',
  reminderEnabled: extra.reminderEnabled ?? true,
  cancelReason: extra.cancelReason,
  createdById: 's6',
  createdAt: dt(extra.createdOffset ?? Math.min(offset, 0) - 3, extra.createdTime ?? '11:20'),
});

/** Kelajakdagi kun uchun shu vaqtda ishlaydigan shifokorni tanlaydi (seed har kuni to'g'ri ko'rinishi uchun) */
const pickDoctor = (offset: number, time: string, codes: string[], prefs: string[]) => {
  const start = dt(offset, time);
  const dur = duration(codes);
  for (const id of prefs) {
    const s = staffSeed.find((x) => x.id === id)!;
    if (!checkWorkingTime(s, clinicSeed, start, dur)) return id;
  }
  return prefs[0]!;
};

const today: Appointment[] = [
  ap('a1', 0, '09:00', 'p9', 's1', ['D001'], 'COMPLETED'),
  ap('a2', 0, '09:30', 'p1', 's1', ['T101', 'D003'], 'COMPLETED', { note: '16-tish, plomba almashtirish' }),
  ap('a3', 0, '10:00', 'p2', 's2', ['T101'], 'ARRIVED', { note: '14-tish, davolash rejasi 1-bosqich', source: 'REFERRAL' }),
  ap('a4', 0, '11:00', 'p6', 's1', ['G401'], 'IN_PROGRESS', { source: 'INSTAGRAM' }),
  ap('a5', 0, '11:30', 'p4', 's4', ['K501'], 'CONFIRMED', { note: 'Ona bilan keladi' }),
  ap('a6', 0, '12:00', 'p10', 's1', ['D001'], 'CONFIRMED'),
  ap('a7', 0, '14:00', 'p3', 's2', ['D001', 'D002'], 'SCHEDULED', { note: 'Implant bo‘yicha konsultatsiya' }),
  ap('a8', 0, '14:30', 'p11', 's4', ['D001'], 'SCHEDULED', { createdOffset: 0, createdTime: '08:40' }),
  ap('a9', 0, '15:00', 'p12', 's1', ['G401'], 'CANCELLED', { cancelReason: "Bemor qo‘ng‘iroqda bekor qildi", source: 'INSTAGRAM' }),
  ap('a10', 0, '16:00', 'p7', 's2', ['D001'], 'CONFIRMED', { createdOffset: 0, createdTime: '08:15' }),
  ap('a11', 0, '16:30', 'p13', 's1', ['T101'], 'SCHEDULED', { createdOffset: 0, createdTime: '09:05', source: 'WALK_IN' }),
  ap('a12', 0, '17:30', 'p14', 's1', ['D001'], 'SCHEDULED', { createdOffset: 0, createdTime: '09:20', source: 'INSTAGRAM' }),
];

const yesterday: Appointment[] = [
  ap('a13', -1, '09:00', 'p7', 's1', ['T102'], 'COMPLETED', { note: '14-tish kanal' }),
  ap('a14', -1, '10:30', 'p10', 's1', ['G401'], 'COMPLETED'),
  ap('a15', -1, '12:00', 'p12', 's1', ['D001'], 'COMPLETED'),
  ap('a16', -1, '10:00', 'p13', 's4', ['D003'], 'COMPLETED'),
  ap('a17', -1, '11:00', 'p14', 's4', ['G401'], 'COMPLETED'),
  ap('a18', -1, '14:00', 'p11', 's1', ['D001'], 'NO_SHOW'),
];

const T = ['s1', 's4', 's2'];
const tomorrowSeed: [string, string, string, string[], Extra?][] = [
  ['a19', '09:00', 'p5', ['D001'], { reminderEnabled: false }],
  ['a20', '10:00', 'p9', ['T101']],
  ['a21', '11:00', 'p10', ['D003']],
  ['a22', '11:30', 'p11', ['G401']],
  ['a23', '14:00', 'p12', ['G401']],
  ['a24', '15:00', 'p13', ['T104']],
  ['a25', '16:00', 'p14', ['G402']],
];
const tomorrow = tomorrowSeed.map(([id, time, p, codes, extra]) =>
  ap(id, 1, time, p, pickDoctor(1, time, codes, T), codes, 'SCHEDULED', { createdOffset: -1, ...extra }),
);

const upcoming: Appointment[] = [
  ap('a26', 2, '10:00', 'p1', pickDoctor(2, '10:00', ['T101'], ['s1', 's4', 's2']), ['T101'], 'SCHEDULED', { note: '47-tish karies' }),
  ap('a27', 4, '11:00', 'p3', pickDoctor(4, '11:00', ['S201'], ['s3', 's1', 's4']), ['S201'], 'SCHEDULED', { note: '45-tishni olish' }),
  ap('a28', 5, '12:00', 'p2', pickDoctor(5, '12:00', ['O303'], ['s2', 's1']), ['O303'], 'SCHEDULED', { note: '11, 21 vinir — 2-bosqich' }),
  ap('a29', 6, '10:00', 'p6', pickDoctor(6, '10:00', ['D001'], ['s1', 's4', 's2']), ['D001'], 'SCHEDULED'),
  ap('a30', 7, '15:00', 'p7', pickDoctor(7, '15:00', ['O301'], ['s2', 's1']), ['O301'], 'SCHEDULED'),
];

/** Hisobot va chartlar uchun: oxirgi 30 kundagi yakunlangan qabullar (deterministik) */
const buildHistory = (): Appointment[] => {
  const rng = createRng(20260930);
  const out: Appointment[] = [];
  const pool = ['p1', 'p3', 'p6', 'p7', 'p9', 'p10', 'p11', 'p12', 'p13', 'p14', 'p2', 'p5'];
  const codesPool = [['D001'], ['T101'], ['G401'], ['T102'], ['D003'], ['T104'], ['D001', 'D002'], ['S201'], ['O301'], ['T103']];
  const times = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00'];
  let n = 100;
  for (let off = -2; off >= -30; off--) {
    const count = rng.int(1, 2);
    const usedDoctors = new Set<string>();
    for (let i = 0; i < count; i++) {
      const doctorId = rng.pick(['s1', 's2', 's4'].filter((x) => !usedDoctors.has(x)));
      usedDoctors.add(doctorId);
      const codes = rng.pick(codesPool);
      const time = rng.pick(times);
      const status: AppointmentStatus = rng.chance(0.08) ? 'NO_SHOW' : rng.chance(0.05) ? 'CANCELLED' : 'COMPLETED';
      out.push(
        ap(`a${++n}`, off, time, rng.pick(pool), doctorId, codes, status, {
          cancelReason: status === 'CANCELLED' ? 'Bemor iltimosi bilan' : undefined,
          source: rng.pick(['PHONE', 'PHONE', 'INSTAGRAM', 'REFERRAL', 'WALK_IN']),
          reminderEnabled: rng.chance(0.85),
        }),
      );
    }
  }
  // Maxsus tarixiy qabullar
  out.push(ap('a90', -20, '10:00', 'p2', 's2', ['G401'], 'COMPLETED', { note: 'Davolash rejasi 1-bosqich' }));
  out.push(ap('a91', -60, '11:00', 'p7', 's2', ['O301'], 'COMPLETED', { note: '23, 24 koronka' }));
  out.push(ap('a92', -213, '12:00', 'p8', 's1', ['D001', 'D002'], 'COMPLETED', { note: 'Ortodontik nazorat' }));
  out.push(ap('a93', -35, '10:00', 'p4', 's4', ['K501'], 'COMPLETED', { note: '64-tish' }));
  return out;
};

export const appointmentsSeed: Appointment[] = [...today, ...yesterday, ...tomorrow, ...upcoming, ...buildHistory()];
