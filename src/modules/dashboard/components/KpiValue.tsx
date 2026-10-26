import { shortMoney } from '../utils/money';

/** KPI qiymati + kichik xira birlik (raqam hech qachon kesilmaydi) */
export const KpiValue = ({ value, unit, title }: { value: string | number; unit?: string; title?: string }) => (
  <span title={title} className="whitespace-nowrap">
    {value}
    {unit && <span className="ml-1.5 text-[0.55em] text-muted">{unit}</span>}
  </span>
);

/** Qisqa summa: "4,8 mln so‘m", to'liq qiymat — sichqoncha ustida */
export const MoneyKpi = ({ value }: { value: number }) => {
  const m = shortMoney(value);
  return <KpiValue value={m.value} unit={m.unit} title={m.full} />;
};
