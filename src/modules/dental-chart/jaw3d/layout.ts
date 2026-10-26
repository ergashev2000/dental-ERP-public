import { getPosition, getToothType, isPrimary, isUpper, type ToothType } from '@/shared/utils/fdi';
import type { Dentition, ToothRecord } from '../types';

/**
 * 3D jag' joylashuvi (sof matematika, three.js'siz — legend ham shu ro'yxatdan foydalanadi).
 * Birlik — millimetr. Old tomon +Z, okklyuziv tekislik y = 0, bemorning o'ng tomoni −X (ekranda chapda).
 */

/** [mezio-distal kenglik, vestibulo-lingval qalinlik, toj balandligi] — o'rtacha anatomik qiymatlar */
type Dims = readonly [number, number, number];
const PERM_UPPER: Dims[] = [[8.5, 7, 10.5], [6.5, 6, 9], [7.5, 8, 10], [7, 9, 8.5], [6.5, 9, 7.5], [10, 11, 7.5], [9, 11, 7], [8.5, 10, 6.5]];
const PERM_LOWER: Dims[] = [[5.3, 6, 9], [5.9, 6, 9.5], [6.9, 7.5, 11], [7, 7.5, 8.5], [7.2, 8, 8], [11, 10.5, 7.5], [10.5, 10, 7], [10, 9.5, 6.5]];
const PRIM_UPPER: Dims[] = [[6.5, 5, 6], [5.2, 5, 5.5], [7, 6, 6.5], [7, 7, 5.5], [9, 9, 5.5]];
const PRIM_LOWER: Dims[] = [[4.2, 4, 5], [4.6, 4.5, 5.5], [5.7, 5.5, 6], [7.7, 7, 5.5], [9.9, 8.5, 5.5]];

const dims = (tooth: number): Dims => {
  const upper = isUpper(tooth);
  const table = isPrimary(tooth) ? (upper ? PRIM_UPPER : PRIM_LOWER) : upper ? PERM_UPPER : PERM_LOWER;
  return table[getPosition(tooth) - 1];
};

/** Jag'lar orasidagi ochiqlik (mm) — tishlar bir-birini yopmasin */
export const GAP = 3;
export const GUM_RADIUS = 6.5;
/** Milk yoyi markazi tish bo'ynidan shuncha yuqorida — toj bo'yni milk ichida qoladi */
const GUM_LIFT = 4.5;

export interface PlacedTooth {
  tooth: number;
  type: ToothType;
  upper: boolean;
  x: number;
  z: number;
  /** Y o'qi atrofida burilish: tishning labial tomoni yoy normaliga qaraydi */
  angle: number;
  w: number;
  d: number;
  h: number;
}

export interface JawLayout {
  upper: boolean;
  teeth: PlacedTooth[];
  /** Milk yoyining markaz chizig'i (o'ngdan chapga) */
  gum: [number, number, number][];
}

/* ---------- Yoy: ellips choragi, uzunlik bo'yicha parametrlangan ---------- */

interface Arc {
  ratio: number;
  th: number[];
  len: number[];
  total: number;
}

const buildArc = (ratio: number, n = 160): Arc => {
  const th: number[] = [];
  const len: number[] = [];
  let total = 0;
  let px = 0;
  let pz = 0;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * (Math.PI / 2);
    const x = ratio * Math.sin(t);
    const z = -(1 - Math.cos(t));
    if (i) total += Math.hypot(x - px, z - pz);
    th.push(t);
    len.push(total);
    px = x;
    pz = z;
  }
  return { ratio, th, len, total };
};

/** Eni/chuqurligi nisbati. Pastki yoy torroq — yuqori jag' tishlari tashqi tomonda turadi */
const ARCS = { upper: buildArc(0.68), lower: buildArc(0.64) };

/** s — o'rta chiziqdan yoy bo'ylab masofa (mm), k — masshtab. Yoy tugasa urinma bo'ylab davom etadi */
const archPoint = (arc: Arc, s: number, k: number) => {
  const target = s / k;
  const i = arc.len.findIndex((l) => l >= target);
  let t = Math.PI / 2;
  if (i === 0) t = 0;
  else if (i > 0) {
    const f = (target - arc.len[i - 1]) / (arc.len[i] - arc.len[i - 1] || 1);
    t = arc.th[i - 1] + f * (arc.th[i] - arc.th[i - 1]);
  }
  const tx0 = arc.ratio * Math.cos(t);
  const tz0 = -Math.sin(t);
  const n = Math.hypot(tx0, tz0);
  const tx = tx0 / n;
  const tz = tz0 / n;
  const over = Math.max(0, target - arc.total) * k;
  return {
    x: k * arc.ratio * Math.sin(t) + tx * over,
    z: -k * (1 - Math.cos(t)) + tz * over,
    // labial normal = (−tz, tx)
    angle: Math.atan2(-tz, tx),
  };
};

/* ---------- Qaysi tishlar ko'rsatiladi ---------- */

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

/**
 * Har bir chorak uchun tishlar (o'rta chiziqdan tashqariga).
 * Aralash tishlov: har bir o'rinda doimiy yoki sut tishi — urg'u, keyin sxemadagi yozuv bo'yicha;
 * yozuv bo'lmasa — kurak tishlar va 6-tish doimiy, qoziq va oziqlar sut; 7–8 faqat yozuvi bo'lsa.
 */
const quadrantTeeth = (q: 1 | 2 | 3 | 4, dentition: Dentition, byTooth: Map<number, ToothRecord>, highlight: Set<number>) => {
  const perm = (p: number) => q * 10 + p;
  const prim = (p: number) => (q + 4) * 10 + p;
  if (dentition === 'adult') return range(8).map(perm);
  if (dentition === 'child') return range(5).map(prim);
  const present = (t: number) => {
    const r = byTooth.get(t);
    return !!r && !r.conditions.includes('MISSING');
  };
  const out: number[] = [];
  for (const p of range(5)) {
    const a = perm(p);
    const b = prim(p);
    if (highlight.has(b)) out.push(b);
    else if (highlight.has(a) || present(a)) out.push(a);
    else if (present(b)) out.push(b);
    else out.push(p <= 2 ? a : b);
  }
  for (const p of [6, 7, 8]) {
    const a = perm(p);
    if (p === 6 || present(a) || highlight.has(a)) out.push(a);
  }
  return out;
};

export interface JawTeeth {
  upperRight: number[];
  upperLeft: number[];
  lowerLeft: number[];
  lowerRight: number[];
}

export const jawTeeth = (dentition: Dentition, records: ToothRecord[], highlight: number[] = []): JawTeeth => {
  const byTooth = new Map(records.map((r) => [r.tooth, r]));
  const hl = new Set(highlight);
  return {
    upperRight: quadrantTeeth(1, dentition, byTooth, hl),
    upperLeft: quadrantTeeth(2, dentition, byTooth, hl),
    lowerLeft: quadrantTeeth(3, dentition, byTooth, hl),
    lowerRight: quadrantTeeth(4, dentition, byTooth, hl),
  };
};

export const allJawTeeth = (j: JawTeeth) => [...j.upperRight, ...j.upperLeft, ...j.lowerLeft, ...j.lowerRight];

/* ---------- Joylashtirish ---------- */

export const layoutJaw = (upper: boolean, right: number[], left: number[]): JawLayout => {
  const arc = upper ? ARCS.upper : ARCS.lower;
  const width = (ts: number[]) => ts.reduce((s, t) => s + dims(t)[0], 0);
  const half = Math.max(width(right), width(left), 1);
  const k = half / arc.total;
  const ySign = upper ? 1 : -1;

  const place = (ts: number[], sign: 1 | -1): PlacedTooth[] => {
    let s = 0;
    return ts.map((tooth) => {
      const [w, d, h] = dims(tooth);
      const p = archPoint(arc, s + w / 2, k);
      s += w;
      return { tooth, type: getToothType(tooth), upper, x: sign * p.x, z: p.z, angle: sign * p.angle, w, d, h };
    });
  };
  const r = place(right, -1);
  const l = place(left, 1);

  const gumY = (p: PlacedTooth) => ySign * (GAP / 2 + p.h + GUM_LIFT);
  const tail = (side: PlacedTooth[], sign: 1 | -1, total: number): [number, number, number] | null => {
    const last = side[side.length - 1];
    if (!last) return null;
    const e = archPoint(arc, total + 2, k);
    return [sign * e.x, gumY(last), e.z];
  };
  const gum: [number, number, number][] = [];
  const rightTail = tail(r, -1, width(right));
  if (rightTail) gum.push(rightTail);
  for (const p of [...r].reverse()) gum.push([p.x, gumY(p), p.z]);
  for (const p of l) gum.push([p.x, gumY(p), p.z]);
  const leftTail = tail(l, 1, width(left));
  if (leftTail) gum.push(leftTail);

  return { upper, teeth: [...r, ...l], gum };
};
