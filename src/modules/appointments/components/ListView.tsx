import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CalendarSearch } from '@/shared/icons';
import { EmptyState, ErrorState, PhoneText, StatusTag } from '@/shared/components/ui';
import { APPOINTMENT_STATUS, CALL_RESULT } from '@/shared/constants/status';
import { sourceLabel } from '@/shared/constants/options';
import { formatDate, formatTime } from '@/shared/utils/format';
import type { CallResult } from '@/modules/reminders/types';
import { useAppointmentParam, useAppointmentsList } from '../hooks/useAppointments';
import type { AppointmentFilters, AppointmentView } from '../types';

export const ReminderCell = ({ r }: { r?: AppointmentView['reminder'] }) => {
  if (!r) return <span className="text-xs text-muted">—</span>;
  const meta = CALL_RESULT[r.status as CallResult];
  const retry = ['NO_ANSWER', 'BUSY'].includes(r.status) && r.maxAttempts > 1;
  return (
    <StatusTag meta={meta} pulse={r.status === 'CALLING'}>
      {meta.label}
      {retry && ` (${r.attempt}/${r.maxAttempts})`}
    </StatusTag>
  );
};

interface Props {
  filters: AppointmentFilters;
  onPage: (page: number) => void;
}

export const ListView = ({ filters, onPage }: Props) => {
  const [, open] = useAppointmentParam();
  const { data, isLoading, isFetching, isError, error, refetch } = useAppointmentsList(filters);

  const columns: ColumnsType<AppointmentView> = [
    {
      title: 'Sana va vaqt',
      dataIndex: 'start',
      width: 150,
      render: (v: string, r) => (
        <div className="whitespace-nowrap tabular-nums">
          <span className="font-medium">{formatTime(v)}</span>
          <span className="ml-2 text-xs text-muted">{formatDate(v)} · {r.durationMin} daq.</span>
        </div>
      ),
    },
    {
      title: 'Bemor',
      key: 'p',
      render: (_, r) => (
        <div className="leading-tight">
          <div className="whitespace-nowrap font-medium">{r.patientName}</div>
          {!r.masked && <PhoneText phone={r.patientPhone} className="text-xs" />}
        </div>
      ),
    },
    { title: 'Shifokor', dataIndex: 'doctorName', responsive: ['md'], render: (v: string) => <span className="whitespace-nowrap">{v}</span> },
    { title: 'Xizmat(lar)', dataIndex: 'serviceNames', responsive: ['lg'], render: (v: string[]) => <span className="block max-w-60 truncate" title={v.join(', ')}>{v.join(', ')}</span> },
    { title: 'Kreslo', dataIndex: 'chairName', responsive: ['xl'], render: (v: string) => <span className="whitespace-nowrap">{v}</span> },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: AppointmentView['status'], r) => (
        <span className="inline-flex items-center gap-1.5">
          <StatusTag meta={APPOINTMENT_STATUS[s]} />
          {r.noShowRisk === 'HIGH' && (
            <StatusTag tone="danger" dot={false}>
              Xavf
            </StatusTag>
          )}
        </span>
      ),
    },
    { title: 'Eslatma', dataIndex: 'reminder', responsive: ['md'], render: (r: AppointmentView['reminder']) => <ReminderCell r={r} /> },
    { title: 'Manba', dataIndex: 'source', responsive: ['xl'], render: (s: string) => sourceLabel(s) },
  ];

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  return (
    <Table
      rowKey="id"
      size="middle"
      loading={isLoading || isFetching}
      columns={columns}
      dataSource={data?.items}
      scroll={{ x: 720 }}
      onRow={(r) => ({ onClick: () => !r.masked && void open(r.id), className: r.masked ? '' : 'cursor-pointer' })}
      rowClassName={(r) => (r.status === 'CANCELLED' || r.status === 'NO_SHOW' ? 'opacity-60' : '')}
      pagination={{
        current: filters.page,
        pageSize: filters.pageSize,
        total: data?.total,
        showSizeChanger: false,
        onChange: onPage,
        showTotal: (t) => `${t} ta qabul`,
      }}
      locale={{ emptyText: <EmptyState icon={CalendarSearch} title="Qabul topilmadi" description="Sana, shifokor yoki status filtrini o‘zgartiring — yoki yuqoridagi «Yangi qabul» tugmasini bosing" /> }}
    />
  );
};
