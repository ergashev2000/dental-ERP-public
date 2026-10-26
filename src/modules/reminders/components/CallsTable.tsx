import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Play } from '@/shared/icons';
import { EmptyState, PhoneText, StatusTag } from '@/shared/components/ui';
import { CALL_RESULT } from '@/shared/constants/status';
import { formatDateTime } from '@/shared/utils/format';
import type { CallLogView, CallResult } from '../types';

/** Audio yozuv — mock'da faqat placeholder */
const AudioPlaceholder = ({ sec }: { sec: number }) => (
  <span className="inline-flex h-7.5 items-center gap-2 rounded-pill bg-subtle px-3 text-xs tabular-nums text-muted" title="Audio yozuv backend tayyor bo‘lganda ulanadi">
    <Play size={14} strokeWidth={1.5} />
    <span className="h-1 w-16 rounded-full bg-subtle-strong" />
    0:{String(sec).padStart(2, '0')}
  </span>
);

interface Props {
  data?: CallLogView[];
  loading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPage?: (p: number) => void;
  hidePatient?: boolean;
}

export const CallsTable = ({ data, loading, total, page, pageSize = 15, onPage, hidePatient }: Props) => {
  const columns: ColumnsType<CallLogView> = [
    { title: 'Vaqt', dataIndex: 'startedAt', render: (v: string) => <span className="tabular-nums">{formatDateTime(v)}</span> },
    ...(hidePatient ? [] : [{ title: 'Bemor', dataIndex: 'patientName' }]),
    { title: 'Telefon', dataIndex: 'phone', responsive: ['md'], render: (v: string) => <PhoneText phone={v} /> },
    { title: 'Natija', dataIndex: 'result', render: (r: CallResult) => <StatusTag meta={CALL_RESULT[r]} /> },
    { title: 'Davomiylik', dataIndex: 'durationSec', align: 'right', responsive: ['md'], render: (v: number) => `${v} s` },
    { title: 'Urinish', dataIndex: 'attempt', align: 'center', responsive: ['lg'] },
    { title: 'Tugma', dataIndex: 'keyPressed', align: 'center', responsive: ['lg'], render: (v?: string) => (v ? <span className="font-medium">{v}</span> : '—') },
    { title: 'Audio', key: 'audio', responsive: ['xl'], render: (_, r) => (r.durationSec > 0 ? <AudioPlaceholder sec={r.durationSec} /> : '—') },
  ];
  return (
    <Table
      rowKey="id"
      size="middle"
      loading={loading}
      columns={columns}
      dataSource={data}
      scroll={{ x: 640 }}
      pagination={onPage ? { current: page, pageSize, total, onChange: onPage, showSizeChanger: false, hideOnSinglePage: true } : false}
      locale={{ emptyText: <EmptyState title="Qo‘ng‘iroqlar yo‘q" description="Qabulga yozilganda eslatma qo‘ng‘iroqlari avtomatik rejalashtiriladi" /> }}
    />
  );
};
