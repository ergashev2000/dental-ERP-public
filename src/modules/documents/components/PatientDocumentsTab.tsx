import { Button, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { Contract, Plus, Printer } from '@/shared/icons';
import { Can, EmptyState, ErrorState, Panel, StatusTag, usePrint } from '@/shared/components/ui';
import { formatDate } from '@/shared/utils/format';
import { DOC_STATUS, docTemplate } from '../templates';
import { useDocumentContext, usePatientDocuments } from '../hooks/useDocuments';
import type { DocumentView } from '../types';
import { DocumentDrawer, type DocumentDrawerState } from './DocumentDrawer';
import { DocumentSheet, type PrintableDoc } from './DocumentSheet';

/** Bemor kartasi → Hujjatlar: rozilik shakllari, shartnomalar, retseptlar (tuzish, imzolash, chop etish) */
export const PatientDocumentsTab = ({ patientId }: { patientId: string }) => {
  const { data = [], isLoading, isError, error, refetch } = usePatientDocuments(patientId);
  const { data: ctx } = useDocumentContext(patientId);
  const [drawer, setDrawer] = useState<DocumentDrawerState>(null);
  const [printDoc, setPrintDoc] = useState<PrintableDoc | null>(null);
  const { print, portal } = usePrint();

  const doPrint = (p: PrintableDoc) => {
    setPrintDoc(p);
    print();
  };

  const printSigned = (d: DocumentView) =>
    ctx &&
    doPrint({
      title: d.title,
      number: d.number,
      body: d.body,
      date: d.signedAt ?? d.createdAt,
      patientName: ctx.patientName,
      doctorName: d.doctorName,
      signer: docTemplate(d.templateKey).signer,
      signature: d.signature,
      signedAt: d.signedAt,
      ctx,
    });

  const create = (
    <Can perm="document.manage">
      <Button type="primary" icon={<Plus size={18} strokeWidth={1.5} />} onClick={() => setDrawer({ mode: 'new' })}>
        Hujjat tuzish
      </Button>
    </Can>
  );

  const columns: ColumnsType<DocumentView> = [
    {
      title: 'Hujjat',
      dataIndex: 'title',
      render: (v: string, r) => (
        <span className="flex items-baseline gap-2 whitespace-nowrap">
          <span className="block max-w-64 truncate font-medium" title={v}>
            {v}
          </span>
          {r.teeth.length > 0 && <span className="text-xs tabular-nums text-muted">{r.teeth.join(', ')}</span>}
        </span>
      ),
    },
    { title: 'Sana', key: 'date', width: 110, render: (_, r) => <span className="whitespace-nowrap tabular-nums">{formatDate(r.signedAt ?? r.createdAt)}</span> },
    { title: 'Shifokor', dataIndex: 'doctorName', responsive: ['md'], render: (v: string) => <span className="whitespace-nowrap">{v}</span> },
    { title: 'Status', dataIndex: 'status', render: (s: DocumentView['status']) => <StatusTag meta={DOC_STATUS[s]} /> },
    {
      key: 'print',
      width: 56,
      render: (_, r) =>
        r.status === 'SIGNED' && (
          <Button
            type="text"
            aria-label="Chop etish"
            icon={<Printer size={18} strokeWidth={1.5} />}
            onClick={(e) => {
              e.stopPropagation();
              printSigned(r);
            }}
          />
        ),
    },
  ];

  return (
    <Panel title="Hujjatlar" extra={data.length > 0 ? create : undefined} bodyClassName="px-3 pb-4 pt-2 md:px-4">
      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !isLoading && data.length === 0 ? (
        <EmptyState
          icon={Contract}
          title="Hujjatlar yo‘q"
          description="Rozilik shakli, breket shartnomasi yoki retseptni shablondan bir necha soniyada tuzing"
          action={create}
        />
      ) : (
        <Table
          rowKey="id"
          size="middle"
          loading={isLoading}
          columns={columns}
          dataSource={data}
          pagination={false}
          scroll={{ x: 560 }}
          onRow={(r) => ({ onClick: () => setDrawer({ docId: r.id }), className: 'cursor-pointer' })}
        />
      )}

      <DocumentDrawer
        patientId={patientId}
        state={drawer}
        docs={data}
        onClose={() => setDrawer(null)}
        onOpenDoc={(id) => setDrawer({ docId: id })}
        onPrint={doPrint}
      />
      {printDoc && portal(<DocumentSheet doc={printDoc} />)}
    </Panel>
  );
};
