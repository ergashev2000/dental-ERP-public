/** FDI (ISO 3950) tish raqamlash yordamchilari */

export type ToothType = 'incisor' | 'canine' | 'premolar' | 'molar';

const range = (from: number, to: number) => {
  const step = from <= to ? 1 : -1;
  const out: number[] = [];
  for (let i = from; step > 0 ? i <= to : i >= to; i += step) out.push(i);
  return out;
};

/** Ekranda shifokor nuqtai nazaridan: chapda bemorning o'ng tomoni */
export const ADULT_UPPER = [...range(18, 11), ...range(21, 28)];
export const ADULT_LOWER = [...range(48, 41), ...range(31, 38)];
export const CHILD_UPPER = [...range(55, 51), ...range(61, 65)];
export const CHILD_LOWER = [...range(85, 81), ...range(71, 75)];

export const ADULT_TEETH = [...ADULT_UPPER, ...ADULT_LOWER];
export const CHILD_TEETH = [...CHILD_UPPER, ...CHILD_LOWER];

export const getQuadrant = (n: number) => Math.floor(n / 10);
export const getPosition = (n: number) => n % 10;
export const isPrimary = (n: number) => getQuadrant(n) >= 5;
export const isUpper = (n: number) => [1, 2, 5, 6].includes(getQuadrant(n));
/** Bemorning o'ng tomoni (ekranda chapda) */
export const isPatientRight = (n: number) => [1, 4, 5, 8].includes(getQuadrant(n));
export const isValidTooth = (n: number) => ADULT_TEETH.includes(n) || CHILD_TEETH.includes(n);

export const getToothType = (n: number): ToothType => {
  const pos = getPosition(n);
  if (isPrimary(n)) {
    if (pos <= 2) return 'incisor';
    if (pos === 3) return 'canine';
    return 'molar';
  }
  if (pos <= 2) return 'incisor';
  if (pos === 3) return 'canine';
  if (pos <= 5) return 'premolar';
  return 'molar';
};

/** Kurak va qoziq tishlarda okklyuziv yuza "I" (incisal) deb ataladi */
export const isAnterior = (n: number) => ['incisor', 'canine'].includes(getToothType(n));

const SIDE: Record<number, string> = {
  1: "Yuqori o‘ng",
  2: 'Yuqori chap',
  3: 'Pastki chap',
  4: "Pastki o‘ng",
  5: "Yuqori o‘ng",
  6: 'Yuqori chap',
  7: 'Pastki chap',
  8: "Pastki o‘ng",
};

const ADULT_POS: Record<number, string> = {
  1: 'markaziy kurak tish',
  2: 'lateral kurak tish',
  3: 'qoziq tish',
  4: 'birinchi kichik oziq tish',
  5: 'ikkinchi kichik oziq tish',
  6: 'birinchi katta oziq tish',
  7: 'ikkinchi katta oziq tish',
  8: 'uchinchi katta oziq tish (aql tishi)',
};

const CHILD_POS: Record<number, string> = {
  1: 'markaziy kurak sut tishi',
  2: 'lateral kurak sut tishi',
  3: 'qoziq sut tishi',
  4: 'birinchi oziq sut tishi',
  5: 'ikkinchi oziq sut tishi',
};

const buildNames = () => {
  const out: Record<number, string> = {};
  for (const n of [...ADULT_TEETH, ...CHILD_TEETH]) {
    const pos = getPosition(n);
    const name = isPrimary(n) ? CHILD_POS[pos] : ADULT_POS[pos];
    out[n] = `${SIDE[getQuadrant(n)]} ${name}`;
  }
  return out;
};

/** Masalan 16: "Yuqori o'ng birinchi katta oziq tish" */
export const TOOTH_NAMES: Record<number, string> = buildNames();

export const toothName = (n: number) => TOOTH_NAMES[n] ?? `Tish ${n}`;
