import { ADULT_TEETH, CHILD_TEETH, isPrimary } from '@/shared/utils/fdi';
import type { Dentition } from '@/modules/dental-chart/types';
import type { PlanItemView } from './types';

/** Tish tanlash ro'yxati (Select uchun): doimiy va sut tishlari guruhlangan */
export const toothOptions = [
  { label: 'Doimiy tishlar', options: [...ADULT_TEETH].sort((a, b) => a - b).map((t) => ({ value: t, label: String(t) })) },
  { label: 'Sut tishlar', options: [...CHILD_TEETH].sort((a, b) => a - b).map((t) => ({ value: t, label: String(t) })) },
];

/** 3D taqdimotda qaysi bosqich tishlari urg'ulanadi */
export type StageFilter = number | 'all';

const teethOf = (items: PlanItemView[]) => [...new Set(items.flatMap((i) => (i.tooth ? [i.tooth] : [])))];

/**
 * Urg'u beriladigan tishlar: bosqich tanlansa — shu bosqich (bekor qilinganlarsiz);
 * "Barchasi" — hali bajarilmagan ish, u bo'lmasa — butun reja.
 */
export const planHighlight = (items: PlanItemView[], stage: StageFilter) => {
  const live = items.filter((i) => i.status !== 'CANCELLED');
  if (stage !== 'all') return teethOf(live.filter((i) => i.stage === stage));
  const open = teethOf(live.filter((i) => i.status === 'PLANNED' || i.status === 'IN_PROGRESS'));
  return open.length ? open : teethOf(live);
};

/** Rejadagi tishlarga qarab 3D tishlov turi: sut + doimiy — aralash, faqat sut — sut tishlar */
export const planDentition = (items: PlanItemView[], childAge: boolean): Dentition => {
  const teeth = teethOf(items.filter((i) => i.status !== 'CANCELLED'));
  const primary = teeth.some(isPrimary);
  const permanent = teeth.some((t) => !isPrimary(t));
  if (primary) return permanent ? 'mixed' : 'child';
  return childAge ? 'mixed' : 'adult';
};
