import { Select } from 'antd';
import { useMemo } from 'react';
import { SERVICE_CATEGORIES } from '@/shared/constants/options';
import { formatMoney } from '@/shared/utils/format';
import { useServices, type Service } from '@/modules/services';

type Common = {
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Faqat tish bo'yicha xizmatlar va h.k. */
  filter?: (s: Service) => boolean;
};

type Props =
  | (Common & { mode: 'multiple'; value?: string[]; onChange?: (ids: string[], services: Service[]) => void })
  | (Common & { mode?: undefined; value?: string; onChange?: (id: string, service?: Service) => void });

/** Kategoriya bo'yicha guruhlangan xizmat tanlash, narxi ko'rinadi */
export const ServiceSelect = (props: Props) => {
  const { data = [], isLoading } = useServices({ activeOnly: true });
  const { filter } = props;
  const list = useMemo(() => data.filter((s) => !filter || filter(s)), [data, filter]);

  const options = SERVICE_CATEGORIES.map((cat) => ({
    label: cat,
    title: cat,
    options: list
      .filter((s) => s.category === cat)
      .map((s) => ({
        value: s.id,
        search: `${s.code} ${s.name}`.toLowerCase(),
        label: (
          <span className="flex items-center gap-2">
            <span className="w-11 shrink-0 text-xs font-semibold text-muted">{s.code}</span>
            <span className="truncate">{s.name}</span>
            <span className="ml-auto pl-3 text-xs tabular-nums text-muted">{formatMoney(s.price)}</span>
          </span>
        ),
      })),
  })).filter((g) => g.options.length);

  const common = {
    showSearch: true,
    loading: isLoading,
    placeholder: props.placeholder ?? 'Xizmat tanlang',
    disabled: props.disabled,
    className: props.className,
    options,
    popupMatchSelectWidth: 440,
    filterOption: (input: string, o?: unknown) => !!(o as { search?: string } | undefined)?.search?.includes(input.toLowerCase()),
  };

  if (props.mode === 'multiple') {
    return (
      <Select
        {...common}
        mode="multiple"
        value={props.value}
        onChange={(ids: string[]) => props.onChange?.(ids, list.filter((s) => ids.includes(s.id)))}
        tagRender={({ value, closable, onClose }) => {
          const s = list.find((x) => x.id === value);
          return (
            <span className="my-0.5 me-1 inline-flex items-center gap-1 rounded-sm bg-neutral-100 px-2 py-0.5 text-xs font-medium">
              {s ? `${s.code} · ${s.name}` : String(value)}
              {closable && (
                <button type="button" onClick={onClose} className="cursor-pointer border-0 bg-transparent p-0 text-muted" aria-label="Olib tashlash">
                  ×
                </button>
              )}
            </span>
          );
        }}
      />
    );
  }
  return <Select {...common} value={props.value} onChange={(id: string) => props.onChange?.(id, list.find((s) => s.id === id))} />;
};
