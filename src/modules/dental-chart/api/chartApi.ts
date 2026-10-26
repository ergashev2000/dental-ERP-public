import { mockDb } from '@/shared/lib/mock/mockDb';
import { assert, currentUser, mockRequest } from '@/shared/lib/mock/mockRequest';
import { findPatient, staffName } from '@/shared/lib/mock/ops/lookup';
import { getToothRecord, writeTooth } from '@/shared/lib/mock/ops/clinicalOps';
import { hasPermission } from '@/shared/constants/roles';
import { isValidTooth } from '@/shared/utils/fdi';
import type { ToothCondition, ToothHistoryView, ToothPatch } from '../types';

const EXCLUSIVE: ToothCondition[] = ['MISSING', 'IMPLANT'];

/** MISSING va IMPLANT boshqa holatlar bilan birga kelmaydi */
const validateConditions = (conditions: ToothCondition[]) => {
  const exclusive = conditions.filter((c) => EXCLUSIVE.includes(c));
  assert(exclusive.length <= 1, '“Yo‘q” va “Implant” birga belgilanmaydi');
  if (exclusive.length) {
    const others = conditions.filter((c) => !EXCLUSIVE.includes(c) && c !== 'HEALTHY');
    const allowed: ToothCondition[] = exclusive[0] === 'MISSING' ? ['PLANNED'] : ['CROWN', 'PLANNED'];
    assert(
      others.every((c) => allowed.includes(c)),
      exclusive[0] === 'MISSING' ? '“Yo‘q” tishga faqat “Rejalashtirilgan” belgisi qo‘shiladi' : 'Implantga faqat koronka va reja qo‘shiladi',
    );
  }
};

const requireEditor = () => {
  const user = currentUser();
  assert(hasPermission(user.role, 'chart.edit'), 'Tish sxemasini tahrirlash uchun ruxsat yo‘q', 403);
  return user;
};

export const chartApi = {
  // GET /api/patients/:id/chart
  get: (patientId: string) =>
    mockRequest(() => {
      currentUser();
      findPatient(patientId);
      return mockDb.toothRecords.filter((r) => r.patientId === patientId);
    }, 250),

  // PUT /api/patients/:id/chart/:tooth
  updateTooth: (patientId: string, tooth: number, patch: ToothPatch) =>
    mockRequest(() => {
      const user = requireEditor();
      assert(isValidTooth(tooth), 'Tish raqami noto‘g‘ri');
      validateConditions(patch.conditions);
      const surfaces = patch.conditions.includes('MISSING') || patch.conditions.includes('IMPLANT') ? {} : patch.surfaces;
      writeTooth(patientId, tooth, patch.conditions, surfaces, patch.note?.trim() || undefined, {
        doctorId: user.staffId,
        action: "Holat o‘zgartirildi",
      });
      return getToothRecord(patientId, tooth)!;
    }),

  // POST /api/patients/:id/chart/bulk — tanlangan tishlarga holat qo'shish
  bulkAdd: (patientId: string, teeth: number[], condition: ToothCondition) =>
    mockRequest(() => {
      const user = requireEditor();
      assert(teeth.length > 0, 'Tish tanlanmagan');
      for (const t of teeth) {
        const prev = getToothRecord(patientId, t);
        let conditions: ToothCondition[] = [...(prev?.conditions ?? [])];
        if (condition === 'HEALTHY') conditions = [];
        else if (EXCLUSIVE.includes(condition)) conditions = [condition];
        else if (!conditions.includes(condition)) {
          conditions = conditions.filter((c) => !(EXCLUSIVE.includes(c) && !['PLANNED', 'CROWN'].includes(condition)));
          conditions.push(condition);
        }
        validateConditions(conditions);
        writeTooth(
          patientId,
          t,
          conditions,
          EXCLUSIVE.some((c) => conditions.includes(c)) || condition === 'HEALTHY' ? {} : (prev?.surfaces ?? {}),
          prev?.note,
          { doctorId: user.staffId, action: "Holat o‘zgartirildi (guruh)" },
        );
      }
      return true;
    }),

  // GET /api/patients/:id/chart/history?tooth=
  history: (patientId: string, tooth?: number) =>
    mockRequest((): ToothHistoryView[] => {
      currentUser();
      return mockDb.toothHistory
        .filter((h) => h.patientId === patientId && (tooth === undefined || h.tooth === tooth))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((h) => ({ ...h, doctorName: staffName(h.doctorId) }));
    }, 200),
};
