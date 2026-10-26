import dayjs from '@/shared/lib/dayjs';
import { hasPermission, type Permission } from '@/shared/constants/roles';
import { mockDb } from '@/shared/lib/mock/mockDb';
import { d, dt } from '@/shared/lib/mock/helpers';
import { assert, currentUser, mockRequest } from '@/shared/lib/mock/mockRequest';
import { shortName } from '@/shared/utils/format';
import { CAN_REMAKE, LAB_STATUS, NEXT_STATUS, PENDING_STATUSES, WHOLE_JAW_WORK } from '../constants';
import type { DentalLab, LabOrder, LabOrderInput, LabOrderView, LabStatus, LabStatusEvent } from '../types';

/**
 * Laboratoriya buyurtmalari — mock (modul ichida, sahifa yangilanganda seed'ga qaytadi).
 * Bemor va shifokorlar umumiy mockDb'dan o‘qiladi (faqat o‘qish).
 */
const labs: DentalLab[] = [
  { id: 'l1', name: 'Usta Dental laboratoriyasi', phone: '+998712004455', leadDays: 7 },
  { id: 'l2', name: 'Oq Marvarid dental lab', phone: '+998712337788', leadDays: 10 },
  { id: 'l3', name: 'Zirkon Plus', phone: '+998901112233', leadDays: 5 },
];

const NILUFAR = 'Nilufar Karimova';
const GULNORA = 'Gulnora Saidova';
const MALIKA = 'Malika Usmonova';

const ev = (status: LabStatus, offset: number, byName: string, note?: string, time = '11:00'): LabStatusEvent => ({ status, at: dt(offset, time), byName, note });

type SeedRow = Omit<LabOrder, 'number' | 'createdAt' | 'sentDate' | 'dueDate' | 'returnedAt' | 'history'> & {
  sent?: number;
  due: number;
  returned?: number;
  history: LabStatusEvent[];
};

const rows: SeedRow[] = [
  { id: 'lo1', patientId: 'p1', doctorId: 's2', teeth: [36], workType: 'ZIRCONIA_CROWN', shade: 'A2', labId: 'l1', sent: -9, due: -2, price: 650_000, status: 'IN_WORK', note: 'Gingival chegara — kamtarona, okklyuziyani tekshirish',
    history: [ev('SENT', -9, NILUFAR, 'Qolip va rang fotosurati yuborildi'), ev('IN_WORK', -8, GULNORA, 'Laboratoriya qabul qildi')] },
  { id: 'lo2', patientId: 'p2', doctorId: 's2', teeth: [11, 21], workType: 'VENEER', shade: 'A1', labId: 'l3', sent: -6, due: 1, price: 1_400_000, status: 'IN_WORK',
    history: [ev('SENT', -6, NILUFAR), ev('IN_WORK', -5, GULNORA)] },
  { id: 'lo3', patientId: 'p3', doctorId: 's3', teeth: [46], workType: 'IMPLANT_CROWN', shade: 'A3', labId: 'l1', sent: -12, due: -4, price: 900_000, status: 'SENT', note: 'Abatment bilan birga yuborildi',
    history: [ev('SENT', -12, 'Jasur Toshmatov', 'Skan-bodi va abatment')] },
  { id: 'lo4', patientId: 'p4', doctorId: 's7', teeth: [], workType: 'ALIGNER', labId: 'l2', sent: -15, due: -1, returned: -1, price: 4_500_000, status: 'RETURNED', note: '1–6 bosqich elaynerlar, yuqori va pastki jag‘',
    history: [ev('SENT', -15, 'Kamola Nazarova'), ev('IN_WORK', -13, MALIKA), ev('RETURNED', -1, GULNORA, 'Kuryer orqali keldi')] },
  { id: 'lo5', patientId: 'p5', doctorId: 's2', teeth: [14, 15, 16], workType: 'BRIDGE', shade: 'A3.5', labId: 'l1', sent: -5, due: 3, price: 1_050_000, status: 'IN_WORK',
    history: [ev('SENT', -5, NILUFAR), ev('IN_WORK', -4, MALIKA)] },
  { id: 'lo6', patientId: 'p6', doctorId: 's2', teeth: [25], workType: 'PFM_CROWN', shade: 'A2', labId: 'l2', due: 7, price: 350_000, status: 'NEW', note: 'Qolip ertaga olinadi',
    history: [ev('NEW', 0, NILUFAR, undefined, '09:30')] },
  { id: 'lo7', patientId: 'p7', doctorId: 's2', teeth: [], workType: 'DENTURE', labId: 'l2', sent: -20, due: -10, returned: -11, price: 1_800_000, status: 'FITTED', note: 'Pastki jag‘, to‘liq olinadigan protez',
    history: [ev('SENT', -20, NILUFAR), ev('IN_WORK', -19, GULNORA), ev('RETURNED', -11, GULNORA), ev('FITTED', -8, NILUFAR, 'Moslashtirildi, 2 haftadan keyin nazorat')] },
  { id: 'lo8', patientId: 'p8', doctorId: 's1', teeth: [], workType: 'NIGHT_GUARD', labId: 'l3', sent: -3, due: 4, price: 300_000, status: 'SENT', note: 'Bruksizm — yuqori jag‘ uchun',
    history: [ev('SENT', -3, 'Aziz Rahimov')] },
  { id: 'lo9', patientId: 'p9', doctorId: 's2', teeth: [26], workType: 'ZIRCONIA_CROWN', shade: 'A3.5', labId: 'l3', sent: -14, due: 2, returned: -7, price: 650_000, status: 'REMAKE',
    history: [ev('SENT', -14, NILUFAR), ev('IN_WORK', -13, GULNORA), ev('RETURNED', -7, GULNORA), ev('REMAKE', -6, NILUFAR, 'Rang mos kelmadi: A3 o‘rniga A3.5')] },
  { id: 'lo10', patientId: 'p10', doctorId: 's2', teeth: [12, 11, 21, 22], workType: 'VENEER', shade: 'B1', labId: 'l3', sent: -10, due: -3, price: 2_800_000, status: 'IN_WORK', note: 'Mock-up tasdiqlangan, foto protokol ilova qilingan',
    history: [ev('SENT', -10, NILUFAR), ev('IN_WORK', -9, MALIKA)] },
  { id: 'lo11', patientId: 'p11', doctorId: 's3', teeth: [36], workType: 'IMPLANT_CROWN', shade: 'A3', labId: 'l1', sent: -18, due: -9, returned: -10, price: 900_000, status: 'FITTED',
    history: [ev('SENT', -18, 'Jasur Toshmatov'), ev('IN_WORK', -17, GULNORA), ev('RETURNED', -10, GULNORA), ev('FITTED', -7, 'Jasur Toshmatov')] },
  { id: 'lo12', patientId: 'p12', doctorId: 's2', teeth: [24], workType: 'PFM_CROWN', shade: 'A2', labId: 'l1', sent: -8, due: 0, returned: 0, price: 350_000, status: 'RETURNED',
    history: [ev('SENT', -8, NILUFAR), ev('IN_WORK', -7, MALIKA), ev('RETURNED', 0, GULNORA, 'Bemorga qo‘ng‘iroq qilish kerak', '10:15')] },
  { id: 'lo13', patientId: 'p13', doctorId: 's1', teeth: [47], workType: 'PFM_CROWN', shade: 'A3', labId: 'l2', due: 6, price: 350_000, status: 'NEW',
    history: [ev('NEW', -1, 'Aziz Rahimov', undefined, '16:40')] },
];

const db: LabOrder[] = rows.map(({ sent, due, returned, ...r }, i) => ({
  ...r,
  number: `LB-${String(241 + i).padStart(4, '0')}`,
  sentDate: sent === undefined ? undefined : d(sent),
  dueDate: d(due),
  returnedAt: returned === undefined ? undefined : dt(returned, '10:00'),
  createdAt: r.history[0]?.at ?? dt(0),
}));

/* ---------- yordamchilar ---------- */

const can = (perm: Permission) => {
  const user = currentUser();
  assert(hasPermission(user.role, perm), 'Bu amal uchun ruxsat yo‘q', 403);
  return user;
};

const actorName = (staffId: string) => mockDb.staff.find((s) => s.id === staffId)?.fullName ?? 'Xodim';

const toView = (o: LabOrder): LabOrderView => {
  const p = mockDb.patients.find((x) => x.id === o.patientId);
  const daysLeft = dayjs(o.dueDate).startOf('day').diff(dayjs().startOf('day'), 'day');
  return {
    ...o,
    patientName: shortName(p),
    patientCardNo: p?.cardNo ?? '',
    patientPhone: p?.phone ?? '',
    doctorName: actorName(o.doctorId),
    labName: labs.find((l) => l.id === o.labId)?.name ?? '—',
    overdue: PENDING_STATUSES.includes(o.status) && daysLeft < 0,
    daysLeft,
  };
};

/** Bajarilmaganlar muddat bo‘yicha (eng shoshilinchi tepada), o‘rnatilganlar oxirida */
const sortOrders = (a: LabOrderView, b: LabOrderView) => {
  const fa = a.status === 'FITTED' ? 1 : 0;
  const fb = b.status === 'FITTED' ? 1 : 0;
  if (fa !== fb) return fa - fb;
  return fa ? b.dueDate.localeCompare(a.dueDate) : a.dueDate.localeCompare(b.dueDate);
};

const validate = (input: LabOrderInput) => {
  assert(mockDb.patients.some((p) => p.id === input.patientId), 'Bemorni tanlang');
  assert(mockDb.staff.some((s) => s.id === input.doctorId && s.position === 'DOCTOR'), 'Shifokorni tanlang');
  assert(labs.some((l) => l.id === input.labId), 'Laboratoriyani tanlang');
  assert(WHOLE_JAW_WORK.includes(input.workType) || input.teeth.length > 0, 'Tish raqamini tanlang');
  assert(!!input.dueDate, 'Qaytish muddatini kiriting');
  assert(!input.sentDate || input.dueDate >= input.sentDate, 'Qaytish muddati yuborilgan sanadan oldin bo‘lmasin');
  assert(input.price >= 0, 'Narx manfiy bo‘lmasin');
};

export const labApi = {
  // GET /api/lab/labs
  labs: () => mockRequest(() => labs, 150),

  // GET /api/lab/orders?patientId=
  list: (patientId?: string) =>
    mockRequest(() => {
      can('lab.view');
      return db
        .filter((o) => !patientId || o.patientId === patientId)
        .map(toView)
        .sort(sortOrders);
    }, 250),

  // POST/PUT /api/lab/orders
  save: (input: LabOrderInput, id?: string) =>
    mockRequest(() => {
      const user = can('lab.manage');
      validate(input);
      const clean: LabOrderInput = { ...input, shade: input.shade || undefined, note: input.note?.trim() || undefined };
      if (id) {
        const o = db.find((x) => x.id === id);
        assert(o, 'Buyurtma topilmadi', 404);
        Object.assign(o, clean);
        return toView(o);
      }
      const now = new Date().toISOString();
      const sentNow = !!clean.sentDate && clean.sentDate <= dayjs().format('YYYY-MM-DD');
      const o: LabOrder = {
        ...clean,
        id: `lo${db.length + 1}`,
        number: `LB-${String(241 + db.length).padStart(4, '0')}`,
        status: sentNow ? 'SENT' : 'NEW',
        history: [{ status: sentNow ? 'SENT' : 'NEW', at: now, byName: actorName(user.staffId) }],
        createdAt: now,
      };
      db.unshift(o);
      return toView(o);
    }),

  // POST /api/lab/orders/:id/status
  setStatus: (id: string, status: LabStatus, extra: { note?: string; dueDate?: string } = {}) =>
    mockRequest(() => {
      const user = can('lab.manage');
      const o = db.find((x) => x.id === id);
      assert(o, 'Buyurtma topilmadi', 404);
      const allowed = NEXT_STATUS[o.status]?.to === status || (status === 'REMAKE' && CAN_REMAKE.includes(o.status));
      assert(allowed, `“${LAB_STATUS[o.status].label}” bosqichidan “${LAB_STATUS[status].label}”ga o‘tib bo‘lmaydi`);
      if (status === 'REMAKE') assert(extra.note?.trim(), 'Qayta ishlash sababini yozing');
      const now = new Date().toISOString();
      if (status === 'SENT' && !o.sentDate) o.sentDate = dayjs().format('YYYY-MM-DD');
      if (status === 'RETURNED') o.returnedAt = now;
      if (extra.dueDate) o.dueDate = extra.dueDate;
      o.status = status;
      o.history.push({ status, at: now, byName: actorName(user.staffId), note: extra.note?.trim() || undefined });
      return toView(o);
    }, 250),
};
