import dayjs from '@/shared/lib/dayjs';

/** Bugundan `o` kun keyingi kun boshi */
export const day = (o = 0) => dayjs().startOf('day').add(o, 'day');
/** YYYY-MM-DD */
export const d = (o = 0) => day(o).format('YYYY-MM-DD');
/** ISO sana-vaqt: bugundan `o` kun, soat `time` */
export const dt = (o = 0, time = '10:00') => {
  const [h, m] = time.split(':').map(Number);
  return day(o)
    .hour(h ?? 0)
    .minute(m ?? 0)
    .second(0)
    .millisecond(0)
    .toISOString();
};

/** Deterministik tasodifiy generator (mulberry32) — seed har yuklanishda bir xil */
export const createRng = (seed: number) => {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)]!,
    chance: (p: number) => next() < p,
  };
};

let counter = 1000;
/** Mock ID generator */
export const uid = (prefix: string) => `${prefix}${++counter}`;
