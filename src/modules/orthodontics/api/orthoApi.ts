import dayjs from '@/shared/lib/dayjs';
import { mockDb } from '@/shared/lib/mock/mockDb';
import { assert, currentUser, matches, mockRequest } from '@/shared/lib/mock/mockRequest';
import { uid } from '@/shared/lib/mock/helpers';
import { findPatient, staffName } from '@/shared/lib/mock/ops/lookup';
import { nextInvoiceNumber, recomputeInvoice } from '@/shared/lib/mock/ops/clinicalOps';
import { activeOrthoCase, orthoCaseView, orthoSchedule } from '@/shared/lib/mock/ops/orthoOps';
import { hasPermission } from '@/shared/constants/roles';
import { formatMoney } from '@/shared/utils/format';
import type { Invoice } from '@/modules/billing/types';
import {
  ORTHO_STAGES,
  type OrthoCase,
  type OrthoCaseDetail,
  type OrthoCaseInput,
  type OrthoCaseView,
  type OrthoFilters,
  type OrthoStage,
  type OrthoStats,
  type OrthoStatus,
  type OrthoVisit,
  type OrthoVisitInput,
  type OrthoVisitView,
} from '../types';

/** Shartnoma xizmati — "Ortodontik davolash (to'liq kurs)" */
const CONTRACT_SERVICE = 'sv19';

const findCase = (id: string) => {
  const c = mockDb.orthoCases.find((x) => x.id === id);
  assert(c, 'Breket davolashi topilmadi', 404);
  return c;
};

const requireManage = () => {
  const user = currentUser();
  assert(hasPermission(user.role, 'ortho.manage'), 'Bu amal uchun ruxsat yo‘q', 403);
  return user;
};

const validate = (input: OrthoCaseInput) => {
  assert(input.patientId, 'Bemorni tanlang');
  assert(input.doctorId, 'Shifokorni tanlang');
  assert(input.plannedMonths > 0, 'Davolash muddatini kiriting');
  assert(input.visitIntervalDays >= 7, 'Tashriflar oralig‘i kamida 7 kun bo‘lsin');
  assert(input.totalPrice >= 0 && input.initialPayment >= 0 && input.monthlyPayment >= 0, 'Summalar manfiy bo‘lmasin');
  assert(input.initialPayment <= input.totalPrice, 'Boshlang‘ich to‘lov umumiy summadan oshmasin');
  if (input.totalPrice > input.initialPayment) assert(input.monthlyPayment > 0, 'Oylik to‘lov miqdorini kiriting');
};

/** Shartnoma hisob-fakturasini yaratish yoki summasini yangilash */
const syncInvoice = (c: OrthoCase) => {
  const inv = c.invoiceId ? mockDb.invoices.find((i) => i.id === c.invoiceId) : undefined;
  if (inv) {
    assert(c.totalPrice >= inv.paid, `Umumiy summa to‘langan summadan (${formatMoney(inv.paid)}) kam bo‘lmasin`);
    inv.lines = [{ serviceId: CONTRACT_SERVICE, qty: 1, price: c.totalPrice, discount: 0 }];
    recomputeInvoice(inv);
    return;
  }
  if (c.totalPrice <= 0) return;
  const created: Invoice = {
    id: uid('inv'),
    number: nextInvoiceNumber(),
    patientId: c.patientId,
    appointmentId: '',
    orthoCaseId: c.id,
    lines: [{ serviceId: CONTRACT_SERVICE, qty: 1, price: c.totalPrice, discount: 0 }],
    discount: 0,
    total: 0,
    paid: 0,
    status: 'UNPAID',
    createdAt: new Date().toISOString(),
  };
  recomputeInvoice(created);
  mockDb.invoices.push(created);
  c.invoiceId = created.id;
};

const visitView = (v: OrthoVisit): OrthoVisitView => ({
  ...v,
  doctorName: staffName(v.doctorId),
  photos: mockDb.patientFiles
    .filter((f) => f.orthoVisitId === v.id)
    .map((f) => ({ id: f.id, url: f.url, name: f.name, kind: f.photoKind ?? 'PROGRESS', createdAt: f.createdAt })),
});

const filterViews = (f: OrthoFilters): OrthoCaseView[] => {
  const status = f.status ?? 'ACTIVE';
  return mockDb.orthoCases
    .filter((c) => status === 'ALL' || c.status === status)
    .filter((c) => !f.stage || c.stage === f.stage)
    .filter((c) => !f.doctor || c.doctorId === f.doctor)
    .map(orthoCaseView)
    .filter((v) => {
      const p = mockDb.patients.find((x) => x.id === v.patientId);
      return matches(f.q, v.patientName, p?.phone, p?.cardNo);
    })
    .filter((v) => !f.overdue || v.overdueDays > 0)
    .filter((v) => !f.debt || v.paymentOverdue)
    // Avval kelmayotganlar (eng ko'p kechikkan), keyin to'lovi kechikkanlar
    .sort((a, b) => b.overdueDays - a.overdueDays || Number(b.paymentOverdue) - Number(a.paymentOverdue) || a.patientName.localeCompare(b.patientName));
};

export const orthoApi = {
  // GET /api/ortho/cases?q=&stage=&doctor=&status=&overdue=&debt=
  list: (f: OrthoFilters) =>
    mockRequest(() => {
      currentUser();
      return filterViews(f);
    }),

  // GET /api/ortho/stats
  stats: () =>
    mockRequest((): OrthoStats => {
      currentUser();
      const active = mockDb.orthoCases.filter((c) => c.status === 'ACTIVE').map(orthoCaseView);
      const weekEnd = dayjs().add(7, 'day').endOf('day');
      return {
        active: active.length,
        overdue: active.filter((v) => v.overdueDays > 0).length,
        paymentOverdue: active.filter((v) => v.paymentOverdue).length,
        thisWeek: active.filter((v) => v.nextAppointment && dayjs(v.nextAppointment).isBefore(weekEnd)).length,
      };
    }, 200),

  // GET /api/ortho/cases/:id
  get: (id: string) =>
    mockRequest((): OrthoCaseDetail => {
      currentUser();
      const c = findCase(id);
      const view = orthoCaseView(c);
      return {
        ...view,
        visits: mockDb.orthoVisits
          .filter((v) => v.caseId === c.id)
          .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
          .map(visitView),
        schedule: orthoSchedule(c, view.paid),
      };
    }),

  // GET /api/patients/:id/ortho — bemor kartasi uchun (yo'q bo'lsa null)
  byPatient: (patientId: string) =>
    mockRequest(() => {
      currentUser();
      const c = activeOrthoCase(patientId);
      return c ? orthoCaseView(c) : null;
    }, 150),

  // POST /api/ortho/cases
  create: (input: OrthoCaseInput) =>
    mockRequest(() => {
      requireManage();
      validate(input);
      const patient = findPatient(input.patientId);
      const existing = mockDb.orthoCases.find((c) => c.patientId === input.patientId && c.status !== 'FINISHED');
      assert(!existing, 'Bu bemorda breket davolashi allaqachon bor — uni oching', 409);
      const c: OrthoCase = { ...input, status: input.status ?? 'ACTIVE', id: uid('oc'), createdAt: new Date().toISOString() };
      syncInvoice(c);
      mockDb.orthoCases.push(c);
      // Umumiy bemorlar ro'yxatida "Breket" belgisi
      if (!patient.tags.includes('ORTHO')) patient.tags = [...patient.tags, 'ORTHO'];
      return orthoCaseView(c);
    }),

  // PUT /api/ortho/cases/:id
  update: (id: string, input: OrthoCaseInput) =>
    mockRequest(() => {
      requireManage();
      validate(input);
      const c = findCase(id);
      const next: OrthoCase = { ...c, ...input, patientId: c.patientId, status: input.status ?? c.status };
      syncInvoice(next);
      Object.assign(c, next);
      return orthoCaseView(c);
    }),

  // PATCH /api/ortho/cases/:id/stage
  setStage: (id: string, stage: OrthoStage) =>
    mockRequest(() => {
      requireManage();
      assert(ORTHO_STAGES.includes(stage), 'Noto‘g‘ri bosqich');
      const c = findCase(id);
      c.stage = stage;
      return orthoCaseView(c);
    }),

  // PATCH /api/ortho/cases/:id/status
  setStatus: (id: string, status: OrthoStatus) =>
    mockRequest(() => {
      requireManage();
      const c = findCase(id);
      c.status = status;
      return orthoCaseView(c);
    }),

  // POST /api/ortho/auto-call — kelmayotganlarga avtomatik qo'ng'iroq (mock: natija tasodifiy)
  autoCall: (ids: string[]) =>
    mockRequest(() => {
      const user = requireManage();
      assert(ids.length > 0, 'Qo‘ng‘iroq qilinadigan bemor yo‘q');
      const RESULTS = [
        { note: 'Tasdiqladi — qabulga yozish kerak', wants: true },
        { note: 'Javob bermadi', wants: false },
        { note: 'Band', wants: false },
        { note: 'Keyinroq qo‘ng‘iroq qilishni so‘radi', wants: false },
      ];
      const now = new Date().toISOString();
      return ids.map((id) => {
        const c = findCase(id);
        const r = RESULTS[Math.floor(Math.random() * RESULTS.length)]!;
        c.lastContact = { at: now, note: `Avtomatik qo‘ng‘iroq: ${r.note}`, byId: user.staffId };
        const v = orthoCaseView(c);
        // Bemor rozi bo'lsa — registratura uchun vazifa (bildirishnomalarda)
        if (r.wants) {
          mockDb.tasks.push({
            id: uid('task'),
            kind: 'ORTHO_OVERDUE',
            title: `${v.patientName} breket korreksiyasiga yozilmoqchi`,
            description: 'Avtomatik qo‘ng‘iroqda tasdiqladi — qabulga yozing',
            at: now,
            link: `/orthodontics/${c.id}`,
            done: false,
          });
        }
        return { id, patientName: v.patientName, result: r.note, wants: r.wants };
      });
    }, 1200),

  // POST /api/ortho/cases/:id/contact — registratura qo'ng'iroq qildi
  logContact: (id: string, note: string) =>
    mockRequest(() => {
      const user = requireManage();
      assert(note?.trim(), 'Qo‘ng‘iroq natijasini yozing');
      const c = findCase(id);
      c.lastContact = { at: new Date().toISOString(), note: note.trim(), byId: user.staffId };
      return orthoCaseView(c);
    }),

  // POST /api/ortho/cases/:id/visits (multipart — rasmlar bilan)
  addVisit: (input: OrthoVisitInput) =>
    mockRequest(() => {
      const user = currentUser();
      assert(hasPermission(user.role, 'ortho.visit'), 'Korreksiya kiritish uchun ruxsat yo‘q', 403);
      const c = findCase(input.caseId);
      assert(input.work.length > 0 || input.note?.trim(), 'Nima qilinganini tanlang yoki izoh yozing');
      assert(!dayjs(input.date).isAfter(dayjs(), 'day'), 'Kelajakdagi sana bilan korreksiya yozib bo‘lmaydi');
      for (const ph of input.photos) assert(ph.file.size <= 20 * 1024 * 1024, `${ph.file.name}: hajmi 20 MB dan katta`);
      const now = new Date().toISOString();
      const v: OrthoVisit = {
        id: uid('ov'),
        caseId: c.id,
        date: dayjs(input.date).format('YYYY-MM-DD'),
        stage: input.stage,
        work: input.work,
        note: input.note?.trim() || undefined,
        doctorId: user.role === 'DOCTOR' ? user.staffId : c.doctorId,
        createdAt: now,
      };
      mockDb.orthoVisits.push(v);
      for (const ph of input.photos) {
        mockDb.patientFiles.push({
          id: uid('f'),
          patientId: c.patientId,
          name: ph.file.name,
          url: URL.createObjectURL(ph.file),
          mime: ph.file.type || 'image/jpeg',
          size: ph.file.size,
          note: `Breket · ${dayjs(v.date).format('DD.MM.YYYY')}`,
          uploadedById: user.staffId,
          createdAt: now,
          orthoVisitId: v.id,
          photoKind: ph.kind,
        });
      }
      // Bosqich oldinga siljisa — davolash bosqichi ham yangilanadi
      if (ORTHO_STAGES.indexOf(input.stage) > ORTHO_STAGES.indexOf(c.stage)) c.stage = input.stage;
      return visitView(v);
    }, 500),
};
