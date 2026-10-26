import { mockDb } from '@/shared/lib/mock/mockDb';
import { ApiError, assert, currentUser, matches, mockRequest, paginate } from '@/shared/lib/mock/mockRequest';
import { findPatient, lastVisit, nextAppointment, patientDebt } from '@/shared/lib/mock/ops/lookup';
import { uid } from '@/shared/lib/mock/helpers';
import { fullName, isValidUzPhone, normalizePhone, shortName } from '@/shared/utils/format';
import type { Patient, PatientFile, PatientFilters, PatientInput, PatientRow } from '../types';

const toRow = (p: Patient): PatientRow => ({
  ...p,
  debt: patientDebt(p.id),
  lastVisit: lastVisit(p.id),
  nextAppointment: nextAppointment(p.id),
});

const phoneOwner = (phone: string, excludeId?: string) => {
  const n = normalizePhone(phone);
  return mockDb.patients.find((p) => p.id !== excludeId && (p.phone === n || p.phone2 === n));
};

/** 8-qoida: telefon raqam unikal */
const validate = (input: PatientInput, excludeId?: string) => {
  assert(input.firstName.trim() && input.lastName.trim(), 'Ism va familiyani kiriting');
  assert(isValidUzPhone(input.phone), 'Telefon raqam formati: +998 90 123 45 67');
  const owner = phoneOwner(input.phone, excludeId);
  if (owner) {
    throw new ApiError(409, `Bu raqam bilan bemor mavjud: ${shortName(owner)} (${owner.cardNo})`, { patientId: owner.id });
  }
  if (input.phone2) assert(isValidUzPhone(input.phone2), 'Qo‘shimcha telefon formati noto‘g‘ri');
};

const clean = (input: PatientInput): PatientInput => ({
  ...input,
  phone: normalizePhone(input.phone),
  phone2: input.phone2 ? normalizePhone(input.phone2) : undefined,
  guardian: input.guardian?.name ? { ...input.guardian, phone: normalizePhone(input.guardian.phone) } : undefined,
  tags: input.tags ?? [],
  allergies: input.allergies ?? [],
  conditions: input.conditions ?? [],
  medications: input.medications ?? [],
});

export const patientsApi = {
  // GET /api/patients?q=&tag=&hasDebt=&doctor=&sort=&page=
  list: (f: PatientFilters) =>
    mockRequest(() => {
      currentUser();
      let rows = mockDb.patients
        .filter((p) => matches(f.q, fullName(p), p.phone, p.phone2, p.cardNo))
        .filter((p) => !f.tag || p.tags.includes(f.tag))
        .filter((p) => !f.doctor || mockDb.appointments.some((a) => a.patientId === p.id && a.doctorId === f.doctor))
        .map(toRow);
      if (f.hasDebt) rows = rows.filter((r) => r.debt > 0);
      const sort = f.sort ?? '-createdAt';
      rows.sort((a, b) => {
        switch (sort) {
          case 'name':
            return fullName(a).localeCompare(fullName(b));
          case '-lastVisit':
            return (b.lastVisit ?? '').localeCompare(a.lastVisit ?? '');
          case '-debt':
            return b.debt - a.debt;
          default:
            return b.createdAt.localeCompare(a.createdAt);
        }
      });
      return paginate(rows, f.page, f.pageSize);
    }),

  // GET /api/patients/search?q= — select va global qidiruv uchun
  search: (q: string, limit = 20) =>
    mockRequest(
      () =>
        mockDb.patients
          .filter((p) => matches(q, fullName(p), p.phone, p.phone2, p.cardNo))
          .slice(0, limit)
          .map(toRow),
      200,
    ),

  // GET /api/patients/:id
  get: (id: string) => mockRequest(() => toRow(findPatient(id))),

  // GET /api/patients/check-phone?phone=
  checkPhone: (phone: string, excludeId?: string) =>
    mockRequest(() => {
      const o = phoneOwner(phone, excludeId);
      return o ? { id: o.id, name: shortName(o), cardNo: o.cardNo } : null;
    }, 150),

  // POST /api/patients
  create: (input: PatientInput) =>
    mockRequest(() => {
      currentUser();
      validate(input);
      const max = mockDb.patients.reduce((m, p) => Math.max(m, Number(p.cardNo.replace(/\D/g, ''))), 100);
      const p: Patient = {
        ...clean(input),
        id: uid('p'),
        cardNo: `P-${String(max + 1).padStart(6, '0')}`,
        createdAt: new Date().toISOString(),
      };
      mockDb.patients.push(p);
      return toRow(p);
    }),

  // PUT /api/patients/:id
  update: (id: string, input: PatientInput) =>
    mockRequest(() => {
      currentUser();
      validate(input, id);
      const p = findPatient(id);
      Object.assign(p, clean(input));
      if (!input.phone2) delete p.phone2;
      if (!input.guardian?.name) delete p.guardian;
      return toRow(p);
    }),

  // GET /api/patients/:id/files
  files: (patientId: string) =>
    mockRequest(() =>
      mockDb.patientFiles.filter((f) => f.patientId === patientId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    ),

  // POST /api/patients/:id/files (multipart)
  uploadFile: (patientId: string, file: File, note?: string) =>
    mockRequest(() => {
      const user = currentUser();
      assert(file.size <= 20 * 1024 * 1024, 'Fayl hajmi 20 MB dan oshmasligi kerak');
      const rec: PatientFile = {
        id: uid('f'),
        patientId,
        name: file.name,
        url: URL.createObjectURL(file),
        mime: file.type || 'application/octet-stream',
        size: file.size,
        note,
        uploadedById: user.staffId,
        createdAt: new Date().toISOString(),
      };
      mockDb.patientFiles.push(rec);
      return rec;
    }, 600),

  // PATCH /api/patients/:id/files/:fileId
  updateFileNote: (fileId: string, note: string) =>
    mockRequest(() => {
      const f = mockDb.patientFiles.find((x) => x.id === fileId);
      assert(f, 'Fayl topilmadi', 404);
      f.note = note;
      return f;
    }),

  // DELETE /api/patients/:id/files/:fileId
  deleteFile: (fileId: string) =>
    mockRequest(() => {
      const i = mockDb.patientFiles.findIndex((x) => x.id === fileId);
      assert(i >= 0, 'Fayl topilmadi', 404);
      mockDb.patientFiles.splice(i, 1);
      return true;
    }),
};
