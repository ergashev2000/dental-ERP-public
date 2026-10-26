/**
 * Anatomik tish shablonlari (yon ko'rinish), biriktirilgan referens rasm uslubida qo'lda chizilgan
 * tekis bezier path'lar. Barcha shablonlar YUQORI jag' uchun (ildiz tepaga), markaz x = 24.
 *
 * Umumiy viewBox: 0 0 48 100. Bo'yin chizig'i (CEJ) y ≈ 58, okklyuziv/kesuvchi qirra y ≈ 94.
 * Pastki jag' — vertikal ko'zgu, chap tomon — gorizontal ko'zgu (ToothShape ichida).
 */
export const TOOTH_VIEWBOX = '0 0 48 100';
export const TOOTH_W = 48;
export const TOOTH_H = 100;
/** Milk (gingiva) chizig'i oralig'i */
export const GUM = { y: 45, h: 15 } as const;

export type ToothTemplateKey = 'central' | 'lateral' | 'canine' | 'premolar1' | 'premolar2' | 'molarUpper' | 'molarLower';

export interface ToothTemplate {
  crown: string;
  root: string;
  pulp: string;
  /** Kariyes nuqtasi markazi (toj ustida) */
  dot: [number, number];
}

export const TOOTH_TEMPLATES: Record<ToothTemplateKey, ToothTemplate> = {
  // Markaziy kurak: tor bo'yin, keng kesuvchi qirra, bitta konussimon ildiz
  central: {
    crown: 'M16 58 C14 67 13 78 14 88 Q14.5 93.5 19 93.5 L29 93.5 Q33.5 93.5 34 88 C35 78 34 67 32 58 Z',
    root: 'M16.5 58 C16.5 42 20 20 23 9 Q24 6.5 25 9 C28 20 31.5 42 31.5 58 Z',
    pulp: 'M22.3 74 C22.3 57 23.2 33 24 14 C24.8 33 25.7 57 25.7 74 Q24 77.5 22.3 74 Z',
    dot: [24, 82],
  },
  // Lateral kurak: markaziydan torroq va qisqaroq
  lateral: {
    crown: 'M17.5 58 C16 67 15 77 16 87 Q16.5 92 20.5 92 L27.5 92 Q31.5 92 32 87 C33 77 32 67 30.5 58 Z',
    root: 'M18 58 C18 43 21 23 23.3 12 Q24 10 24.7 12 C27 23 30 43 30 58 Z',
    pulp: 'M22.6 72 C22.6 56 23.4 34 24 17 C24.6 34 25.4 56 25.4 72 Q24 75 22.6 72 Z',
    dot: [24, 80],
  },
  // Qoziq: o'tkir uchli toj, eng uzun ildiz
  canine: {
    crown: 'M15.5 57 C14 66 13.5 76 16 84 Q19.5 91.5 24 95.5 Q28.5 91.5 32 84 C34.5 76 34 66 32.5 57 Z',
    root: 'M16.5 57 C16.5 36 20 13 23.4 3.5 Q24 2 24.6 3.5 C28 13 31.5 36 31.5 57 Z',
    pulp: 'M22.4 75 C22.4 55 23.2 30 24 8 C24.8 30 25.6 55 25.6 75 Q24 78.5 22.4 75 Z',
    dot: [24, 80],
  },
  // 1-kichik oziq: ikki do'mboqli toj, ikki shoxli ildiz
  premolar1: {
    crown:
      'M14 58 C12 67 11.5 77 13 86 Q15 93.5 19 92.5 Q21.5 90.5 24 91 Q26.5 90.5 29 92.5 Q33 93.5 35 86 C36.5 77 36 67 34 58 Z',
    root: 'M15 58 C14.5 45 16 28 18 17 Q19.5 13.5 21 17 C22 28 23 40 24 46 C25 40 26 28 27 17 Q28.5 13.5 30 17 C32 28 33.5 45 33 58 Z',
    pulp: 'M20 77 C19.5 62 19 40 19.6 21 L20.6 21 C21.2 38 22 54 24 64 C26 54 26.8 38 27.4 21 L28.4 21 C29 40 28.5 62 28 77 Q24 80 20 77 Z',
    dot: [24, 81],
  },
  // 2-kichik oziq: bitta ildiz
  premolar2: {
    crown:
      'M14 58 C12 67 11.5 77 13 86 Q15 93.5 19 92.5 Q21.5 90.5 24 91 Q26.5 90.5 29 92.5 Q33 93.5 35 86 C36.5 77 36 67 34 58 Z',
    root: 'M15.5 58 C15.5 42 19.5 22 23 11 Q24 8.5 25 11 C28.5 22 32.5 42 32.5 58 Z',
    pulp: 'M22.3 77 C22.3 58 23.2 34 24 15 C24.8 34 25.7 58 25.7 77 Q24 80.5 22.3 77 Z',
    dot: [24, 81],
  },
  // Yuqori katta oziq: keng toj, uchta ildiz
  molarUpper: {
    crown:
      'M8 58 C6 67 5.5 78 7 87 Q9 94.5 14 93.5 Q18.5 90.5 24 92 Q29.5 90.5 34 93.5 Q39 94.5 41 87 C42.5 78 42 67 40 58 Z',
    root: 'M9 58 C8 46 8.5 32 10.5 20 Q12 16 13.5 20 C15 30 16.5 40 18 46 C19 36 21 24 23 14 Q24 11 25 14 C27 24 29 36 30 46 C31.5 40 33 30 34.5 20 Q36 16 37.5 20 C39.5 32 40 46 39 58 Z',
    pulp: 'M15 78 Q14 70 13.6 60 C13.2 48 12.6 34 12 23 L13 23 C14.5 34 17 48 20 61 C21.4 50 22.4 34 23.5 18 L24.5 18 C25.6 34 26.6 50 28 61 C31 48 33.5 34 35 23 L36 23 C35.4 34 34.8 48 34.4 60 Q34 70 33 78 Q24 82 15 78 Z',
    dot: [24, 82],
  },
  // Pastki katta oziq: keng toj, ikkita ildiz (mezial va distal)
  molarLower: {
    crown:
      'M8 58 C6 67 5.5 78 7 87 Q9 94.5 14 93.5 Q18.5 90.5 24 92 Q29.5 90.5 34 93.5 Q39 94.5 41 87 C42.5 78 42 67 40 58 Z',
    root: 'M9 58 C8.5 45 10 30 12.5 16 Q14.5 12 16.5 16 C18 28 20 40 24 47 C28 40 30 28 31.5 16 Q33.5 12 35.5 16 C38 30 39.5 45 39 58 Z',
    pulp: 'M15 78 Q14 70 14 60 C13.6 46 13.6 32 14 20 L15 20 C16.5 32 18.5 46 21 58 L27 58 C29.5 46 31.5 32 33 20 L34 20 C34.4 32 34.4 46 34 60 Q34 70 33 78 Q24 82 15 78 Z',
    dot: [24, 82],
  },
};

/** Implant: soddalashtirilgan vint (ildiz o'rnida) va abutment */
export const IMPLANT = {
  body: 'M18.5 58 L18.5 18 Q18.5 11 24 9 Q29.5 11 29.5 18 L29.5 58 Z',
  threads: [22, 28, 34, 40, 46, 52].map((y) => `M17.5 ${y} L30.5 ${y - 2.5}`),
  abutment: 'M20 58 L20 64 Q24 67 28 64 L28 58 Z',
} as const;
