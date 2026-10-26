import { AutoComplete, Input, type InputRef } from 'antd';
import { Search } from '@/shared/icons';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { formatAge, formatPhone, shortName } from '@/shared/utils/format';
import { ROUTES } from '@/shared/constants/routes';
import { usePatientSearch } from '@/modules/patients';

/** Bemor qidiruvi: ism, telefon (+998 siz ham), karta raqami. "/" tugmasi bilan fokus. */
export const GlobalSearch = () => {
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const q = useDebounce(value.trim(), 250);
  const { data = [], isFetching } = usePatientSearch(q, q.length >= 2);
  const ref = useRef<InputRef>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(target.tagName) && !target.isContentEditable) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <AutoComplete
      value={value}
      onChange={setValue}
      className="w-full max-w-md"
      popupMatchSelectWidth
      onSelect={(id: string) => {
        setValue('');
        navigate(ROUTES.patient(id));
      }}
      notFoundContent={q.length >= 2 && !isFetching ? 'Bemor topilmadi' : null}
      options={
        q.length >= 2
          ? data.slice(0, 8).map((p) => ({
              value: p.id,
              label: (
                <div className="flex items-center justify-between gap-3 py-0.5">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{shortName(p)}</div>
                    <div className="text-xs text-muted">
                      {p.birthDate ? `${p.cardNo} · ${formatAge(p.birthDate)}` : p.cardNo}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted">{formatPhone(p.phone)}</span>
                </div>
              ),
            }))
          : []
      }
    >
      <Input
        ref={ref}
        className="rounded-pill bg-surface hover:bg-surface"
        variant="filled"
        aria-label="Bemor qidirish"
        prefix={<Search size={20} strokeWidth={1.5} className="text-muted" />}
        suffix={<kbd className="hidden rounded-pill bg-subtle px-2 font-sans text-xs text-muted lg:inline">/</kbd>}
        placeholder="Bemor: ism, telefon yoki karta №"
      />
    </AutoComplete>
  );
};
