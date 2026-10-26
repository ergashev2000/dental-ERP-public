import { App, Button, Switch, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ClipboardList, Pencil, Plus } from '@/shared/icons';
import { useState } from 'react';
import { Can, EmptyState, ErrorState, FilterBar, PageHeader, Panel, SearchInput } from '@/shared/components/ui';
import { SERVICE_CATEGORIES } from '@/shared/constants/options';
import { usePermission } from '@/shared/hooks/usePermission';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { formatDuration, formatMoney } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import { ServiceFormDrawer } from '../components/ServiceFormDrawer';
import { useServices, useServicesParams, useToggleService } from '../hooks/useServices';
import type { Service } from '../types';

/** Jadval qatori: xizmat yoki kategoriya sarlavhasi ("Barchasi" ko'rinishida guruhlash uchun) */
type Row = (Service & { kind: 'service' }) | { kind: 'group'; id: string; category: string; count: number };

export const ServicesPage = () => {
  const [params, setParams] = useServicesParams();
  const { data: all = [], isLoading, isError, error, refetch } = useServices();
  const canManage = usePermission('service.manage');
  const toggle = useToggleService();
  const { message } = App.useApp();
  const [editing, setEditing] = useState<Service | null | undefined>(undefined);

  const q = params.q?.toLowerCase() ?? '';
  const filtered = all.filter(
    (s) => (!params.category || s.category === params.category) && (!q || `${s.code} ${s.name}`.toLowerCase().includes(q)),
  );

  // Kategoriya tanlanmagan bo'lsa — kategoriyalar bo'yicha guruhlangan
  const categories = [...SERVICE_CATEGORIES, ...new Set(all.map((s) => s.category).filter((c) => !(SERVICE_CATEGORIES as readonly string[]).includes(c)))];
  const rows: Row[] = params.category
    ? filtered.map((s) => ({ ...s, kind: 'service' }))
    : categories.flatMap((c) => {
        const items = filtered.filter((s) => s.category === c);
        if (!items.length) return [];
        return [{ kind: 'group' as const, id: `g:${c}`, category: c, count: items.length }, ...items.map((s) => ({ ...s, kind: 'service' as const }))];
      });

  const cols: ColumnsType<Row>[number][] = [
    {
      title: 'Kod',
      key: 'code',
      width: 88,
      render: (_, r) =>
        r.kind === 'group' ? (
          <div className="flex items-baseline gap-2 pt-2">
            <span className="text-base font-normal text-ink">{r.category}</span>
            <span className="text-xs tabular-nums text-muted">{r.count} ta</span>
          </div>
        ) : (
          <span className="font-medium tabular-nums text-muted">{r.code}</span>
        ),
    },
    {
      title: 'Xizmat',
      key: 'name',
      render: (_, r) =>
        r.kind === 'service' && (
          <div className="min-w-0 leading-tight">
            <span className={cn('block max-w-80 truncate', r.isActive ? 'text-ink' : 'text-muted')} title={r.name}>
              {r.name}
            </span>
            {(r.perTooth || r.materials.length > 0 || !r.isActive) && (
              <span className="mt-0.5 block text-xs text-muted">
                {[!r.isActive && 'Nofaol', r.perTooth && 'Har bir tish uchun', r.materials.length > 0 && `${r.materials.length} ta material`].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
        ),
    },
    {
      title: 'Davomiylik',
      key: 'dur',
      align: 'right',
      render: (_, r) => r.kind === 'service' && <span className="whitespace-nowrap tabular-nums">{formatDuration(r.durationMin)}</span>,
    },
    {
      title: 'Narx',
      key: 'price',
      align: 'right',
      render: (_, r) =>
        r.kind === 'service' && (
          <span className={cn('whitespace-nowrap tabular-nums font-medium', !r.isActive && 'text-muted')}>
            {formatMoney(r.price, false)} <span className="text-xs font-normal text-muted">so‘m</span>
          </span>
        ),
    },
    {
      title: 'Faol',
      key: 'active',
      width: 72,
      render: (_, r) =>
        r.kind === 'service' && (
          <Switch
            size="small"
            checked={r.isActive}
            disabled={!canManage}
            aria-label={r.isActive ? 'Nofaol qilish' : 'Faollashtirish'}
            loading={toggle.isPending && toggle.variables?.id === r.id}
            onChange={(isActive) => toggle.mutate({ id: r.id, isActive }, { onError: (e) => message.error(errorMessage(e)) })}
          />
        ),
    },
    ...(canManage
      ? [
          {
            key: 'a',
            width: 56,
            render: (_: unknown, r: Row) =>
              r.kind === 'service' && (
                <Button shape="circle" aria-label="Tahrirlash" icon={<Pencil size={18} strokeWidth={1.5} />} onClick={() => setEditing(all.find((s) => s.id === r.id) ?? null)} />
              ),
          },
        ]
      : []),
  ];
  // Kategoriya sarlavhasi butun qatorni egallaydi
  const columns = cols.map((c, i) => ({
    ...c,
    onCell: (r: Row) => (r.kind === 'group' ? { colSpan: i === 0 ? cols.length : 0 } : {}),
  })) as ColumnsType<Row>;

  const counts = (cat: string | null) => all.filter((s) => !cat || s.category === cat).length;
  const chips = [null, ...categories.filter((c) => counts(c) > 0)];

  return (
    <>
      <PageHeader
        title="Xizmatlar"
        breadcrumb={[{ label: 'Bosh sahifa', to: '/' }, { label: 'Sozlamalar' }, { label: 'Xizmatlar' }]}
        description={`Narxlar katalogi va material normalari · ${all.length} ta xizmat`}
        actions={
          <Can perm="service.manage">
            <Button type="primary" icon={<Plus size={18} strokeWidth={1.5} />} onClick={() => setEditing(null)}>
              Xizmat qo‘shish
            </Button>
          </Can>
        }
      />
      <Panel className="flex-1" bodyClassName="p-3 md:p-4">
        <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Kategoriya">
          {chips.map((c) => {
            const active = (params.category ?? null) === c;
            return (
              <button
                key={c ?? 'all'}
                type="button"
                aria-pressed={active}
                onClick={() => void setParams({ category: c })}
                className={cn(
                  'inline-flex h-8 cursor-pointer items-center gap-2 rounded-pill border-0 px-3.5 text-xs transition-colors duration-150',
                  active ? 'bg-ink text-on-ink' : 'bg-subtle text-ink hover:bg-subtle-strong',
                )}
              >
                {c ?? 'Barchasi'}
                <span className={cn('tabular-nums', active ? 'text-on-dark-muted' : 'text-muted')}>{counts(c)}</span>
              </button>
            );
          })}
        </div>
        <FilterBar active={!!(params.q || params.category)} onReset={() => void setParams({ q: null, category: null })}>
          <SearchInput value={params.q} onChange={(v) => void setParams({ q: v })} placeholder="Kod yoki nomi" />
        </FilterBar>
        {isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : (
          <Table<Row>
            rowKey="id"
            size="middle"
            loading={isLoading}
            columns={columns}
            dataSource={rows}
            pagination={false}
            scroll={{ x: 'max-content' }}
            rowClassName={(r) => (r.kind === 'group' ? 'pointer-events-none' : '')}
            locale={{
              emptyText: (
                <EmptyState
                  icon={ClipboardList}
                  title="Xizmat topilmadi"
                  description="Qidiruv yoki kategoriyani o‘zgartiring"
                  action={
                    <Can perm="service.manage">
                      <Button onClick={() => setEditing(null)}>Xizmat qo‘shish</Button>
                    </Can>
                  }
                />
              ),
            }}
          />
        )}
      </Panel>
      <ServiceFormDrawer open={editing !== undefined} service={editing} onClose={() => setEditing(undefined)} />
    </>
  );
};
