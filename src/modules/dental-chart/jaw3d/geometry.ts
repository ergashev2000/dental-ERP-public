import { CatmullRomCurve3, SphereGeometry, TubeGeometry, Vector3, type BufferGeometry } from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { ToothType } from '@/shared/utils/fdi';

/**
 * Protsedural geometriya — tashqi model fayllarsiz.
 * Har bir tish turi uchun bitta birlik toj (−0.5…0.5, +Y — kesuvchi/chaynov uchi);
 * tishlar shu 4 geometriyani bo'lishadi va mesh `scale` bilan o'lchamlanadi.
 */

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const spow = (v: number, p: number) => Math.sign(v) * Math.abs(v) ** p;

/** Superellipsoid darajasi: kichikroq — "qutiroq" (oziq tishlar), kattaroq — yumaloqroq (qoziq) */
const BOXINESS: Record<ToothType, number> = { incisor: 0.6, canine: 0.72, premolar: 0.55, molar: 0.45 };

export const crownGeometry = (type: ToothType): BufferGeometry => {
  const sphere = new SphereGeometry(1, 32, 24);
  sphere.deleteAttribute('uv');
  sphere.deleteAttribute('normal');
  // chok va qutblardagi takroriy uchlarni birlashtiramiz — normallar silliq chiqadi
  const g = mergeVertices(sphere);
  sphere.dispose();
  const pos = g.getAttribute('position');
  const p = BOXINESS[type];

  for (let i = 0; i < pos.count; i++) {
    let x = spow(pos.getX(i), p) * 0.5;
    let y = spow(pos.getY(i), p) * 0.5;
    let z = spow(pos.getZ(i), p) * 0.5;
    const t = y + 0.5; // 0 — bo'yin, 1 — uchi

    if (type === 'incisor') {
      // kurak: kesuvchi qirraga qarab yupqalashadi va biroz kengayadi
      z *= 1 - 0.7 * smooth(0.2, 1, t);
      x *= 0.8 + 0.22 * t;
    } else if (type === 'canine') {
      // qoziq: o'tkir bitta do'mboq
      const k = smooth(0.5, 1, t);
      x *= (0.85 + 0.15 * smooth(0, 0.5, t)) * (1 - 0.65 * k);
      z *= 1 - 0.3 * k;
    } else {
      // oziq tishlar: bo'yin torayishi + chaynov yuzasida egat (premolyarda bitta, molyarda xochsimon)
      const neck = 0.86 + 0.14 * smooth(0, 0.55, t);
      x *= neck;
      z *= neck;
      const top = smooth(0.72, 1, t);
      const groove = Math.exp(-((z / 0.1) ** 2)) + (type === 'molar' ? 0.8 * Math.exp(-((x / 0.1) ** 2)) : 0);
      y -= 0.11 * top * Math.min(1, groove);
    }
    pos.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
};

/** Milk yoyi: tish bo'yinlari bo'ylab silliq naycha */
export const gumGeometry = (points: [number, number, number][], radius: number) => {
  const curve = new CatmullRomCurve3(
    points.map(([x, y, z]) => new Vector3(x, y, z)),
    false,
    'centripetal',
  );
  return {
    tube: new TubeGeometry(curve, Math.max(64, points.length * 8), radius, 16, false),
    start: curve.getPoint(0),
    end: curve.getPoint(1),
  };
};

/** Naycha uchlarini yopuvchi shar */
export const capGeometry = (radius: number) => new SphereGeometry(radius, 16, 12);
