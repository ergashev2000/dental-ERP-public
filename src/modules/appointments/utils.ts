import { surfaceCode } from '@/modules/dental-chart';
import type { SurfaceMap } from '@/modules/dental-chart/types';
import type { PaymentMethod } from '@/modules/billing/types';

export type PayMode = 'FULL' | 'PARTIAL' | 'DEBT';

export interface CompletionPaymentValues {
  mode: PayMode;
  amount?: number;
  method: PaymentMethod;
}

/** To'lov summasi: to'liq — jami, qisman — kiritilgan, qarz — 0 */
export const paidAmount = (p: Partial<CompletionPaymentValues> | undefined, total: number) =>
  !p || p.mode === 'DEBT' ? 0 : p.mode === 'FULL' ? total : Math.min(p.amount ?? 0, total);

/** "MO · plomba, D · karies" kabi qisqa yozuv */
export const surfaceSummary = (tooth: number | undefined, map?: SurfaceMap) => {
  if (!tooth || !map || !Object.keys(map).length) return '';
  const filled = surfaceCode(tooth, Object.fromEntries(Object.entries(map).filter(([, v]) => v === 'FILLING')));
  const caries = surfaceCode(tooth, Object.fromEntries(Object.entries(map).filter(([, v]) => v === 'CARIES')));
  return [filled && `${filled} · plomba`, caries && `${caries} · karies`].filter(Boolean).join(', ');
};
