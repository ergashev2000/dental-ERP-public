import dayjs from '@/shared/lib/dayjs';
import { hasPermission, type Permission } from '@/shared/constants/roles';
import { mockDb } from '@/shared/lib/mock/mockDb';
import { dt } from '@/shared/lib/mock/helpers';
import { assert, currentUser, mockRequest } from '@/shared/lib/mock/mockRequest';
import { fullName } from '@/shared/utils/format';
import { docTemplate, fillTemplate } from '../templates';
import type { DocTemplateKey, DocumentContext, DocumentInput, DocumentView, PatientDocument } from '../types';

/**
 * Bemor hujjatlari (rozilik, shartnoma, retsept) — mock, modul ichida saqlanadi.
 * Bemor, xodim va klinika ma'lumotlari umumiy mockDb'dan faqat o‘qiladi.
 */

const staffName = (id?: string) => mockDb.staff.find((s) => s.id === id)?.fullName ?? '';

/** Seed uchun imzo rasmi (oddiy chiziq) — img ichida currentColor qora bo‘lib chiziladi */
const seedSignature = (d: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  )}`;

const seedDoc = (
  id: string,
  patientId: string,
  templateKey: DocTemplateKey,
  doctorId: string,
  offset: number,
  opts: { teeth?: number[]; price?: number; sign?: string; by?: string } = {},
): PatientDocument => {
  const t = docTemplate(templateKey);
  const p = mockDb.patients.find((x) => x.id === patientId);
  const at = dt(offset, '10:20');
  const body = fillTemplate(t.body, {
    bemor: fullName(p),
    sana: dayjs(at).format('DD.MM.YYYY'),
    shifokor: staffName(doctorId),
    klinika: mockDb.clinic.name,
    teeth: opts.teeth,
    price: opts.price,
  });
  return {
    id,
    number: `HJ-${id.replace(/\D/g, '').padStart(4, '0')}`,
    patientId,
    templateKey,
    title: t.title,
    body,
    doctorId,
    teeth: opts.teeth ?? [],
    price: opts.price,
    status: opts.sign ? 'SIGNED' : 'DRAFT',
    createdAt: at,
    createdByName: opts.by ?? 'Gulnora Saidova',
    signedAt: opts.sign ? dt(offset, '10:31') : undefined,
    signature: opts.sign ? seedSignature(opts.sign) : undefined,
    acknowledged: !!opts.sign,
  };
};

const SIG_A = 'M12 52 C 28 12, 40 70, 58 38 S 88 18, 100 50 S 138 62, 152 30 S 196 46, 228 34';
const SIG_B = 'M14 46 C 30 20, 52 22, 48 48 S 70 66, 92 36 L 104 58 C 120 20, 150 24, 170 44 S 210 50, 226 28';
const SIG_C = 'M16 40 Q 40 8, 54 44 T 96 42 C 112 30, 120 60, 140 44 S 176 20, 196 48 L 224 40';

let db: PatientDocument[] | null = null;
/** mockDb.patients tayyor bo‘lgach (birinchi so‘rovda) seed yaratiladi */
const store = () =>
  (db ??= [
    seedDoc('d1', 'p1', 'GENERAL_CONSENT', 's1', -420, { sign: SIG_A }),
    seedDoc('d2', 'p1', 'EXTRACTION_CONSENT', 's3', -1, { teeth: [38] }),
    seedDoc('d3', 'p3', 'GENERAL_CONSENT', 's3', -95, { sign: SIG_B }),
    seedDoc('d4', 'p3', 'IMPLANT_CONSENT', 's3', -90, { teeth: [46], price: 6_500_000, sign: SIG_B, by: 'Jasur Toshmatov' }),
    seedDoc('d5', 'p4', 'BRACES_CONTRACT', 's7', -120, { price: 12_000_000, sign: SIG_C, by: 'Kamola Nazarova' }),
    seedDoc('d6', 'p11', 'IMPLANT_CONSENT', 's3', -75, { teeth: [36], price: 6_500_000, sign: SIG_A, by: 'Jasur Toshmatov' }),
  ]);

const can = (perm: Permission) => {
  const user = currentUser();
  assert(hasPermission(user.role, perm), 'Bu amal uchun ruxsat yo‘q', 403);
  return user;
};

const toView = (d: PatientDocument): DocumentView => ({ ...d, doctorName: staffName(d.doctorId) || '—' });

export const documentsApi = {
  // GET /api/patients/:id/documents/context — shablonni to'ldirish uchun
  context: (patientId: string) =>
    mockRequest((): DocumentContext => {
      const user = can('patient.view');
      const p = mockDb.patients.find((x) => x.id === patientId);
      assert(p, 'Bemor topilmadi', 404);
      const me = mockDb.staff.find((s) => s.id === user.staffId);
      const lastVisit = mockDb.appointments
        .filter((a) => a.patientId === patientId && a.start <= new Date().toISOString())
        .sort((a, b) => b.start.localeCompare(a.start))[0];
      return {
        patientName: fullName(p),
        patientCardNo: p.cardNo,
        clinicName: mockDb.clinic.name,
        clinicAddress: mockDb.clinic.address,
        clinicPhone: mockDb.clinic.phone,
        defaultDoctorId: me?.position === 'DOCTOR' ? me.id : lastVisit?.doctorId,
      };
    }, 150),

  // GET /api/patients/:id/documents
  list: (patientId: string) =>
    mockRequest(() => {
      can('patient.view');
      return store()
        .filter((d) => d.patientId === patientId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(toView);
    }, 200),

  // POST/PUT /api/patients/:id/documents — imzo berilsa, hujjat "Imzolangan" bo'ladi
  save: (input: DocumentInput, id?: string) =>
    mockRequest(() => {
      const user = can('document.manage');
      assert(mockDb.patients.some((p) => p.id === input.patientId), 'Bemor topilmadi', 404);
      assert(mockDb.staff.some((s) => s.id === input.doctorId), 'Shifokorni tanlang');
      assert(input.body.trim().length >= 10, 'Hujjat matni bo‘sh');
      if (input.signature) {
        assert(input.signature.startsWith('data:image/'), 'Imzo noto‘g‘ri');
        assert(input.acknowledged, 'Bemor hujjat bilan tanishib chiqqanini belgilang');
      }
      const list = store();
      const now = new Date().toISOString();
      const patch: Partial<PatientDocument> = {
        templateKey: input.templateKey,
        title: docTemplate(input.templateKey).title,
        body: input.body.trim(),
        doctorId: input.doctorId,
        teeth: input.teeth,
        price: input.price || undefined,
        ...(input.signature ? { status: 'SIGNED' as const, signature: input.signature, signedAt: now, acknowledged: true } : {}),
      };
      if (id) {
        const d = list.find((x) => x.id === id);
        assert(d, 'Hujjat topilmadi', 404);
        assert(d.status === 'DRAFT', 'Imzolangan hujjatni o‘zgartirib bo‘lmaydi');
        Object.assign(d, patch);
        return toView(d);
      }
      const n = Math.max(0, ...list.map((x) => Number(x.id.slice(1)) || 0)) + 1;
      const d: PatientDocument = {
        id: `d${n}`,
        number: `HJ-${String(n).padStart(4, '0')}`,
        patientId: input.patientId,
        status: 'DRAFT',
        acknowledged: false,
        createdAt: now,
        createdByName: staffName(user.staffId) || 'Xodim',
        ...(patch as Pick<PatientDocument, 'templateKey' | 'title' | 'body' | 'doctorId' | 'teeth'>),
      };
      list.unshift(d);
      return toView(d);
    }, 300),

  // DELETE /api/documents/:id — faqat qoralama
  removeDraft: (id: string) =>
    mockRequest(() => {
      can('document.manage');
      const list = store();
      const i = list.findIndex((x) => x.id === id);
      assert(i >= 0, 'Hujjat topilmadi', 404);
      assert(list[i]!.status === 'DRAFT', 'Imzolangan hujjatni o‘chirib bo‘lmaydi');
      list.splice(i, 1);
      return { id };
    }, 200),
};
