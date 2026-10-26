import { TOOTH_CONDITION } from '@/shared/constants/status';
import { getPosition, isAnterior, isPatientRight, isPrimary, isUpper } from '@/shared/utils/fdi';
import type { ToothTemplateKey } from '@/shared/assets/teeth/paths';
import type { Surface, SurfaceMap, ToothCondition } from './types';

export const CONDITIONS: ToothCondition[] = [
  'HEALTHY',
  'CARIES',
  'FILLING',
  'ROOT_CANAL',
  'CROWN',
  'IMPLANT',
  'MISSING',
  'EXTRACTION_PLANNED',
  'PLANNED',
];

export const SURFACES: Surface[] = ['M', 'D', 'O', 'B', 'L'];

export type SurfacePos = 'top' | 'right' | 'bottom' | 'left' | 'center';

/**
 * Shifokor nuqtai nazaridan yuza joylashuvi:
 * yuqori jag'da tepada vestibulyar (B), pastda palatinal; pastki jag'da aksincha.
 * Mezial yuza doim o'rta chiziq tomonda.
 */
export const surfacePosition = (tooth: number, s: Surface): SurfacePos => {
  if (s === 'O') return 'center';
  const upper = isUpper(tooth);
  if (s === 'B') return upper ? 'top' : 'bottom';
  if (s === 'L') return upper ? 'bottom' : 'top';
  const midlineRight = isPatientRight(tooth);
  if (s === 'M') return midlineRight ? 'right' : 'left';
  return midlineRight ? 'left' : 'right';
};

export const surfaceAt = (tooth: number, pos: SurfacePos): Surface =>
  SURFACES.find((s) => surfacePosition(tooth, s) === pos)!;

/** Kurak/qoziqda O → I (incisal), yuqori jag'da L → P (palatinal) */
export const surfaceLetter = (tooth: number, s: Surface) => {
  if (s === 'O' && isAnterior(tooth)) return 'I';
  if (s === 'L' && isUpper(tooth)) return 'P';
  return s;
};

export const SURFACE_NAMES: Record<Surface, string> = {
  M: 'Mezial',
  D: 'Distal',
  O: 'Okklyuziv',
  B: 'Vestibulyar',
  L: 'Lingval',
};

export const surfaceName = (tooth: number, s: Surface) => {
  if (s === 'O' && isAnterior(tooth)) return 'Kesuvchi (incisal)';
  if (s === 'L' && isUpper(tooth)) return 'Palatinal';
  return SURFACE_NAMES[s];
};

/** "MO", "DO" kabi qisqa yozuv */
export const surfaceCode = (tooth: number, map: SurfaceMap) =>
  (['M', 'O', 'D', 'B', 'L'] as Surface[])
    .filter((s) => map[s])
    .map((s) => surfaceLetter(tooth, s))
    .join('');

export const templateFor = (tooth: number): ToothTemplateKey => {
  const pos = getPosition(tooth);
  const upper = isUpper(tooth);
  if (pos === 1) return 'central';
  if (pos === 2) return 'lateral';
  if (pos === 3) return 'canine';
  if (isPrimary(tooth)) return upper ? 'molarUpper' : 'molarLower';
  if (pos === 4) return upper ? 'premolar1' : 'premolar2';
  if (pos === 5) return 'premolar2';
  return upper ? 'molarUpper' : 'molarLower';
};

/** Tish o'lchami (kenglik bo'yicha) */
export const toothScale = (tooth: number) => {
  if (isPrimary(tooth)) return 0.8;
  const pos = getPosition(tooth);
  return pos === 8 ? 0.88 : pos === 7 ? 0.95 : 1;
};

export const conditionsLabel = (conditions: ToothCondition[]) => {
  const c = conditions.filter((x) => x !== 'HEALTHY');
  return c.length ? c.map((x) => TOOTH_CONDITION[x].short).join(', ') : TOOTH_CONDITION.HEALTHY.short;
};
