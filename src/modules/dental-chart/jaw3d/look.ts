import { toothColors as c, type Tone } from '@/shared/theme/tokens';
import type { ToothCondition } from '../types';

/** 3D'da tish rangi bitta asosiy holat bo'yicha tanlanadi; "Rejada" — alohida (oltin kontur) */
export type LookKey = Exclude<ToothCondition, 'PLANNED'>;

export interface ToothLook {
  key: LookKey;
  color: string;
  opacity: number;
  /** Kontur rangi: koronka — ink, rejada — oltin */
  outline?: string;
  /** Implant (koronkasiz) — metall abutment ko'rinishida */
  abutment: boolean;
  planned: boolean;
}

/** Ustuvorlik: ko'rinadigan holat birinchi (koronka plomba va kanalni yopadi, karies — faol kasallik) */
const PRIORITY: LookKey[] = ['MISSING', 'IMPLANT', 'EXTRACTION_PLANNED', 'CARIES', 'CROWN', 'FILLING', 'ROOT_CANAL'];

/** Ranglar faqat `toothColors` tokenlaridan (2D sxema bilan bir xil manba) */
export const LOOK_COLOR: Record<LookKey, string> = {
  HEALTHY: c.crown,
  CARIES: c.caries,
  FILLING: c.filling,
  ROOT_CANAL: c.root,
  CROWN: c.crownFill,
  IMPLANT: c.implant,
  MISSING: c.missing,
  EXTRACTION_PLANNED: c.extraction,
};

export const LOOK_OPACITY: Partial<Record<LookKey, number>> = { MISSING: 0.16, EXTRACTION_PLANNED: 0.5 };

export const toothLook = (conditions: ToothCondition[]): ToothLook => {
  const key = PRIORITY.find((k) => conditions.includes(k)) ?? 'HEALTHY';
  const crowned = conditions.includes('CROWN');
  const planned = conditions.includes('PLANNED');
  const abutment = key === 'IMPLANT' && !crowned;
  return {
    key,
    color: key === 'IMPLANT' && crowned ? c.crownFill : LOOK_COLOR[key],
    opacity: LOOK_OPACITY[key] ?? 1,
    outline: planned ? c.planned : crowned && key !== 'MISSING' ? c.crownStroke : undefined,
    abutment,
    planned,
  };
};

/** Bemorga tushunarli status chip ohanglari (rang har doim so'z bilan) */
export const CONDITION_TONE: Record<ToothCondition, Tone> = {
  HEALTHY: 'success',
  CARIES: 'danger',
  FILLING: 'info',
  ROOT_CANAL: 'info',
  CROWN: 'info',
  IMPLANT: 'neutral',
  MISSING: 'neutral',
  EXTRACTION_PLANNED: 'danger',
  PLANNED: 'warning',
};
