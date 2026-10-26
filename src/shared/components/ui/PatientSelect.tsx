import { Button, Select, Spin } from 'antd';
import { UserPlus } from '@/shared/icons';
import { useMemo, useState } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { formatAge, formatPhone, shortName } from '@/shared/utils/format';
import { usePatient, usePatientSearch, type PatientRow } from '@/modules/patients';

interface Props {
  value?: string;
  onChange?: (id: string, patient?: PatientRow) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  autoFocus?: boolean;
  /** Topilmasa — "Yangi bemor qo'shish" tugmasi (qidiruv matni uzatiladi) */
  onCreate?: (text: string) => void;
}

const Option = ({ p }: { p: PatientRow }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="min-w-0">
      <div className="truncate font-semibold">{shortName(p)}</div>
      <div className="text-xs text-muted">{p.birthDate ? `${p.cardNo} · ${formatAge(p.birthDate)}` : p.cardNo}</div>
    </div>
    <span className="shrink-0 text-xs tabular-nums text-muted">{formatPhone(p.phone)}</span>
  </div>
);

/** Qidiruvli bemor tanlash: ism, telefon ("+998"siz ham) va karta № bo'yicha */
export const PatientSelect = ({ value, onChange, placeholder = 'Ism, telefon yoki karta №', disabled, allowClear, autoFocus, onCreate }: Props) => {
  const [search, setSearch] = useState('');
  const q = useDebounce(search, 250);
  const { data = [], isFetching } = usePatientSearch(q);
  const { data: selected } = usePatient(value && !data.some((p) => p.id === value) ? value : null);

  const list = useMemo(() => (selected && !data.some((p) => p.id === selected.id) ? [selected, ...data] : data), [data, selected]);

  const notFound = isFetching ? (
    <Spin size="small" />
  ) : (
    <div className="flex flex-col items-start gap-2 px-1 py-2">
      <span className="text-sm text-muted">{search.trim() ? 'Bunday bemor topilmadi' : 'Ism yoki telefon raqamini yozing'}</span>
      {onCreate && search.trim() && (
        <Button size="small" type="primary" icon={<UserPlus size={14} strokeWidth={1.75} />} onClick={() => onCreate(search.trim())}>
          Yangi bemor sifatida qo‘shish
        </Button>
      )}
    </div>
  );

  return (
    <Select
      showSearch
      value={value || undefined}
      placeholder={placeholder}
      disabled={disabled}
      allowClear={allowClear}
      autoFocus={autoFocus}
      filterOption={false}
      onSearch={setSearch}
      notFoundContent={notFound}
      onChange={(id: string) => onChange?.(id, list.find((p) => p.id === id))}
      optionLabelProp="label"
      options={list.map((p) => ({ value: p.id, label: `${shortName(p)} · ${formatPhone(p.phone)}`, p }))}
      optionRender={(o) => <Option p={(o.data as { p: PatientRow }).p} />}
      popupMatchSelectWidth={360}
    />
  );
};
