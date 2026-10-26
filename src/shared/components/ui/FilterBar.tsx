import { Button, Input } from 'antd';
import { Search, X } from '@/shared/icons';
import { useEffect, useState, type ReactNode } from 'react';

interface SearchProps {
  value?: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  className?: string;
}

/** URL bilan sinxron qidiruv (nuqs throttle 300ms ishlatiladi) */
export const SearchInput = ({ value, onChange, placeholder = 'Qidirish…', className = 'w-full sm:w-72!' }: SearchProps) => {
  const [local, setLocal] = useState(value ?? '');
  // oxlint-disable-next-line react/set-state-in-effect -- URL qiymati tashqaridan o'zgarsa (filtr tozalash) maydonni sinxronlash
  useEffect(() => setLocal(value ?? ''), [value]);
  return (
    <Input
      allowClear
      value={local}
      className={className}
      prefix={<Search size={16} strokeWidth={1.75} className="text-muted" />}
      placeholder={placeholder}
      onChange={(e) => {
        setLocal(e.target.value);
        onChange(e.target.value || null);
      }}
    />
  );
};

/** Filtrlar qatori va "Tozalash" tugmasi */
export const FilterBar = ({ children, active, onReset, extra }: { children: ReactNode; active?: boolean; onReset?: () => void; extra?: ReactNode }) => (
  <div className="mb-4 flex flex-wrap items-center gap-3">
    {children}
    {active && onReset && (
      <Button type="text" onClick={onReset} icon={<X size={16} strokeWidth={1.75} />}>
        Tozalash
      </Button>
    )}
    {extra && <div className="ml-auto flex flex-wrap items-center gap-2">{extra}</div>}
  </div>
);
