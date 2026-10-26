import { Select, Spin, type SelectProps } from 'antd';
import { useMemo, useState } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { formatMoney, formatPhone, shortName } from '@/shared/utils/format';
import { usePatient, usePatientSearch } from '@/modules/patients';
import { useDebtors } from '../hooks/useBilling';

interface Payer {
  id: string;
  name: string;
  phone: string;
  debt: number;
}

const Option = ({ p }: { p: Payer }) => (
  <div className="flex items-center justify-between gap-3 py-0.5">
    <div className="min-w-0">
      <div className="truncate">{p.name}</div>
      <div className="text-xs tabular-nums text-muted">{formatPhone(p.phone)}</div>
    </div>
    {p.debt > 0 ? (
      <span className="shrink-0 text-xs tabular-nums text-danger">qarz {formatMoney(p.debt)}</span>
    ) : (
      <span className="shrink-0 text-xs text-muted">qarz yo‘q</span>
    )}
  </div>
);

/**
 * Kassa uchun bemor tanlash: qidiruv bo'sh bo'lsa — qarzdorlar (eng katta qarz tepada),
 * yozilsa — ism, telefon yoki karta № bo'yicha. Har bir variantda qarz ko'rinadi.
 */
export const PayerSelect = ({ value, onChange, autoFocus }: { value?: string; onChange?: (id: string) => void; autoFocus?: boolean }) => {
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim(), 250);
  const searching = !!q;
  const debtors = useDebtors(null);
  const found = usePatientSearch(q, searching);
  const { data: selected } = usePatient(value);

  const list = useMemo(() => {
    const rows: Payer[] = searching
      ? (found.data ?? []).map((p) => ({ id: p.id, name: shortName(p), phone: p.phone, debt: p.debt }))
      : (debtors.data ?? []).map((d) => ({ id: d.patientId, name: d.patientName, phone: d.phone, debt: d.debt }));
    if (selected && !rows.some((r) => r.id === selected.id)) rows.unshift({ id: selected.id, name: shortName(selected), phone: selected.phone, debt: selected.debt });
    return rows;
  }, [searching, found.data, debtors.data, selected]);

  const loading = searching ? found.isFetching : debtors.isLoading;
  const options: NonNullable<SelectProps['options']> = list.map((p) => ({ value: p.id, label: `${p.name} · ${formatPhone(p.phone)}`, p }));

  return (
    <Select
      showSearch
      size="large"
      value={value || undefined}
      placeholder="Ism, telefon yoki karta №"
      autoFocus={autoFocus}
      filterOption={false}
      onSearch={setSearch}
      onChange={(id: string) => {
        setSearch('');
        onChange?.(id);
      }}
      defaultActiveFirstOption
      notFoundContent={loading ? <Spin size="small" /> : <span className="text-sm text-muted">{searching ? 'Bunday bemor topilmadi' : 'Qarzdor bemorlar yo‘q'}</span>}
      optionLabelProp="label"
      options={searching ? options : [{ label: <span className="text-xs text-muted">Qarzdorlar</span>, title: 'Qarzdorlar', options }]}
      optionRender={(o) => <Option p={(o.data as { p: Payer }).p} />}
      popupMatchSelectWidth
      className="w-full"
    />
  );
};
