import type { Dentition, ToothRecord } from '../types';

/** Kamera ko'rinishi: ikkala jag' (old tomondan), faqat yuqori yoki faqat pastki jag' (chaynov yuzasidan) */
export type JawView = 'both' | 'upper' | 'lower';

/**
 * 3D jag' modeli props'lari (`Jaw3DView`).
 * Model faqat ko'rish va bemorga tushuntirish uchun — ma'lumot kiritish 2D sxemada qoladi.
 */
export interface Jaw3DViewProps {
  /** Bemor tish sxemasi yozuvlari (`useChart(patientId).data`) */
  records: ToothRecord[];
  /** Tishlar to'plami — 2D sxemadagi kabi. Standart: 'adult' (doimiy, 32 ta) */
  dentition?: Dentition;
  /** Tanlangan tishlar — qalin ink kontur bilan ajraladi */
  selected?: number[];
  /** Urg'u beriladigan tishlar (masalan, rejadagi ish): ular raqam bilan belgilanadi, qolganlari xiralashadi */
  highlight?: number[];
  /** Bemorga ko'rsatish rejimi: kattaroq yozuvlar, tish nomi, yaqinlashtirish yoqilgan */
  presentation?: boolean;
  /**
   * Tish bosilganda — 2D sxemadagi `onSelect`/`onOpen` bilan bir xil ishlatiladi.
   * `multi` — Shift / Ctrl / Cmd bosib turilgan.
   */
  onToothClick?: (tooth: number, multi: boolean) => void;
  /** Boshlang'ich ko'rinish. Standart: 'both' */
  initialView?: JawView;
  /** Konteyner o'lchami klasslari. Standart: 'h-[320px] md:h-[440px]' */
  className?: string;
}
