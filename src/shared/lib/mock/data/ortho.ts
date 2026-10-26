/**
 * Breketli bemorlar seed'i: turli holatlar — muddati o'tgan (kelmayapti), to'lovi kechikkan,
 * endi boshlagan, retensiya davridagi va tugagan davolash.
 */
import type { Dayjs } from 'dayjs';
import type { Patient } from '@/modules/patients/types';
import type { Appointment } from '@/modules/appointments/types';
import type { Invoice, Payment, PaymentMethod } from '@/modules/billing/types';
import type { OrthoCase, OrthoStage, OrthoVisit } from '@/modules/orthodontics/types';
import { day, dt } from '../helpers';
import { invoicesSeed } from './billing';

const ORTHO_DOCTOR = 's7';
const ORTHO_CHAIR = 'c4';

const born = (age: number) => day(0).subtract(age, 'year').subtract(age * 11, 'day').format('YYYY-MM-DD');

interface Spec {
  patient: { id: string; lastName: string; firstName: string; age: number; gender: 'M' | 'F'; phone: string; guardian?: { name: string; phone: string } };
  stage: OrthoStage;
  status?: OrthoCase['status'];
  appliance: OrthoCase['appliance'];
  jaw: OrthoCase['jaw'];
  /** Necha kun oldin boshlangan */
  startedAgo: number;
  plannedMonths: number;
  interval: number;
  total: number;
  initial: number;
  monthly: number;
  /** Oxirgi korreksiya necha kun oldin */
  lastVisitAgo: number;
  /** Kelajakdagi qabul (kun) — bo'lsa "kelmayapti" emas */
  nextIn?: number;
  /** Nechta oylik to'lov qilingan (boshlang'ichdan tashqari) */
  monthsPaid: number;
  note?: string;
}

const SPECS: Spec[] = [
  {
    patient: { id: 'p15', lastName: 'Rahimova', firstName: 'Sevara', age: 16, gender: 'F', phone: '+998901230015', guardian: { name: 'Rahimova Dilfuza', phone: '+998901230115' } },
    stage: 'ADJUSTMENT', appliance: 'METAL', jaw: 'BOTH', startedAgo: 300, plannedMonths: 18, interval: 30,
    total: 12_000_000, initial: 4_000_000, monthly: 500_000, lastVisitAgo: 45, monthsPaid: 9,
  },
  {
    patient: { id: 'p16', lastName: 'Tursunov', firstName: 'Bekzod', age: 14, gender: 'M', phone: '+998901230016', guardian: { name: 'Tursunov Anvar', phone: '+998901230116' } },
    stage: 'ADJUSTMENT', appliance: 'METAL', jaw: 'BOTH', startedAgo: 200, plannedMonths: 20, interval: 30,
    total: 11_000_000, initial: 3_000_000, monthly: 450_000, lastVisitAgo: 20, nextIn: 10, monthsPaid: 6,
  },
  {
    patient: { id: 'p17', lastName: 'Aliyeva', firstName: 'Nodira', age: 22, gender: 'F', phone: '+998901230017' },
    stage: 'ADJUSTMENT', appliance: 'CERAMIC', jaw: 'UPPER', startedAgo: 95, plannedMonths: 14, interval: 30,
    total: 14_000_000, initial: 5_000_000, monthly: 700_000, lastVisitAgo: 35, monthsPaid: 1,
    note: 'Keramik breketlar, faqat yuqori jag‘',
  },
  {
    patient: { id: 'p18', lastName: 'Qodirov', firstName: 'Jahongir', age: 19, gender: 'M', phone: '+998901230018' },
    stage: 'DIAGNOSTICS', appliance: 'SAPPHIRE', jaw: 'BOTH', startedAgo: 10, plannedMonths: 18, interval: 21,
    total: 16_000_000, initial: 5_000_000, monthly: 650_000, lastVisitAgo: 10, nextIn: 3, monthsPaid: 0,
    note: 'Keyingi tashrifda breket o‘rnatiladi',
  },
  {
    patient: { id: 'p19', lastName: 'Ismoilova', firstName: 'Zarina', age: 25, gender: 'F', phone: '+998901230019' },
    stage: 'CONSULTATION', appliance: 'ALIGNER', jaw: 'BOTH', startedAgo: 2, plannedMonths: 12, interval: 30,
    total: 0, initial: 0, monthly: 0, lastVisitAgo: 2, monthsPaid: 0,
    note: 'Elayner va breket o‘rtasida tanlayapti — narx kelishilmagan',
  },
  {
    patient: { id: 'p20', lastName: 'Normatov', firstName: 'Sherzod', age: 17, gender: 'M', phone: '+998901230020' },
    stage: 'RETENTION', appliance: 'METAL', jaw: 'BOTH', startedAgo: 700, plannedMonths: 20, interval: 90,
    total: 10_000_000, initial: 4_000_000, monthly: 400_000, lastVisitAgo: 60, monthsPaid: 15,
  },
  {
    patient: { id: 'p21', lastName: 'Yoqubova', firstName: 'Laylo', age: 13, gender: 'F', phone: '+998901230021', guardian: { name: 'Yoqubov Rustam', phone: '+998901230121' } },
    stage: 'ADJUSTMENT', appliance: 'SELF_LIGATING', jaw: 'BOTH', startedAgo: 400, plannedMonths: 24, interval: 28,
    total: 13_000_000, initial: 3_000_000, monthly: 500_000, lastVisitAgo: 70, monthsPaid: 8,
  },
  {
    patient: { id: 'p22', lastName: 'Karimov', firstName: 'Otabek', age: 21, gender: 'M', phone: '+998901230022' },
    stage: 'RETENTION', status: 'FINISHED', appliance: 'METAL', jaw: 'BOTH', startedAgo: 820, plannedMonths: 18, interval: 90,
    total: 9_000_000, initial: 3_000_000, monthly: 500_000, lastVisitAgo: 120, monthsPaid: 12,
  },
];

const WORKS: string[][] = [
  ['Duga almashtirildi'],
  ['Ligaturalar almashtirildi', 'Faollashtirish'],
  ['Duga almashtirildi', 'Rezinkalar berildi'],
  ['Nazorat ko‘rigi'],
  ['Breket qayta yopishtirildi'],
];

/** Bosqichlar yo'li: joriy bosqichgacha tashriflar */
const stagePath = (stage: OrthoStage, count: number): OrthoStage[] => {
  const early: OrthoStage[] = ['CONSULTATION', 'DIAGNOSTICS', 'BONDING'];
  const order: OrthoStage[] = ['CONSULTATION', 'DIAGNOSTICS', 'BONDING', 'ADJUSTMENT', 'DEBONDING', 'RETENTION'];
  const idx = order.indexOf(stage);
  return Array.from({ length: count }, (_, i) => {
    if (i < early.length && i < idx) return early[i]!;
    if (i === count - 1) return stage;
    if (stage === 'RETENTION' && i === count - 2) return 'DEBONDING';
    return order[Math.min(idx, 3)]!;
  });
};

/** Yakshanbaga to'g'ri kelsa — dushanbaga suriladi (ortodont dush–shan ishlaydi) */
const workDay = (offset: number) => (day(offset).isoWeekday() === 7 ? offset + 1 : offset);

export const orthoPatientsSeed: Patient[] = [];
export const orthoCasesSeed: OrthoCase[] = [];
export const orthoVisitsSeed: OrthoVisit[] = [];
export const orthoInvoicesSeed: Invoice[] = [];
export const orthoPaymentsSeed: Payment[] = [];
export const orthoAppointmentsSeed: Appointment[] = [];

let invNo = invoicesSeed.reduce((m, i) => Math.max(m, Number(i.number.split('-')[2])), 0);
const METHODS: PaymentMethod[] = ['CASH', 'CARD', 'TRANSFER', 'TRANSFER'];

SPECS.forEach((s, n) => {
  const p = s.patient;
  const start = day(-s.startedAgo);
  orthoPatientsSeed.push({
    id: p.id,
    cardNo: `P-${String(115 + n).padStart(6, '0')}`,
    lastName: p.lastName,
    firstName: p.firstName,
    birthDate: born(p.age),
    gender: p.gender,
    phone: p.phone,
    region: 'Toshkent shahri',
    district: 'Yunusobod',
    address: 'Amir Temur ko‘chasi',
    source: 'INSTAGRAM',
    tags: ['ORTHO'],
    allergies: n === 2 ? ['Nikel'] : [],
    conditions: [],
    medications: [],
    callConsent: true,
    guardian: p.guardian,
    createdAt: start.hour(10).toISOString(),
  });

  const caseId = `oc${n + 1}`;
  const c: OrthoCase = {
    id: caseId,
    patientId: p.id,
    doctorId: ORTHO_DOCTOR,
    stage: s.stage,
    status: s.status ?? 'ACTIVE',
    appliance: s.appliance,
    jaw: s.jaw,
    startDate: start.format('YYYY-MM-DD'),
    plannedMonths: s.plannedMonths,
    visitIntervalDays: s.interval,
    totalPrice: s.total,
    initialPayment: s.initial,
    monthlyPayment: s.monthly,
    note: s.note,
    createdAt: start.hour(10).toISOString(),
  };

  // Tashriflar: boshlanishdan oxirgi korreksiyagacha, oraliq bo'yicha
  const dates: number[] = [];
  for (let ago = s.startedAgo; ago > s.lastVisitAgo; ago -= Math.max(s.interval, 7)) dates.push(ago);
  dates.push(s.lastVisitAgo);
  const uniq = [...new Set(dates)].sort((a, b) => b - a);
  const stages = stagePath(s.stage, uniq.length);
  uniq.forEach((ago, i) => {
    const st = stages[i]!;
    orthoVisitsSeed.push({
      id: `ov${n + 1}-${i + 1}`,
      caseId,
      date: day(-ago).format('YYYY-MM-DD'),
      stage: st,
      work:
        st === 'CONSULTATION'
          ? ['Ko‘rik va maslahat']
          : st === 'DIAGNOSTICS'
            ? ['Panoramik rentgen', 'Qolip olindi']
            : st === 'BONDING'
              ? ['Breketlar o‘rnatildi']
              : st === 'DEBONDING'
                ? ['Breketlar olindi', 'Retainer o‘rnatildi']
                : st === 'RETENTION'
                  ? ['Retainer nazorati']
                  : WORKS[i % WORKS.length]!,
      note: i === uniq.length - 1 && st === 'ADJUSTMENT' ? 'Gigiyena yaxshi, keyingi safar duga 0.018' : undefined,
      doctorId: ORTHO_DOCTOR,
      createdAt: day(-ago).hour(12).toISOString(),
    });
  });

  // Shartnoma hisob-fakturasi va to'lovlar
  if (s.total > 0) {
    const inv: Invoice = {
      id: `inv-o${n + 1}`,
      number: `INV-${start.year()}-${String(++invNo).padStart(4, '0')}`,
      patientId: p.id,
      appointmentId: '',
      orthoCaseId: caseId,
      lines: [{ serviceId: 'sv19', qty: 1, price: s.total, discount: 0 }],
      discount: 0,
      total: s.total,
      paid: 0,
      status: 'UNPAID',
      createdAt: start.hour(11).toISOString(),
    };
    const pay = (amount: number, at: Dayjs, k: number) => {
      const a = Math.min(amount, inv.total - inv.paid);
      if (a <= 0) return;
      orthoPaymentsSeed.push({
        id: `pay-o${n + 1}-${k}`,
        invoiceId: inv.id,
        patientId: p.id,
        amount: a,
        method: METHODS[(n + k) % METHODS.length]!,
        receivedById: 's6',
        createdAt: at.hour(12).toISOString(),
      });
      inv.paid += a;
    };
    if (s.initial) pay(s.initial, start, 0);
    for (let k = 1; k <= s.monthsPaid; k++) pay(s.monthly, start.add(k, 'month'), k);
    // Tugagan davolash — to'liq yopilgan
    if (c.status === 'FINISHED') pay(inv.total - inv.paid, day(-s.lastVisitAgo), 99);
    inv.status = inv.paid >= inv.total ? 'PAID' : inv.paid > 0 ? 'PARTIAL' : 'UNPAID';
    c.invoiceId = inv.id;
    orthoInvoicesSeed.push(inv);
  }
  orthoCasesSeed.push(c);

  if (s.nextIn) {
    const off = workDay(s.nextIn);
    orthoAppointmentsSeed.push({
      id: `a-o${n + 1}`,
      patientId: p.id,
      doctorId: ORTHO_DOCTOR,
      chairId: ORTHO_CHAIR,
      start: dt(off, n % 2 ? '10:00' : '15:00'),
      durationMin: s.stage === 'DIAGNOSTICS' ? 120 : 30,
      serviceIds: ['sv20'],
      status: 'SCHEDULED',
      note: s.stage === 'DIAGNOSTICS' ? 'Breket o‘rnatish' : 'Rejali korreksiya',
      source: 'PHONE',
      reminderEnabled: true,
      createdById: 's6',
      createdAt: day(-s.lastVisitAgo).hour(12).toISOString(),
    });
  }
});
