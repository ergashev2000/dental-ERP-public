import { App, Button, Dropdown, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CircleCheck, CirclePlay, CircleX, EllipsisVertical, Plus, Printer, View3D } from '@/shared/icons';
import { useState } from 'react';
import { CardSkeleton, EmptyState, ErrorState, MoneyText, Panel, PrintHeader, StatusTag, usePrint } from '@/shared/components/ui';
import { PLAN_STATUS } from '@/shared/constants/status';
import { usePermission } from '@/shared/hooks/usePermission';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { ageFrom, formatDate, formatMoney, fullName } from '@/shared/utils/format';
import type { Patient } from '@/modules/patients/types';
// to'g'ridan-to'g'ri yo'l: dental-chart index'i treatments'ni import qiladi (aylanma importdan qochish)
import { JawPresentationModal } from '@/modules/dental-chart/components/JawPresentationModal';
import { useSetPlanStatus, useTreatmentPlan } from '../hooks/useTreatments';
import type { PlanItemStatus, PlanItemView } from '../types';
import { planDentition, planHighlight, type StageFilter } from '../utils';
import { PlanItemModal } from './PlanItemModal';
import { PlanStagesCard } from './PlanStagesCard';

const Summary = ({ items }: { items: PlanItemView[] }) => {
  const active = items.filter((i) => i.status !== 'CANCELLED');
  const total = active.reduce((s, i) => s + i.total, 0);
  const done = active.filter((i) => i.status === 'DONE').reduce((s, i) => s + i.total, 0);
  return (
    <div className="grid gap-1.5 sm:grid-cols-3">
      {[
        { label: 'Jami reja', value: total },
        { label: 'Bajarilgan', value: done },
        { label: 'Qolgan', value: total - done },
      ].map((x) => (
        <div key={x.label} className="rounded-md bg-panel p-4">
          <div className="text-xs text-muted">{x.label}</div>
          <div className="mt-1 text-xl font-normal tabular-nums text-ink">
            {formatMoney(x.value, false)} <span className="text-[0.55em] text-muted">so‘m</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export const TreatmentPlanTab = ({ patient }: { patient: Patient }) => {
  const { data = [], isLoading, isError, error, refetch } = useTreatmentPlan(patient.id);
  const canEdit = usePermission('treatment.edit');
  const canComplete = usePermission('treatment.complete');
  const setStatus = useSetPlanStatus();
  const { message, modal } = App.useApp();
  const [adding, setAdding] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const { print, portal } = usePrint();
  const [printedAt] = useState(() => new Date().toISOString());

  if (isLoading) return <CardSkeleton rows={6} />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const stages = [...new Set(data.map((i) => i.stage))].sort((a, b) => a - b);
  const hasTeeth = data.some((i) => i.tooth && i.status !== 'CANCELLED');
  const change = (r: PlanItemView, status: PlanItemStatus) => {
    const run = () => setStatus.mutate({ id: r.id, status }, { onError: (e) => message.error(errorMessage(e)) });
    if (status === 'CANCELLED') {
      modal.confirm({ title: 'Qatorni bekor qilish', content: `${r.serviceName} rejadan chiqariladi (tarixda qoladi).`, okText: 'Bekor qilish', okButtonProps: { danger: true }, cancelText: 'Yopish', onOk: run });
    } else run();
  };

  const columns = (printMode = false): ColumnsType<PlanItemView> => [
    { title: 'Tish', dataIndex: 'tooth', width: 64, render: (v?: number) => (v ? <span className="font-medium tabular-nums">{v}</span> : '—') },
    {
      title: 'Xizmat',
      dataIndex: 'serviceName',
      render: (v: string, r) => (
        <span className="block max-w-72 truncate" title={v}>
          {v} <span className="text-xs text-muted">{r.serviceCode}</span>
        </span>
      ),
    },
    { title: 'Narx', dataIndex: 'price', align: 'right', render: (v: number) => <MoneyText value={v} /> },
    { title: 'Chegirma', dataIndex: 'discount', align: 'right', width: 90, render: (v: number) => (v ? `${v}%` : '—') },
    { title: 'Summa', dataIndex: 'total', align: 'right', render: (v: number) => <MoneyText value={v} className="font-medium" /> },
    ...(printMode
      ? []
      : ([
          { title: 'Shifokor', dataIndex: 'doctorName', responsive: ['lg'] },
          { title: 'Holat', dataIndex: 'status', render: (s: PlanItemStatus) => <StatusTag meta={PLAN_STATUS[s]} /> },
          {
            key: 'a',
            width: 56,
            render: (_: unknown, r: PlanItemView) =>
              canEdit && (r.status === 'PLANNED' || r.status === 'IN_PROGRESS') ? (
                <Dropdown
                  trigger={['click']}
                  menu={{
                    items: [
                      ...(r.status === 'PLANNED' ? [{ key: 'start', label: 'Jarayonga o‘tkazish', icon: <CirclePlay size={16} strokeWidth={1.5} />, onClick: () => change(r, 'IN_PROGRESS') }] : []),
                      ...(canComplete ? [{ key: 'done', label: 'Bajarildi', icon: <CircleCheck size={16} strokeWidth={1.5} />, onClick: () => change(r, 'DONE') }] : []),
                      { key: 'cancel', label: 'Bekor qilish', danger: true, icon: <CircleX size={16} strokeWidth={1.5} />, onClick: () => change(r, 'CANCELLED') },
                    ],
                  }}
                >
                  <Button type="text" shape="circle" aria-label="Amallar" icon={<EllipsisVertical size={18} strokeWidth={1.5} />} />
                </Dropdown>
              ) : null,
          },
        ] as ColumnsType<PlanItemView>)),
  ];

  const printable = data.filter((i) => i.status !== 'CANCELLED');
  const childAge = !!patient.birthDate && ageFrom(patient.birthDate) < 12;

  return (
    <Panel
      title="Davolash rejasi"
      bodyClassName="p-3 md:p-5"
      extra={
        <div className="flex flex-wrap gap-2">
          <Tooltip title="Chop etish">
            <Button shape="circle" aria-label="Chop etish" icon={<Printer size={18} strokeWidth={1.5} />} onClick={print} disabled={!data.length} />
          </Tooltip>
          <Tooltip title={hasTeeth ? 'Rejadagi tishlarni bemorga 3D modelda ko‘rsatish' : 'Rejada tishga bog‘langan qator yo‘q'}>
            <Button icon={<View3D size={18} strokeWidth={1.5} />} onClick={() => setPresenting(true)} disabled={!hasTeeth}>
              3D’da ko‘rsatish
            </Button>
          </Tooltip>
          {canEdit && (
            <Button type="primary" icon={<Plus size={18} strokeWidth={1.5} />} onClick={() => setAdding(true)}>
              Qator qo‘shish
            </Button>
          )}
        </div>
      }
    >
      {!data.length ? (
        <EmptyState title="Davolash rejasi tuzilmagan" description="Tish sxemasidan yoki shu yerdan qator qo‘shing" />
      ) : (
        <div className="flex flex-col gap-6">
          <Summary items={data} />
          {stages.map((st) => {
            const rows = data.filter((i) => i.stage === st);
            const sum = rows.filter((i) => i.status !== 'CANCELLED').reduce((s, i) => s + i.total, 0);
            return (
              <div key={st}>
                <div className="mb-2 flex items-center justify-between gap-3 px-1">
                  <h4 className="m-0 text-base font-medium">{st}-bosqich</h4>
                  <MoneyText value={sum} muted />
                </div>
                <Table rowKey="id" size="middle" columns={columns()} dataSource={rows} pagination={false} scroll={{ x: 640 }} rowClassName={(r) => (r.status === 'CANCELLED' ? 'opacity-50' : '')} />
              </div>
            );
          })}
        </div>
      )}
      <PlanItemModal patientId={patient.id} open={adding} defaultStage={Math.max(1, ...stages)} onClose={() => setAdding(false)} />
      <JawPresentationModal
        open={presenting}
        onClose={() => {
          setPresenting(false);
          setStageFilter('all');
        }}
        patientId={patient.id}
        title="Davolash rejasi"
        subtitle={fullName(patient)}
        dentition={planDentition(data, childAge)}
        highlight={planHighlight(data, stageFilter)}
        aside={<PlanStagesCard items={data} value={stageFilter} onChange={setStageFilter} />}
      />
      {portal(
        <div>
          <PrintHeader title="Davolash rejasi" subtitle={<>{fullName(patient)} · {patient.cardNo}<br />{formatDate(printedAt)}</>} />
          {[...new Set(printable.map((i) => i.stage))].map((st) => (
            <div key={st} className="mb-4">
              <div className="mb-1 font-medium">{st}-bosqich</div>
              <Table rowKey="id" size="small" columns={columns(true)} dataSource={printable.filter((i) => i.stage === st)} pagination={false} />
            </div>
          ))}
          <div className="mt-4 text-right text-base font-medium">Jami: {formatMoney(printable.reduce((s, i) => s + i.total, 0))}</div>
          <p className="mt-6 text-xs text-muted">Reja taxminiy; narxlar davolash jarayonida o‘zgarishi mumkin. Shifokor imzosi: ____________</p>
        </div>,
      )}
    </Panel>
  );
};
