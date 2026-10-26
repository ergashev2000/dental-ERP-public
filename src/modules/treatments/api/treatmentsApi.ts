import { mockDb } from '@/shared/lib/mock/mockDb';
import { ApiError, assert, currentUser, mockRequest } from '@/shared/lib/mock/mockRequest';
import { findPatient, findService, staffName } from '@/shared/lib/mock/ops/lookup';
import { getToothRecord } from '@/shared/lib/mock/ops/clinicalOps';
import { uid } from '@/shared/lib/mock/helpers';
import { hasPermission } from '@/shared/constants/roles';
import type { PlanItemInput, PlanItemStatus, PlanItemView, TreatmentPlanItem } from '../types';

const toView = (t: TreatmentPlanItem): PlanItemView => {
  const s = mockDb.services.find((x) => x.id === t.serviceId);
  return {
    ...t,
    serviceName: s?.name ?? '—',
    serviceCode: s?.code ?? '',
    doctorName: staffName(t.doctorId),
    total: Math.round(t.price * (1 - t.discount / 100)),
  };
};

const requireEditor = () => {
  const user = currentUser();
  if (!hasPermission(user.role, 'treatment.edit')) throw new ApiError(403, 'Davolash rejasini tahrirlash uchun ruxsat yo‘q');
  return user;
};

const findItem = (id: string) => {
  const t = mockDb.treatmentPlans.find((x) => x.id === id);
  if (!t) throw new ApiError(404, 'Reja qatori topilmadi');
  return t;
};

/** 10-qoida: yo'q tishga faqat implant yoki ortopediya */
const validateTooth = (patientId: string, tooth: number | undefined, serviceId: string) => {
  const s = findService(serviceId);
  if (s.perTooth) assert(tooth, `"${s.name}" uchun tish tanlash majburiy`);
  if (!tooth) return;
  const rec = getToothRecord(patientId, tooth);
  if (rec?.conditions.includes('MISSING')) {
    assert(
      s.code === 'S203' || s.category === 'Ortopediya',
      `${tooth}-tish yo‘q: faqat implant yoki ortopediya xizmati qo‘shiladi`,
    );
  }
};

export const treatmentsApi = {
  // GET /api/patients/:id/treatment-plan
  list: (patientId: string) =>
    mockRequest(() => {
      currentUser();
      findPatient(patientId);
      return mockDb.treatmentPlans
        .filter((t) => t.patientId === patientId)
        .sort((a, b) => a.stage - b.stage || a.createdAt.localeCompare(b.createdAt))
        .map(toView);
    }, 250),

  // POST /api/patients/:id/treatment-plan
  add: (input: PlanItemInput) =>
    mockRequest(() => {
      requireEditor();
      validateTooth(input.patientId, input.tooth, input.serviceId);
      assert(input.discount >= 0 && input.discount <= 100, 'Chegirma 0–100% oralig‘ida bo‘lsin');
      const t: TreatmentPlanItem = { ...input, id: uid('tp'), status: 'PLANNED', createdAt: new Date().toISOString() };
      mockDb.treatmentPlans.push(t);
      return toView(t);
    }),

  // PUT /api/treatment-plan/:id
  update: (id: string, patch: Partial<Pick<TreatmentPlanItem, 'stage' | 'price' | 'discount' | 'doctorId' | 'tooth'>>) =>
    mockRequest(() => {
      requireEditor();
      const t = findItem(id);
      assert(t.status !== 'DONE', 'Bajarilgan qatorni o‘zgartirib bo‘lmaydi');
      if (patch.tooth !== undefined) validateTooth(t.patientId, patch.tooth, t.serviceId);
      Object.assign(t, patch);
      return toView(t);
    }),

  // PATCH /api/treatment-plan/:id/status
  setStatus: (id: string, status: PlanItemStatus) =>
    mockRequest(() => {
      const user = requireEditor();
      const t = findItem(id);
      assert(t.status !== 'DONE' && t.status !== 'CANCELLED', 'Bu qatorning holati yakuniy');
      if (status === 'DONE') assert(hasPermission(user.role, 'treatment.complete'), 'Ruxsat yo‘q', 403);
      t.status = status;
      return toView(t);
    }),
};
