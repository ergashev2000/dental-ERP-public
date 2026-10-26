import { Input } from 'antd';
import { Search } from '@/shared/icons';
import { useMemo, useState } from 'react';
import { SERVICE_CATEGORIES } from '@/shared/constants/options';
import { formatMoney } from '@/shared/utils/format';
import { usePopularServiceIds, useServices, type Service } from '@/modules/services';

const POPULAR = 'POPULAR';
const ALL = 'ALL';
const POPULAR_COUNT = 8;

interface Props {
  onPick: (service: Service) => void;
  /** Hozir "qurollangan" (tish kutayotgan) xizmat — ajratib ko'rsatiladi */
  activeId?: string | null;
  disabled?: boolean;
}

/**
 * Tez xizmat tanlash: tugmalar paneli. Boshida eng ko'p qilinadiganlari,
 * keyin kategoriya bo'yicha hammasi. Qidiruv kod yoki nom bo'yicha.
 */
export const ServicePicker = ({ onPick, activeId, disabled }: Props) => {
  const { data = [] } = useServices({ activeOnly: true });
  const { data: popularIds = [] } = usePopularServiceIds();
  const [tab, setTab] = useState<string>(POPULAR);
  const [q, setQ] = useState('');

  const popular = useMemo(() => {
    const rank = new Map(popularIds.map((id, i) => [id, i]));
    return [...data].sort((a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999)).slice(0, POPULAR_COUNT);
  }, [data, popularIds]);

  const tabs = useMemo(
    () => [
      { key: POPULAR, label: 'Ko‘p qilinadigan' },
      ...SERVICE_CATEGORIES.filter((c) => data.some((s) => s.category === c)).map((c) => ({ key: c, label: c })),
      { key: ALL, label: 'Barchasi' },
    ],
    [data],
  );

  const term = q.trim().toLowerCase();
  const list = term
    ? data.filter((s) => `${s.code} ${s.name}`.toLowerCase().includes(term))
    : tab === POPULAR
      ? popular
      : tab === ALL
        ? data
        : data.filter((s) => s.category === tab);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          allowClear
          size="small"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          prefix={<Search size={14} strokeWidth={1.75} className="text-muted" />}
          placeholder="Qidirish: nom yoki kod"
          className="w-full sm:w-56"
        />
        {!term && (
          <div className="flex flex-wrap gap-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  tab === t.key ? 'border-primary-500 bg-primary-500 text-white' : 'border-line-soft bg-surface text-ink hover:border-primary-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!list.length ? (
        <div className="rounded-md bg-neutral-50 px-3 py-2.5 text-sm text-muted">Xizmat topilmadi</div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 2xl:grid-cols-4">
          {list.map((s) => {
            const active = s.id === activeId;
            return (
              <button
                key={s.id}
                type="button"
                disabled={disabled}
                onClick={() => onPick(s)}
                title={`${s.code} · ${s.name}`}
                className={`flex min-h-16 cursor-pointer flex-col items-start justify-between gap-1 rounded-md border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  active ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' : 'border-line-soft bg-surface hover:border-primary-400 hover:bg-primary-50'
                }`}
              >
                <span className="line-clamp-2 text-sm font-medium leading-snug text-ink">{s.name}</span>
                <span className="flex w-full items-center gap-2 text-xs text-muted">
                  <span className="font-semibold">{s.code}</span>
                  {s.perTooth && <span className="rounded-sm bg-neutral-100 px-1.5">tishga</span>}
                  <span className="ml-auto tabular-nums">{formatMoney(s.price)}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
