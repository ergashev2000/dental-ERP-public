import { formatMoney, formatNumber } from '@/shared/utils/format';

/** Qisqa summa KPI uchun: 4 800 000 → { value: "4,8", unit: "mln so‘m" }; to'liq qiymat — title'da */
export const shortMoney = (v: number) => {
  const abs = Math.abs(v);
  const sign = v < 0 ? '−' : '';
  if (abs >= 1_000_000_000) return { value: `${sign}${formatNumber(Math.round(abs / 100_000_000) / 10, 1)}`, unit: 'mlrd so‘m', full: formatMoney(v) };
  if (abs >= 1_000_000) return { value: `${sign}${formatNumber(Math.round(abs / 100_000) / 10, 1)}`, unit: 'mln so‘m', full: formatMoney(v) };
  if (abs >= 1000) return { value: `${sign}${formatNumber(Math.round(abs / 1000))}`, unit: 'ming so‘m', full: formatMoney(v) };
  return { value: `${sign}${formatNumber(abs)}`, unit: 'so‘m', full: formatMoney(v) };
};
