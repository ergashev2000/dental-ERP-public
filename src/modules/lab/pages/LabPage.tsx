import { Button, Segmented, Select, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { FlaskLab, Plus } from '@/shared/icons';
import { Can, EmptyState, ErrorState, FilterBar, MoneyText, PageHeader, Panel, SearchInput, StatusTag } from '@/shared/components/ui';
import { ROUTES } from '@/shared/constants/routes';
import { usePermission } from '@/shared/hooks/usePermission';
import { matches } from '@/shared/lib/mock/mockRequest';
import { cn } from '@/shared/utils/cn';
import { LAB_PIPELINE, LAB_STATUS, LAB_WORK_TYPE, teethLabel } from '../constants';
import { useLabOrders, useLabs } from '../hooks/useLab';
import type { LabOrderView, LabStatusFilter } from '../types';
import { LabDueText, NextStatusButton } from '../components/LabBits';
import { LabOrderDetailDrawer } from '../components/LabOrderDetailDrawer';
import { LabOrderFormDrawer } from '../components/LabOrderFormDrawer';

const SEGMENTS: { value: LabStatusFilter; label: string }[] = [
  { value: 'ACTIVE', label: 'Faol' },
  { value: 'FITTED', label: 'O‘rnatilgan' },
  { value: 'ALL', label: 'Hammasi' },
];

const byFilter = (f: LabStatusFilter) => (o: LabOrderView) =>
  f === 'ALL' ? true : f === 'ACTIVE' ? o.status !== 'FITTED' : f === 'OVERDUE' ? o.overdue : o.status === f;

/** Status hisoblagich plitkasi — bosilganda shu status bo‘yicha filtr; aktivi lime (qatordagi yagona lime) */
const CounterTile = ({ label, count, active, alert, onClick }: { label: string; count: number; active: boolean; alert?: boolean; onClick: () => void }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={cn(
      'flex min-w-0 cursor-pointer flex-col items-start gap-1 rounded-md border-0 px-4 py-3 text-left transition-colors',
      active ? 'bg-lime text-on-lime' : alert ? 'bg-danger-soft text-danger hover:bg-danger-soft/70' : 'bg-surface text-ink hover:bg-subtle',
    )}
  >
    <span className={cn('truncate text-xs', !active && !alert && 'text-muted')}>{label}</span>
    <span className="text-2xl font-normal tabular-nums leading-none">{count}</span>
  </button>
);

/** Laboratoriya: tish texnikiga buyurtmalar (toj, ko‘prik, protez, kappa) va qaytish muddati nazorati */
export const LabPage = () => {
  const { data = [], isLoading, isFetching, isError, error, refetch } = useLabOrders();
  const { data: labs = [] } = useLabs();
  const canManage = usePermission('lab.manage');
  const [status, setStatus] = useState<LabStatusFilter>('ACTIVE');
  const [q, setQ] = useState<string | null>(null);
  const [labId, setLabId] = useState<string | undefined>();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState<{ order: LabOrderView | null } | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { OVERDUE: data.filter((o) => o.overdue).length };
    for (const s of LAB_PIPELINE) c[s] = data.filter((o) => o.status === s).length;
    return c;
  }, [data]);

  const rows = useMemo(
    () =>
      data
        .filter(byFilter(status))
        .filter((o) => !labId || o.labId === labId)
        .filter((o) => matches(q, o.patientName, o.patientPhone, o.patientCardNo, o.number, o.doctorName, LAB_WORK_TYPE[o.workType], o.teeth.join(' '))),
    [data, status, labId, q],
  );

  const detail = data.find((o) => o.id === detailId);
  const toggle = (s: LabStatusFilter) => setStatus((cur) => (cur === s ? 'ACTIVE' : s));
  const filtered = status !== 'ACTIVE' || !!labId || !!q;

  const columns: ColumnsType<LabOrderView> = [
    {
      title: 'Bemor',
      key: 'patient',
      render: (_, r) => (
        <span className="flex items-baseline gap-2 whitespace-nowrap">
          <span className="block max-w-48 truncate font-medium" title={r.patientName}>
            {r.patientName}
          </span>
          <span className="text-xs text-muted">{r.number}</span>
        </span>
      ),
    },
    { title: 'Tishlar', dataIndex: 'teeth', width: 120, render: (t: number[]) => <span className="block max-w-28 truncate tabular-nums" title={teethLabel(t)}>{teethLabel(t)}</span> },
    {
      title: 'Ish',
      key: 'work',
      render: (_, r) => {
        const text = `${LAB_WORK_TYPE[r.workType]}${r.shade ? ` · ${r.shade}` : ''}`;
        return (
          <span className="block max-w-52 truncate" title={text}>
            {text}
          </span>
        );
      },
    },
    { title: 'Laboratoriya', dataIndex: 'labName', responsive: ['md'], render: (v: string) => <span className="block max-w-44 truncate" title={v}>{v}</span> },
    { title: 'Shifokor', dataIndex: 'doctorName', responsive: ['xl'], render: (v: string) => <span className="whitespace-nowrap">{v}</span> },
    { title: 'Muddat', dataIndex: 'dueDate', render: (_, r) => <LabDueText o={r} /> },
    { title: 'Narx', dataIndex: 'price', align: 'right', responsive: ['xl'], render: (v: number) => <MoneyText value={v} /> },
    { title: 'Status', dataIndex: 'status', render: (s: LabOrderView['status']) => <StatusTag meta={LAB_STATUS[s]} /> },
    ...(canManage ? [{ key: 'next', title: '', align: 'right' as const, render: (_: unknown, r: LabOrderView) => <NextStatusButton o={r} /> }] : []),
  ];

  return (
    <>
      <PageHeader
        title="Laboratoriya"
        description="Tish texnikiga buyurtmalar va qaytish muddatlari"
        breadcrumb={[{ label: 'Bosh sahifa', to: ROUTES.dashboard }, { label: 'Laboratoriya' }]}
        actions={
          <Can perm="lab.manage">
            <Button type="primary" icon={<Plus size={18} strokeWidth={1.5} />} onClick={() => setForm({ order: null })}>
              Buyurtma berish
            </Button>
          </Can>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-6">
        {LAB_PIPELINE.map((s) => (
          <CounterTile key={s} label={LAB_STATUS[s].label} count={counts[s] ?? 0} active={status === s} onClick={() => toggle(s)} />
        ))}
        <CounterTile label="Muddati o‘tgan" count={counts.OVERDUE ?? 0} active={status === 'OVERDUE'} alert={(counts.OVERDUE ?? 0) > 0} onClick={() => toggle('OVERDUE')} />
      </div>

      <Panel className="flex-1" bodyClassName="p-3 md:p-4">
        <FilterBar
          active={filtered}
          onReset={() => {
            setStatus('ACTIVE');
            setLabId(undefined);
            setQ(null);
          }}
        >
          <SearchInput value={q} onChange={setQ} placeholder="Bemor, buyurtma № yoki tish" />
          <div className="max-w-full overflow-x-auto">
            <Segmented<LabStatusFilter> value={status} onChange={setStatus} options={SEGMENTS} />
          </div>
          <Select
            allowClear
            placeholder="Laboratoriya"
            value={labId}
            onChange={setLabId}
            options={labs.map((l) => ({ value: l.id, label: l.name }))}
            className="w-full sm:w-56"
          />
        </FilterBar>
        {isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : (
          <Table
            rowKey="id"
            size="middle"
            loading={isLoading || isFetching}
            columns={columns}
            dataSource={rows}
            scroll={{ x: 760 }}
            onRow={(r) => ({ onClick: () => setDetailId(r.id), className: 'cursor-pointer' })}
            pagination={rows.length > 15 ? { pageSize: 15, showSizeChanger: false, showTotal: (t) => `${t} ta buyurtma` } : false}
            locale={{
              emptyText: (
                <EmptyState
                  icon={FlaskLab}
                  title={filtered ? 'Mos buyurtma topilmadi' : 'Buyurtmalar yo‘q'}
                  description={filtered ? 'Filtrni o‘zgartirib ko‘ring' : 'Toj, protez yoki kappa uchun laboratoriyaga buyurtma bering'}
                />
              ),
            }}
          />
        )}
      </Panel>

      <LabOrderDetailDrawer
        order={detail}
        onClose={() => setDetailId(null)}
        onEdit={(o) => {
          setDetailId(null);
          setForm({ order: o });
        }}
      />
      <LabOrderFormDrawer open={!!form} order={form?.order} onClose={() => setForm(null)} />
    </>
  );
};
