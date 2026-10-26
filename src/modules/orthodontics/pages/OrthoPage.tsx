import { Button, Checkbox, Segmented, Select, Skeleton, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CalendarClock, CalendarPlus, CircleAlert, PhoneCall, Plus, Smile, Wallet, type AppIcon } from '@/shared/icons';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Can, DoctorSelect, EmptyState, ErrorState, FilterBar, PageHeader, Panel, PhoneText, SearchInput, StatusTag, UserAvatar } from '@/shared/components/ui';
import { ORTHO_STAGE } from '@/shared/constants/status';
import { ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/utils/cn';
import { formatDate } from '@/shared/utils/format';
import { useNewAppointment } from '@/modules/appointments';
import { AutoCallButton } from '../components/AutoCallButton';
import { ContactModal } from '../components/ContactModal';
import { OrthoCaseFormDrawer } from '../components/OrthoCaseFormDrawer';
import { PaymentState, StageBar, VisitDue } from '../components/OrthoBits';
import { ORTHO_STATUS_FILTERS, useOrthoCases, useOrthoParams, useOrthoStats } from '../hooks/useOrtho';
import { ORTHO_STAGES, type OrthoCaseView } from '../types';

const STATUS_LABEL: Record<(typeof ORTHO_STATUS_FILTERS)[number], string> = {
  ACTIVE: 'Davolanmoqda',
  PAUSED: 'To‘xtatilgan',
  FINISHED: 'Tugagan',
  ALL: 'Hammasi',
};

interface CounterProps {
  icon: AppIcon;
  label: string;
  value?: number;
  loading?: boolean;
  /** Tanlangan hisoblagich — qatordagi yagona lime blok */
  active?: boolean;
  onClick?: () => void;
  /** Qiymat > 0 bo'lganda so'z bilan status chip */
  alert?: ReactNode;
}

/** Ixcham hisoblagich-filtr: bosilsa ro'yxat shu bo'yicha filtrlanadi */
const Counter = ({ icon: Icon, label, value, loading, active, onClick, alert }: CounterProps) => {
  const body = (
    <>
      <span className={cn('hidden size-10 shrink-0 place-items-center rounded-full sm:grid', active ? 'bg-surface text-ink' : 'bg-subtle text-ink')}>
        <Icon size={20} strokeWidth={1.5} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-xs', active ? 'text-on-lime' : 'text-muted')}>{label}</span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {loading ? <Skeleton.Input active size="small" className="w-12! min-w-0!" /> : <span className="text-2xl font-normal tabular-nums leading-tight">{value ?? 0}</span>}
          {!active && !loading && !!value && alert}
        </span>
      </span>
    </>
  );
  const cls = cn('flex w-full min-w-0 items-center gap-3 rounded-card px-4 py-3 text-left', active ? 'bg-lime text-on-lime' : 'bg-surface text-ink');
  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn(cls, 'cursor-pointer border-0 transition-colors duration-150', !active && 'hover:bg-lime-soft')}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
};

/** Breketli bemorlar — 1,5–2 yillik davolashni yo'qotmasdan kuzatish */
export const OrthoPage = () => {
  const navigate = useNavigate();
  const [p, setP] = useOrthoParams();
  const [creating, setCreating] = useState(false);
  const [contact, setContact] = useState<OrthoCaseView | null>(null);
  const openNew = useNewAppointment((s) => s.show);
  const { data: stats, isLoading: statsLoading } = useOrthoStats();
  const { data: overdueList = [] } = useOrthoCases({ overdue: true });
  const overdueIds = overdueList.map((c) => c.id);
  const { data = [], isLoading, isFetching, isError, error, refetch } = useOrthoCases({
    q: p.q,
    stage: p.stage,
    doctor: p.doctor,
    status: p.status,
    overdue: p.overdue,
    debt: p.debt,
  });
  const active = !!(p.q || p.stage || p.doctor || p.overdue || p.debt || p.status !== 'ACTIVE');
  const reset = () => void setP({ q: null, stage: null, doctor: null, overdue: null, debt: null, status: 'ACTIVE' });

  const columns: ColumnsType<OrthoCaseView> = [
    {
      title: 'Bemor',
      key: 'patient',
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={r.patientName} size={32} />
          <div className="min-w-0 leading-tight">
            <div className="max-w-56 truncate font-medium text-ink" title={r.patientName}>
              {r.patientName}
            </div>
            <PhoneText phone={r.patientPhone} className="text-xs" />
          </div>
        </div>
      ),
    },
    { title: 'Bosqich', key: 'stage', width: 180, render: (_, r) => <StageBar stage={r.stage} finished={r.status === 'FINISHED'} /> },
    { title: 'Keyingi korreksiya', key: 'next', render: (_, r) => <VisitDue c={r} /> },
    {
      title: 'Oxirgi tashrif',
      key: 'last',
      responsive: ['lg'],
      render: (_, r) => (
        <span className="tabular-nums">
          {formatDate(r.lastVisit)}
          <span className="ml-2 text-xs text-muted">{r.daysSinceVisit ? `${r.daysSinceVisit} kun oldin` : 'bugun'}</span>
        </span>
      ),
    },
    { title: 'To‘lov', key: 'pay', responsive: ['md'], render: (_, r) => <PaymentState c={r} /> },
    { title: 'Shifokor', dataIndex: 'doctorName', responsive: ['xl'] },
    {
      title: 'Oxirgi qo‘ng‘iroq',
      key: 'contact',
      responsive: ['xl'],
      render: (_, r) =>
        r.lastContact ? (
          <span className="block max-w-48 truncate text-xs" title={`${formatDate(r.lastContact.at)}: ${r.lastContact.note}`}>
            <span className="tabular-nums text-muted">{formatDate(r.lastContact.at)} · </span>
            {r.lastContact.note}
          </span>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      width: 96,
      render: (_, r) =>
        r.status === 'FINISHED' ? null : (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {r.overdueDays > 0 && (
              <Tooltip title="Qo‘ng‘iroq natijasini yozish">
                <Button size="small" shape="circle" icon={<PhoneCall size={16} strokeWidth={1.5} />} onClick={() => setContact(r)} aria-label="Qo‘ng‘iroq natijasini yozish" />
              </Tooltip>
            )}
            <Can perm="appointment.manage">
              <Tooltip title="Qabulga yozish">
                <Button
                  size="small"
                  shape="circle"
                  type={r.overdueDays > 0 ? 'primary' : 'default'}
                  icon={<CalendarPlus size={16} strokeWidth={1.5} />}
                  onClick={() => openNew({ patientId: r.patientId, doctorId: r.doctorId })}
                  aria-label="Qabulga yozish"
                />
              </Tooltip>
            </Can>
          </div>
        ),
    },
  ];

  const onlyActive = p.status === 'ACTIVE' && !p.overdue && !p.debt;

  return (
    <>
      <PageHeader
        title="Breketlar"
        breadcrumb={[{ label: 'Bosh sahifa', to: '/' }, { label: 'Breketlar' }]}
        description="Breket bilan davolanayotgan bemorlar: bosqich, korreksiyalar va to‘lov rejasi"
        actions={
          <Can perm="ortho.manage">
            {overdueIds.length > 0 && <AutoCallButton ids={overdueIds} label={`Kechikkanlarga qo‘ng‘iroq (${overdueIds.length})`} />}
            <Button type="primary" icon={<Plus size={18} strokeWidth={1.5} />} onClick={() => setCreating(true)}>
              Breketli bemor qo‘shish
            </Button>
          </Can>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-1.5 lg:grid-cols-4">
        <Counter icon={Smile} label="Davolanmoqda" value={stats?.active} loading={statsLoading} active={onlyActive} onClick={reset} />
        <Counter
          icon={CircleAlert}
          label="Korreksiyasi kechikkan"
          value={stats?.overdue}
          loading={statsLoading}
          active={!!p.overdue && !p.debt}
          onClick={() => void setP({ overdue: p.overdue && !p.debt ? null : true, debt: null, status: 'ACTIVE' })}
          alert={
            <StatusTag tone="danger" className="hidden sm:inline-flex">
              qo‘ng‘iroq qiling
            </StatusTag>
          }
        />
        <Counter
          icon={Wallet}
          label="To‘lovi kechikkan"
          value={stats?.paymentOverdue}
          loading={statsLoading}
          active={!!p.debt && !p.overdue}
          onClick={() => void setP({ debt: p.debt && !p.overdue ? null : true, overdue: null, status: 'ACTIVE' })}
          alert={
            <StatusTag tone="warning" className="hidden sm:inline-flex">
              eslating
            </StatusTag>
          }
        />
        <Counter icon={CalendarClock} label="7 kun ichida keladi" value={stats?.thisWeek} loading={statsLoading} />
      </div>

      <Panel className="flex-1" bodyClassName="p-3 md:p-4">
        <FilterBar active={active} onReset={reset}>
          <SearchInput value={p.q} onChange={(q) => void setP({ q })} placeholder="Ism yoki telefon" />
          <Select
            allowClear
            placeholder="Bosqich"
            value={p.stage ?? undefined}
            onChange={(stage?: (typeof ORTHO_STAGES)[number]) => void setP({ stage: stage ?? null })}
            options={ORTHO_STAGES.map((s) => ({ value: s, label: ORTHO_STAGE[s].label }))}
            className="w-[calc(50%-6px)] sm:w-48"
          />
          <DoctorSelect allowClear placeholder="Shifokor" value={p.doctor} onChange={(doctor) => void setP({ doctor: doctor ?? null })} className="w-[calc(50%-6px)] sm:w-52" />
          <Checkbox checked={!!p.overdue} onChange={(e) => void setP({ overdue: e.target.checked || null })}>
            Korreksiyasi kechikkan
          </Checkbox>
          <Checkbox checked={!!p.debt} onChange={(e) => void setP({ debt: e.target.checked || null })}>
            To‘lovi kechikkan
          </Checkbox>
          <div className="max-w-full overflow-x-auto lg:ml-auto">
            <Segmented
              value={p.status}
              onChange={(status) => void setP({ status: status as (typeof ORTHO_STATUS_FILTERS)[number] })}
              options={ORTHO_STATUS_FILTERS.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
            />
          </div>
        </FilterBar>
        {isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : (
          <Table
            rowKey="id"
            size="middle"
            loading={isLoading || isFetching}
            columns={columns}
            dataSource={data}
            scroll={{ x: 760 }}
            onRow={(r) => ({ onClick: () => navigate(ROUTES.orthoCase(r.id)), className: 'cursor-pointer' })}
            pagination={{ pageSize: 15, showSizeChanger: false, hideOnSinglePage: true, showTotal: (t) => `${t} ta` }}
            locale={{
              emptyText: (
                <EmptyState
                  icon={Smile}
                  title={active ? 'Filtr bo‘yicha bemor topilmadi' : 'Hali breketli bemor yo‘q'}
                  description={active ? 'Filtrlarni tozalab ko‘ring' : 'Birinchi breketli bemorni qo‘shing — bosqich, korreksiyalar va to‘lovlar shu yerda kuzatiladi'}
                  action={
                    active ? (
                      <Button onClick={reset}>Filtrlarni tozalash</Button>
                    ) : (
                      <Can perm="ortho.manage">
                        <Button onClick={() => setCreating(true)}>Birinchi bemorni qo‘shish</Button>
                      </Can>
                    )
                  }
                />
              ),
            }}
          />
        )}
      </Panel>

      <OrthoCaseFormDrawer open={creating} onClose={() => setCreating(false)} onSaved={(c) => navigate(ROUTES.orthoCase(c.id))} />
      <ContactModal c={contact} onClose={() => setContact(null)} />
    </>
  );
};
