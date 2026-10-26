import dayjs from '@/shared/lib/dayjs';
import { mockDb } from '@/shared/lib/mock/mockDb';
import { assert, currentUser, mockRequest } from '@/shared/lib/mock/mockRequest';
import { uid } from '@/shared/lib/mock/helpers';
import { chairConflict, freeSlots } from '@/shared/lib/mock/ops/appointmentOps';
import { serviceName, staffName } from '@/shared/lib/mock/ops/lookup';
import { hasPermission } from '@/shared/constants/roles';
import { fullName } from '@/shared/utils/format';
import type { OnlineRequest, SlotSuggestion, SuggestQuery, WaitlistEntry, WaitlistInput } from '../types';

/**
 * Tezkor qabul uchun mock API (TZ 4-bo'lim): aqlli vaqt takliflari, kutish ro'yxati, onlayn so'rovlar.
 * Kutish ro'yxati va onlayn so'rovlar shu modul ichida saqlanadi (sahifa yangilanganda seed'ga qaytadi).
 */

/** Xizmat kategoriyasi → mos shifokor mutaxassisligi */
const SPECIALTY_BY_CATEGORY: Record<string, string> = {
  Terapiya: 'Terapevt',
  Xirurgiya: 'Xirurg',
  Ortopediya: 'Ortoped',
  Ortodontiya: 'Ortodont',
  'Bolalar stomatologiyasi': 'Bolalar stomatologi',
};

const roundTo = (min: number, step: number) => Math.max(step, Math.ceil(min / step) * step);

/** Bemorning odatdagi shifokori — oxirgi yakunlangan qabuldagi */
const usualDoctor = (patientId?: string) =>
  patientId
    ? mockDb.appointments
        .filter((a) => a.patientId === patientId && a.status === 'COMPLETED')
        .sort((a, b) => b.start.localeCompare(a.start))
        .at(0)?.doctorId
    : undefined;

const freeChair = (start: string, durationMin: number) =>
  mockDb.chairs.find((c) => c.isActive && !chairConflict({ doctorId: '', chairId: c.id, start, durationMin }));

const iso = (date: string, time: string) => dayjs(`${date} ${time}`, 'YYYY-MM-DD HH:mm').toISOString();

const waitlistDb: WaitlistEntry[] = (() => {
  const pick = (i: number) => mockDb.patients.at(i);
  const svc = (i: number) => mockDb.services.filter((s) => s.isActive).at(i);
  return [
    { i: 3, s: 0, days: [0, 3], note: 'Faqat ertalab kela oladi' },
    { i: 7, s: 2, days: [1, 7], note: 'Ish vaqtidan keyin — 17:00 dan' },
    { i: 11, s: 4, days: [0, 5], note: '' },
  ].flatMap(({ i, s, days, note }, k): WaitlistEntry[] => {
    const p = pick(i);
    const service = svc(s);
    if (!p || !service) return [];
    return [
      {
        id: `w${k + 1}`,
        patientId: p.id,
        patientName: fullName(p),
        patientPhone: p.phone,
        serviceIds: [service.id],
        serviceNames: [service.name],
        from: dayjs().add(days.at(0) ?? 0, 'day').format('YYYY-MM-DD'),
        to: dayjs().add(days.at(1) ?? 7, 'day').format('YYYY-MM-DD'),
        note: note || undefined,
        status: 'ACTIVE',
        createdAt: dayjs().subtract(k + 1, 'day').toISOString(),
      },
    ];
  });
})();

const onlineDb: OnlineRequest[] = (() => {
  const existing = mockDb.patients.at(5);
  const firstService = mockDb.services.find((s) => s.isActive);
  return [
    {
      id: 'o1',
      name: 'Shahzoda Rahmonova',
      phone: '+998935550142',
      serviceId: firstService?.id,
      serviceName: firstService?.name,
      preferredDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
      preferredTime: '10:00',
      channel: 'TELEGRAM',
      note: 'Pastki chap tishim og‘riyapti',
      status: 'NEW',
      createdAt: dayjs().subtract(40, 'minute').toISOString(),
    },
    {
      id: 'o2',
      name: existing ? fullName(existing) : 'Bekzod Aliyev',
      phone: existing?.phone ?? '+998901234500',
      patientId: existing?.id,
      preferredDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
      channel: 'SITE',
      note: 'Tish tozalash',
      status: 'NEW',
      createdAt: dayjs().subtract(3, 'hour').toISOString(),
    },
    {
      id: 'o3',
      name: 'Otabek Qosimov',
      phone: '+998977771020',
      preferredDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
      preferredTime: '17:30',
      channel: 'TELEGRAM',
      note: 'Breket bo‘yicha konsultatsiya',
      status: 'NEW',
      createdAt: dayjs().subtract(1, 'day').toISOString(),
    },
  ];
})();

export const bookingApi = {
  /**
   * GET /api/appointments/suggest — eng yaqin bo'sh vaqtlar (shifokor + kreslo birga).
   * Shifokor tanlanmasa: xizmatga mos mutaxassislar, bemorning odatdagi shifokori birinchi.
   */
  suggest: (q: SuggestQuery) =>
    mockRequest((): SlotSuggestion[] => {
      const user = currentUser();
      const step = mockDb.clinic.slotStep;
      const services = q.serviceIds.map((id) => mockDb.services.find((s) => s.id === id)).filter((s) => !!s);
      const durationMin = roundTo(q.durationMin ?? services.reduce((m, s) => m + s.durationMin, 0), step);
      const limit = q.limit ?? 6;
      const usual = usualDoctor(q.patientId);

      let doctors = mockDb.staff.filter((s) => s.isActive && s.position === 'DOCTOR');
      if (!hasPermission(user.role, 'appointment.manageAll')) doctors = doctors.filter((s) => s.id === user.staffId);
      if (q.doctorId) doctors = doctors.filter((s) => s.id === q.doctorId);
      else {
        const wanted = new Set(services.map((s) => SPECIALTY_BY_CATEGORY[s.category]).filter(Boolean));
        const matching = doctors.filter((s) => s.specialty && wanted.has(s.specialty));
        if (matching.length) doctors = matching;
      }
      doctors.sort((a, b) => Number(b.id === usual) - Number(a.id === usual));

      const out: SlotSuggestion[] = [];
      const start = dayjs(q.from ?? undefined).startOf('day');
      for (let d = 0; d < 21 && out.length < limit * 3; d++) {
        const date = start.add(d, 'day').format('YYYY-MM-DD');
        for (const doc of doctors) {
          // Har bir shifokor-kun uchun 2 ta: eng erta va tushdan keyingi birinchi
          const times = freeSlots(doc.id, date, durationMin);
          const picks = [times.at(0), times.find((t) => t >= '14:00')].filter((t, i, arr): t is string => !!t && arr.indexOf(t) === i);
          for (const time of picks) {
            const at = iso(date, time);
            const chair = freeChair(at, durationMin);
            if (!chair) continue;
            out.push({
              doctorId: doc.id,
              doctorName: doc.fullName,
              specialty: doc.specialty,
              chairId: chair.id,
              chairName: chair.name,
              start: at,
              durationMin,
              usualDoctor: doc.id === usual,
            });
          }
        }
      }
      out.sort((a, b) => a.start.localeCompare(b.start));
      // Odatdagi shifokorning eng yaqin vaqti birinchi — bemorlar o'z shifokorini afzal ko'radi
      const usualFirst = out.find((s) => s.usualDoctor);
      return (usualFirst ? [usualFirst, ...out.filter((s) => s !== usualFirst)] : out).slice(0, limit);
    }, 250),

  // GET /api/waitlist
  waitlist: () => mockRequest(() => waitlistDb.filter((w) => w.status === 'ACTIVE'), 150),

  // POST /api/waitlist
  addWaitlist: (input: WaitlistInput) =>
    mockRequest(() => {
      currentUser();
      const p = mockDb.patients.find((x) => x.id === input.patientId);
      assert(p, 'Bemor topilmadi', 404);
      assert(input.serviceIds.length > 0, 'Kamida bitta xizmat tanlang');
      const w: WaitlistEntry = {
        id: uid('w'),
        patientId: p.id,
        patientName: fullName(p),
        patientPhone: p.phone,
        serviceIds: input.serviceIds,
        serviceNames: input.serviceIds.map(serviceName),
        doctorId: input.doctorId,
        doctorName: input.doctorId ? staffName(input.doctorId) : undefined,
        from: input.from,
        to: input.to,
        note: input.note,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      waitlistDb.unshift(w);
      return w;
    }),

  // PATCH /api/waitlist/:id — yozildi yoki ro'yxatdan olindi
  resolveWaitlist: (id: string, status: 'BOOKED' | 'REMOVED') =>
    mockRequest(() => {
      const w = waitlistDb.find((x) => x.id === id);
      assert(w, 'Yozuv topilmadi', 404);
      w.status = status;
      return w;
    }, 150),

  // GET /api/online-requests — Telegram bot va sayt orqali kelgan yozilish so'rovlari
  online: () => mockRequest(() => onlineDb.filter((o) => o.status === 'NEW'), 150),

  // PATCH /api/online-requests/:id
  resolveOnline: (id: string, status: 'APPROVED' | 'DECLINED') =>
    mockRequest(() => {
      const o = onlineDb.find((x) => x.id === id);
      assert(o, 'So‘rov topilmadi', 404);
      o.status = status;
      return o;
    }, 150),
};
