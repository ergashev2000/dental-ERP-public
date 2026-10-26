import type { SurfaceMap, ToothCondition, ToothRecord } from '@/modules/dental-chart/types';
import type { Invoice } from '@/modules/billing/types';
import { TOOTH_CONDITION } from '@/shared/constants/status';
import { mockDb } from '../mockDb';
import { uid } from '../helpers';

export const describeTooth = (conditions: ToothCondition[], surfaces: SurfaceMap = {}) => {
  const cond = conditions.filter((c) => c !== 'HEALTHY');
  if (!cond.length && !Object.keys(surfaces).length) return TOOTH_CONDITION.HEALTHY.label;
  const s = Object.entries(surfaces)
    .map(([k, v]) => `${k}:${v === 'CARIES' ? 'karies' : 'plomba'}`)
    .join(', ');
  return [cond.map((c) => TOOTH_CONDITION[c].label).join(', '), s && `(${s})`].filter(Boolean).join(' ');
};

export const getToothRecord = (patientId: string, tooth: number) =>
  mockDb.toothRecords.find((r) => r.patientId === patientId && r.tooth === tooth);

export const writeTooth = (
  patientId: string,
  tooth: number,
  conditions: ToothCondition[],
  surfaces: SurfaceMap,
  note: string | undefined,
  meta: { doctorId: string; action: string; appointmentId?: string },
) => {
  const prev = getToothRecord(patientId, tooth);
  const oldValue = prev ? describeTooth(prev.conditions, prev.surfaces) : TOOTH_CONDITION.HEALTHY.label;
  const clean = conditions.filter((c) => c !== 'HEALTHY');
  const now = new Date().toISOString();
  if (prev) {
    prev.conditions = clean;
    prev.surfaces = surfaces;
    prev.note = note;
    prev.updatedAt = now;
  } else {
    const rec: ToothRecord = { patientId, tooth, conditions: clean, surfaces, note, updatedAt: now };
    mockDb.toothRecords.push(rec);
  }
  const newValue = describeTooth(clean, surfaces);
  // Tish tarixi o'chirilmaydi — har o'zgarish yangi yozuv (11-qoida)
  if (oldValue !== newValue || meta.action.startsWith('Muolaja')) {
    mockDb.toothHistory.push({
      id: uid('th'),
      patientId,
      tooth,
      action: meta.action,
      oldValue,
      newValue,
      doctorId: meta.doctorId,
      appointmentId: meta.appointmentId,
      createdAt: now,
    });
  }
};

/** Bajarilgan muolajaning sxemaga ta'siri (yakunlashda avtomatik) */
const EFFECT: Record<string, { add: ToothCondition[]; remove: ToothCondition[]; reset?: boolean }> = {
  T101: { add: ['FILLING'], remove: ['CARIES', 'PLANNED'] },
  T102: { add: ['ROOT_CANAL'], remove: ['CARIES', 'PLANNED'] },
  T103: { add: ['ROOT_CANAL'], remove: ['PLANNED'] },
  T104: { add: ['FILLING'], remove: ['PLANNED'] },
  K501: { add: ['FILLING'], remove: ['CARIES', 'PLANNED'] },
  S201: { add: ['MISSING'], remove: [], reset: true },
  S202: { add: ['MISSING'], remove: [], reset: true },
  S203: { add: ['IMPLANT'], remove: [], reset: true },
  O301: { add: ['CROWN'], remove: ['PLANNED'] },
  O302: { add: ['CROWN'], remove: ['PLANNED'] },
  O303: { add: ['CROWN'], remove: ['PLANNED'] },
};

export const applyTreatmentToTooth = (
  patientId: string,
  tooth: number,
  serviceCode: string,
  serviceName: string,
  doctorId: string,
  appointmentId: string,
  /** Qabulda belgilangan yuzalar — umumiy qoidadan ustun */
  surfaceOverride?: SurfaceMap,
) => {
  const prev = getToothRecord(patientId, tooth);
  let conditions = [...(prev?.conditions ?? [])];
  let surfaces: SurfaceMap = { ...(prev?.surfaces ?? {}) };
  const effect = EFFECT[serviceCode];
  if (effect) {
    const removeAll = !!effect.reset;
    conditions = removeAll ? [] : conditions.filter((c) => !effect.remove.includes(c));
    if (removeAll) surfaces = {};
    for (const c of effect.add) if (!conditions.includes(c)) conditions.push(c);
    if (effect.add.includes('FILLING')) {
      surfaces = Object.fromEntries(Object.entries(surfaces).map(([k]) => [k, 'FILLING'])) as SurfaceMap;
    }
  }
  if (surfaceOverride && Object.keys(surfaceOverride).length) {
    surfaces = { ...surfaces, ...surfaceOverride };
    const states = Object.values(surfaces);
    conditions = conditions.filter((x) => x !== 'HEALTHY');
    if (states.includes('FILLING') && !conditions.includes('FILLING')) conditions.push('FILLING');
    if (states.includes('CARIES')) {
      if (!conditions.includes('CARIES')) conditions.push('CARIES');
    } else conditions = conditions.filter((x) => x !== 'CARIES');
  }
  writeTooth(patientId, tooth, conditions, surfaces, prev?.note, {
    doctorId,
    appointmentId,
    action: `Muolaja: ${serviceName}`,
  });
};

export const recomputeInvoice = (inv: Invoice) => {
  const linesTotal = inv.lines.reduce((s, l) => s + l.price * l.qty - l.discount, 0);
  inv.total = Math.max(0, linesTotal - inv.discount);
  if (inv.status !== 'CANCELLED') {
    inv.status = inv.paid >= inv.total && inv.total > 0 ? 'PAID' : inv.paid > 0 ? 'PARTIAL' : inv.total === 0 ? 'PAID' : 'UNPAID';
  }
};

export const nextInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const max = mockDb.invoices
    .map((i) => Number(i.number.split('-')[2]))
    .reduce((a, b) => Math.max(a, b), 0);
  return `INV-${year}-${String(max + 1).padStart(4, '0')}`;
};
