import type { ReactNode } from 'react';

/** Chop etiladigan varaq sarlavhasi (usePrint bilan birga ishlatiladi) */
export const PrintHeader = ({ title, subtitle, clinic }: { title: string; subtitle?: ReactNode; clinic?: string }) => (
  <div className="mb-4 flex items-end justify-between border-b border-line pb-3">
    <div>
      <div className="text-xs text-muted">{clinic ?? 'Oq Tabassum Dental'}</div>
      <div className="text-xl font-medium">{title}</div>
    </div>
    {subtitle && <div className="text-right text-sm">{subtitle}</div>}
  </div>
);
