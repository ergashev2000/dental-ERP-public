import { Select } from 'antd';
import { Search } from '@/shared/icons';
import { formatNumber } from '@/shared/utils/format';
import type { ProductRow } from '../types';

interface Option {
  value: string;
  label: string;
  search: string;
  p: ProductRow;
}

/** Mahsulot qidirish: tanlanganda qator qo'shiladi, maydon yana bo'sh qoladi */
export const ProductSearch = ({
  products,
  onPick,
  loading,
  placeholder = 'Mahsulot qo‘shish — nomi yoki SKU',
}: {
  products: ProductRow[];
  onPick: (p: ProductRow) => void;
  loading?: boolean;
  placeholder?: string;
}) => (
  <Select<string | null, Option>
    showSearch
    value={null}
    loading={loading}
    className="w-full"
    placeholder={placeholder}
    prefix={<Search size={16} strokeWidth={1.5} className="text-muted" />}
    options={products.map((p) => ({ value: p.id, label: p.name, search: `${p.name} ${p.sku ?? ''}`.toLowerCase(), p }))}
    filterOption={(input, o) => !!o && o.search.includes(input.trim().toLowerCase())}
    notFoundContent={<span className="text-sm text-muted">Mahsulot topilmadi</span>}
    optionRender={(o) => (
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate">{o.data.p.name}</span>
        <span className="shrink-0 text-xs tabular-nums text-muted">
          {formatNumber(o.data.p.stock, 2)} {o.data.p.unit}
        </span>
      </div>
    )}
    onChange={(id) => {
      const p = products.find((x) => x.id === id);
      if (p) onPick(p);
    }}
  />
);
