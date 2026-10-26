import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { EmptyState, MoneyText, Panel, StatusTag } from '@/shared/components/ui';
import { APPOINTMENT_STATUS } from '@/shared/constants/status';
import { formatDateTime } from '@/shared/utils/format';
import { useAppointmentParam, useAppointmentsList, type AppointmentView } from '@/modules/appointments';
import { useInvoices } from '@/modules/billing';

/** Bemorning qabullar tarixi */
export const VisitsTab = ({ patientId }: { patientId: string }) => {
  const [page, setPage] = useState(1);
  const [, openAppointment] = useAppointmentParam();
  const { data, isLoading } = useAppointmentsList({ patientId, page, pageSize: 10 });
  const { data: invoices } = useInvoices({ patientId, pageSize: 200 });
  const sumFor = (id: string) => invoices?.items.find((i) => i.appointmentId === id)?.total;

  const columns: ColumnsType<AppointmentView> = [
    { title: 'Sana', dataIndex: 'start', width: 150, render: (v: string) => <span className="font-medium tabular-nums">{formatDateTime(v)}</span> },
    { title: 'Shifokor', dataIndex: 'doctorName', responsive: ['md'], render: (v: string) => <span className="whitespace-nowrap">{v}</span> },
    {
      title: 'Muolajalar',
      key: 's',
      render: (_, r) => (
        <div>
          <div>{r.serviceNames.join(', ') || 'Ko‘rik'}</div>
          {(r.doctorNote || r.note) && <div className="text-xs text-muted">{r.doctorNote ?? r.note}</div>}
          {r.cancelReason && <div className="text-xs text-danger">{r.cancelReason}</div>}
        </div>
      ),
    },
    { title: 'Holat', dataIndex: 'status', render: (s: AppointmentView['status']) => <StatusTag meta={APPOINTMENT_STATUS[s]} /> },
    { title: 'Summa', key: 'sum', align: 'right', render: (_, r) => (sumFor(r.id) !== undefined ? <MoneyText value={sumFor(r.id)!} /> : <span className="text-muted">—</span>) },
  ];

  return (
    <Panel title="Tashriflar" bodyClassName="px-3 pb-4 pt-3 md:px-4">
      <Table
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items}
        scroll={{ x: 640 }}
        onRow={(r) => ({ onClick: () => void openAppointment(r.id), className: 'cursor-pointer' })}
        pagination={{ current: page, pageSize: 10, total: data?.total, onChange: setPage, showSizeChanger: false, hideOnSinglePage: true }}
        locale={{ emptyText: <EmptyState title="Tashriflar yo‘q" description="Bemor hali qabulga yozilmagan — kartaning yuqorisidagi «Qabulga yozish» tugmasini bosing" /> }}
      />
    </Panel>
  );
};
