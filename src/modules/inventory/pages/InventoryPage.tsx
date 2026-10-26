import { App, Button, Segmented, Select, Table, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { AppIcon } from '@/shared/icons';
import { Hourglass, Package, PackagePlus, PackageX, Plus, Wallet } from '@/shared/icons';
import { useMemo, useState, type ReactNode } from 'react';
import dayjs from '@/shared/lib/dayjs';
import { EmptyState, ErrorState, FilterBar, MoneyText, PageHeader, Panel, SearchInput, StatCard, StatusTag } from '@/shared/components/ui';
import { PRODUCT_CATEGORIES } from '@/shared/constants/options';
import { MOVEMENT_TYPE, STOCK_STATE } from '@/shared/constants/status';
import { usePermission, usePermissions } from '@/shared/hooks/usePermission';
import { cn } from '@/shared/utils/cn';
import { formatDate, formatDateTime, formatMoney, formatNumber } from '@/shared/utils/format';
import { IssueForm } from '../components/IssueForm';
import { MovementQty, ProductDrawer, ProductFormDrawer } from '../components/ProductDrawers';
import { ReceiptForm, type ReceiptDraft } from '../components/ReceiptForm';
import { SuppliersTab } from '../components/SuppliersTab';
import { INVENTORY_TABS, MOVEMENT_TYPES, STOCK_FILTERS, useInventoryParams, useMovements, useProducts } from '../hooks/useInventory';
import type { MovementView, Product, ProductRow } from '../types';
import { needsReorder, suggestReorder } from '../utils/reorder';

type StockFilter = (typeof STOCK_FILTERS)[number];

const STOCK_LABEL: Record<StockFilter, string> = { all: 'Hammasi', low: 'Kam qoldi', out: 'Tugagan', expiring: 'Muddati yaqin' };
const REORDER_PREVIEW = 6;

/** Muddati yaqin: API'dagi "expiring" filtri bilan bir xil (30 kun yoki o'tgan) */
const isExpiring = (r: ProductRow) => r.state === 'EXPIRING' || r.state === 'EXPIRED' || (!!r.nearestExpiry && dayjs(r.nearestExpiry).diff(dayjs(), 'day') < 30);

/** Bosiladigan KPI plitkasi — mahsulotlar jadvalini filtrlaydi */
const FilterTile = ({ active, onClick, children, className }: { active: boolean; onClick: () => void; children: ReactNode; className?: string }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={cn('cursor-pointer rounded-card border-0 bg-transparent p-0 text-left transition-shadow duration-150 hover:ring-2 hover:ring-line', active && 'ring-2 ring-ink hover:ring-ink', className)}
  >
    {children}
  </button>
);

export const InventoryPage = () => {
  const [p, setP] = useInventoryParams();
  const can = usePermissions();
  const canManage = usePermission('inventory.manage');
  const canIn = can('inventory.in');
  const { message } = App.useApp();
  const all = useProducts();
  const products = useProducts({ q: p.tab === 'products' ? p.q : null, category: p.category, stock: p.stock });
  const movements = useMovements({ q: p.tab === 'movements' ? p.q : null, type: p.type, page: p.page, pageSize: 15 });
  const [editing, setEditing] = useState<Product | null | undefined>(undefined);
  const [draft, setDraft] = useState<ReceiptDraft | null>(null);
  const [showAllReorder, setShowAllReorder] = useState(false);
  const set = (patch: Partial<typeof p>) => void setP({ ...patch, page: 1 });

  const stats = useMemo(() => {
    const rows = all.data ?? [];
    return {
      count: rows.length,
      low: rows.filter((r) => r.stock > 0 && r.stock <= r.minStock).length,
      out: rows.filter((r) => r.stock <= 0).length,
      expiring: rows.filter(isExpiring).length,
      value: rows.reduce((s, r) => s + Math.max(r.stock, 0) * r.avgCost, 0),
      reorder: rows.filter(needsReorder).sort((a, b) => a.stock / (a.minStock || 1) - b.stock / (b.minStock || 1)),
    };
  }, [all.data]);

  const showStock = (stock: StockFilter) => set({ tab: 'products', q: null, stock: p.tab === 'products' && p.stock === stock ? 'all' : stock });

  const toReceipt = (rows: ProductRow[]) => {
    setDraft((d) => ({ id: (d?.id ?? 0) + 1, lines: rows.map((r) => ({ productId: r.id, qty: suggestReorder(r) || 1, unitCost: Math.round(r.avgCost) })) }));
    void setP({ tab: 'receipt', product: null, page: 1, q: null });
    message.success(rows.length === 1 ? `${rows[0].name} kirimga qo‘shildi` : `${rows.length} ta mahsulot kirimga qo‘shildi`);
  };

  const tiles: { key: StockFilter; title: string; icon: AppIcon; value: number; hint: ReactNode }[] = [
    {
      key: 'low',
      title: 'Kam qoldi',
      icon: Package,
      value: stats.low,
      hint: stats.low ? <StatusTag tone="warning">Buyurtma kerak</StatusTag> : 'Hammasi yetarli',
    },
    {
      key: 'out',
      title: 'Tugagan',
      icon: PackageX,
      value: stats.out,
      hint: stats.out ? <StatusTag tone="danger">Omborda yo‘q</StatusTag> : 'Tugagan mahsulot yo‘q',
    },
    { key: 'expiring', title: 'Muddati yaqin', icon: Hourglass, value: stats.expiring, hint: '30 kun ichida yoki o‘tgan' },
  ];

  const reorderShown = showAllReorder ? stats.reorder : stats.reorder.slice(0, REORDER_PREVIEW);

  const productColumns: ColumnsType<ProductRow> = [
    {
      title: 'Nomi',
      dataIndex: 'name',
      render: (v: string, r) => (
        <div className="leading-tight">
          <div className="max-w-72 truncate font-medium" title={v}>
            {v}
          </div>
          {r.sku && <div className="text-xs text-muted">{r.sku}</div>}
        </div>
      ),
    },
    { title: 'Kategoriya', dataIndex: 'category', responsive: ['lg'] },
    {
      title: 'Qoldiq',
      dataIndex: 'stock',
      align: 'right',
      render: (v: number, r) => (
        <span className="whitespace-nowrap font-medium tabular-nums">
          {formatNumber(v, 2)} <span className="text-xs font-normal text-muted">{r.unit}</span>
        </span>
      ),
    },
    { title: 'Min.', dataIndex: 'minStock', align: 'right', responsive: ['md'], render: (v: number) => <span className="tabular-nums text-muted">{formatNumber(v)}</span> },
    { title: 'O‘rt. tannarx', dataIndex: 'avgCost', align: 'right', responsive: ['xl'], render: (v: number) => <MoneyText value={v} /> },
    { title: 'Yaroqlilik', dataIndex: 'nearestExpiry', responsive: ['lg'], render: (v?: string) => <span className="tabular-nums">{formatDate(v)}</span> },
    { title: 'Holat', dataIndex: 'state', render: (s: ProductRow['state']) => <StatusTag meta={STOCK_STATE[s]} /> },
  ];

  const movementColumns: ColumnsType<MovementView> = [
    { title: 'Sana', dataIndex: 'createdAt', render: (v: string) => <span className="tabular-nums">{formatDateTime(v)}</span> },
    { title: 'Mahsulot', dataIndex: 'productName', render: (v: string) => <span className="block max-w-64 truncate" title={v}>{v}</span> },
    { title: 'Tur', dataIndex: 'type', render: (t: MovementView['type']) => <StatusTag meta={MOVEMENT_TYPE[t]} dot={false} /> },
    { title: 'Miqdor', key: 'q', align: 'right', render: (_, m) => <MovementQty m={m} /> },
    { title: 'Qoldiq', dataIndex: 'balanceAfter', align: 'right', responsive: ['md'], render: (v: number) => <span className="tabular-nums">{formatNumber(v, 2)}</span> },
    { title: 'Kim', dataIndex: 'byName', responsive: ['lg'] },
    { title: 'Hujjat', key: 'ref', responsive: ['lg'], render: (_, m) => <span className="block max-w-56 truncate text-xs text-muted" title={m.refLabel ?? m.reason}>{m.refLabel ?? m.reason ?? '—'}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Ombor"
        breadcrumb={[{ label: 'Bosh sahifa', to: '/' }, { label: 'Ombor' }]}
        description="Qoldiq, kirim va chiqim. Kam qolgan va muddati yaqin mahsulotlar shu yerda ko‘rinadi"
        actions={
          <>
            {canIn && (
              <Button icon={<PackagePlus size={18} strokeWidth={1.5} />} className="bg-surface" onClick={() => void setP({ tab: 'receipt', page: 1, q: null })}>
                Kirim qilish
              </Button>
            )}
            {canManage && (
              <Button type="primary" icon={<Plus size={18} strokeWidth={1.5} />} onClick={() => setEditing(null)}>
                Yangi mahsulot
              </Button>
            )}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        {tiles.map((t) => (
          <FilterTile key={t.key} active={p.tab === 'products' && p.stock === t.key} onClick={() => showStock(t.key)}>
            <StatCard icon={t.icon} title={t.title} value={t.value} hint={t.hint} loading={all.isLoading} />
          </FilterTile>
        ))}
        <div className="col-span-2 xl:col-span-1">
          <StatCard
            icon={Wallet}
            title="Jami qiymat"
            loading={all.isLoading}
            value={
              <>
                {formatMoney(Math.round(stats.value), false)} <span className="text-[0.55em] text-muted">so‘m</span>
              </>
            }
            hint={`${stats.count} ta mahsulot, tannarx bo‘yicha`}
          />
        </div>
      </div>

      {stats.reorder.length > 0 && (
        <Panel
          className="mb-6"
          title="Buyurtma kerak"
          extra={
            canIn && (
              <Button icon={<PackagePlus size={18} strokeWidth={1.5} />} onClick={() => toReceipt(stats.reorder)}>
                Hammasini kirimga
              </Button>
            )
          }
        >
          <p className="mb-4 mt-0 text-sm text-muted">
            Minimal qoldiqqa yetgan mahsulotlar. Taklif — minimal qoldiqning ikki barobarigacha to‘ldirish uchun taxminiy miqdor; yetkazib beruvchi bilan kelishib o‘zgartiring.
          </p>
          <div className="grid gap-1.5 rounded-sheet bg-panel p-1.5 sm:grid-cols-2 xl:grid-cols-3">
            {reorderShown.map((r) => (
              <div key={r.id} className="flex flex-col gap-3 rounded-card bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    className="min-w-0 cursor-pointer border-0 bg-transparent p-0 text-left text-ink hover:underline"
                    onClick={() => void setP({ product: r.id })}
                  >
                    <div className="truncate text-sm font-medium" title={r.name}>
                      {r.name}
                    </div>
                    <div className="text-xs text-muted">{r.category}</div>
                  </button>
                  <StatusTag meta={STOCK_STATE[r.stock <= 0 ? 'OUT' : 'LOW']} />
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted">Qoldiq / minimal</div>
                    <div className="text-sm tabular-nums text-ink">
                      {formatNumber(r.stock, 2)} / {formatNumber(r.minStock)} <span className="text-xs text-muted">{r.unit}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted">Taklif</div>
                    <div className="text-xl tabular-nums text-ink">
                      {formatNumber(suggestReorder(r))} <span className="text-[0.55em] text-muted">{r.unit}</span>
                    </div>
                  </div>
                </div>
                {canIn && (
                  <Button size="small" className="self-start" icon={<Plus size={16} strokeWidth={1.5} />} onClick={() => toReceipt([r])}>
                    Kirimga qo‘shish
                  </Button>
                )}
              </div>
            ))}
          </div>
          {stats.reorder.length > REORDER_PREVIEW && (
            <Button type="text" className="mt-3" onClick={() => setShowAllReorder((v) => !v)}>
              {showAllReorder ? 'Kamroq ko‘rsatish' : `Yana ${stats.reorder.length - REORDER_PREVIEW} ta mahsulot`}
            </Button>
          )}
        </Panel>
      )}

      <Panel className="flex-1" bodyClassName="px-3 pb-4 md:px-4">
        <Tabs
          activeKey={p.tab}
          onChange={(k) => void setP({ tab: k as (typeof INVENTORY_TABS)[number], page: 1, q: null })}
          items={[
            {
              key: 'products',
              label: 'Mahsulotlar',
              children: (
                <>
                  <FilterBar active={!!(p.q || p.category || p.stock !== 'all')} onReset={() => set({ q: null, category: null, stock: 'all' })}>
                    <SearchInput value={p.q} onChange={(q) => set({ q })} placeholder="Nomi yoki SKU" />
                    <Select allowClear placeholder="Kategoriya" className="w-full sm:w-44" value={p.category ?? undefined} onChange={(c?: string) => set({ category: c ?? null })} options={PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c }))} />
                    <div className="max-w-full overflow-x-auto">
                      <Segmented value={p.stock} onChange={(s) => set({ stock: s as StockFilter })} options={STOCK_FILTERS.map((s) => ({ value: s, label: STOCK_LABEL[s] }))} />
                    </div>
                  </FilterBar>
                  {products.isError ? (
                    <ErrorState error={products.error} onRetry={() => void products.refetch()} />
                  ) : (
                    <Table
                      rowKey="id"
                      size="middle"
                      loading={products.isFetching}
                      columns={productColumns}
                      dataSource={products.data}
                      scroll={{ x: 560 }}
                      pagination={false}
                      onRow={(r) => ({ onClick: () => void setP({ product: r.id }), className: 'cursor-pointer' })}
                      locale={{ emptyText: <EmptyState title="Mahsulot topilmadi" description="Qidiruv yoki filtrni o‘zgartiring, yoki yangi mahsulot qo‘shing" /> }}
                    />
                  )}
                </>
              ),
            },
            ...(canIn ? [{ key: 'receipt', label: 'Kirim', children: <ReceiptForm draft={draft} /> }] : []),
            ...(can('inventory.out') ? [{ key: 'issue', label: 'Chiqim', children: <IssueForm /> }] : []),
            {
              key: 'movements',
              label: 'Harakatlar tarixi',
              children: (
                <>
                  <FilterBar active={!!(p.q || p.type)} onReset={() => set({ q: null, type: null })}>
                    <SearchInput value={p.q} onChange={(q) => set({ q })} placeholder="Mahsulot yoki hujjat" />
                    <Select allowClear placeholder="Turi" className="w-full sm:w-52" value={p.type ?? undefined} onChange={(t?: (typeof MOVEMENT_TYPES)[number]) => set({ type: t ?? null })} options={MOVEMENT_TYPES.map((t) => ({ value: t, label: MOVEMENT_TYPE[t].label }))} />
                  </FilterBar>
                  <Table
                    rowKey="id"
                    size="middle"
                    loading={movements.isFetching}
                    columns={movementColumns}
                    dataSource={movements.data?.items}
                    scroll={{ x: 640 }}
                    pagination={{ current: p.page, pageSize: 15, total: movements.data?.total, showSizeChanger: false, onChange: (page) => void setP({ page }) }}
                    locale={{ emptyText: <EmptyState title="Harakatlar yo‘q" description="Kirim yoki chiqim qilinganda shu yerda ko‘rinadi" /> }}
                  />
                </>
              ),
            },
            { key: 'suppliers', label: 'Yetkazib beruvchilar', children: <SuppliersTab /> },
          ]}
        />
      </Panel>
      <ProductDrawer id={p.product} onClose={() => void setP({ product: null })} onEdit={(pr) => setEditing(pr)} onReorder={canIn ? (pr) => toReceipt([pr]) : undefined} />
      <ProductFormDrawer open={editing !== undefined} product={editing} onClose={() => setEditing(undefined)} />
    </>
  );
};
