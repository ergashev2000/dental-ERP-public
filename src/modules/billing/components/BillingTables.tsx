import { App, Button, Form, Input, Modal, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Printer, Undo2, Wallet } from '@/shared/icons';
import { useState } from 'react';
import { EmptyState, MoneyText, PhoneText, StatusTag } from '@/shared/components/ui';
import { INVOICE_STATUS, PAYMENT_METHOD } from '@/shared/constants/status';
import { usePermission } from '@/shared/hooks/usePermission';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { formatDate, formatDateTime } from '@/shared/utils/format';
import { useRefund } from '../hooks/useBilling';
import { usePaymentModal } from '../store/paymentModalStore';
import type { Debtor, InvoiceView, PaymentView } from '../types';
import { ReceiptPrinter } from './ReceiptPrinter';
import { METHOD_ICON } from './methodMeta';

interface Pager {
  current: number;
  total?: number;
  pageSize: number;
  onChange: (p: number) => void;
}

const pagination = (p?: Pager) =>
  p ? { current: p.current, total: p.total, pageSize: p.pageSize, onChange: p.onChange, showSizeChanger: false, hideOnSinglePage: true } : false;

export const InvoicesTable = ({ data, loading, pager, onOpen, hidePatient }: { data?: InvoiceView[]; loading?: boolean; pager?: Pager; onOpen: (id: string) => void; hidePatient?: boolean }) => {
  const columns: ColumnsType<InvoiceView> = [
    { title: 'Raqam', dataIndex: 'number', render: (v: string) => <span className="font-medium tabular-nums">{v}</span> },
    { title: 'Sana', dataIndex: 'createdAt', responsive: ['md'], render: (v: string) => formatDate(v) },
    ...(hidePatient ? [] : [{ title: 'Bemor', dataIndex: 'patientName', render: (v: string) => <span className="block max-w-56 truncate" title={v}>{v}</span> }]),
    { title: 'Shifokor', dataIndex: 'doctorName', responsive: ['lg'] },
    { title: 'Jami', dataIndex: 'total', align: 'right', render: (v: number) => <MoneyText value={v} /> },
    { title: 'To‘langan', dataIndex: 'paid', align: 'right', responsive: ['md'], render: (v: number) => <MoneyText value={v} /> },
    { title: 'Qoldiq', dataIndex: 'remaining', align: 'right', render: (v: number) => (v > 0 ? <MoneyText value={v} debt strong /> : <span className="text-muted">—</span>) },
    { title: 'Holat', dataIndex: 'status', render: (s: InvoiceView['status']) => <StatusTag meta={INVOICE_STATUS[s]} /> },
  ];
  return (
    <Table
      rowKey="id"
      size="middle"
      loading={loading}
      columns={columns}
      dataSource={data}
      scroll={{ x: 640 }}
      onRow={(r) => ({ onClick: () => onOpen(r.id), className: 'cursor-pointer' })}
      pagination={pagination(pager)}
      locale={{ emptyText: <EmptyState title="Hisob-fakturalar yo‘q" description="Qabul yakunlanganda hisob-faktura o‘zi yaratiladi" /> }}
    />
  );
};

/** Refund — faqat ADMIN, sabab majburiy; to'lov o'chirilmaydi */
const RefundModal = ({ payment, onClose }: { payment: PaymentView | null; onClose: () => void }) => {
  const [form] = Form.useForm<{ reason: string }>();
  const refund = useRefund();
  const { message } = App.useApp();
  return (
    <Modal
      open={!!payment}
      onCancel={onClose}
      title="To‘lovni bekor qilish (refund)"
      okText="Bekor qilish"
      okButtonProps={{ danger: true }}
      cancelText="Yopish"
      confirmLoading={refund.isPending}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      {payment && (
        <p className="mb-4 text-sm text-muted">
          {payment.patientName} · <MoneyText value={payment.amount} strong /> · {PAYMENT_METHOD[payment.method]}
        </p>
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={(v) =>
          payment &&
          refund.mutate(
            { id: payment.id, reason: v.reason },
            {
              onSuccess: () => {
                message.success('To‘lov bekor qilindi');
                onClose();
              },
              onError: (e) => message.error(errorMessage(e)),
            },
          )
        }
      >
        <Form.Item name="reason" label="Sabab" rules={[{ required: true, whitespace: true, message: 'Sabab majburiy' }]}>
          <Input.TextArea rows={2} maxLength={200} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export const PaymentsTable = ({ data, loading, pager, hidePatient }: { data?: PaymentView[]; loading?: boolean; pager?: Pager; hidePatient?: boolean }) => {
  const canRefund = usePermission('payment.refund');
  const [refunding, setRefunding] = useState<PaymentView | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const columns: ColumnsType<PaymentView> = [
    { title: 'Vaqt', dataIndex: 'createdAt', render: (v: string) => <span className="tabular-nums">{formatDateTime(v)}</span> },
    ...(hidePatient ? [] : [{ title: 'Bemor', dataIndex: 'patientName' }]),
    { title: 'Hisob', dataIndex: 'invoiceNumber', responsive: ['lg'] },
    {
      title: 'Turi',
      dataIndex: 'method',
      render: (m: PaymentView['method']) => {
        const Icon = METHOD_ICON[m];
        return (
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <Icon size={16} strokeWidth={1.5} className="text-muted" />
            {PAYMENT_METHOD[m]}
          </span>
        );
      },
    },
    {
      title: 'Summa',
      dataIndex: 'amount',
      align: 'right',
      render: (v: number, r) => (
        <div>
          <MoneyText value={v} strong className={r.refunded ? 'text-muted line-through' : ''} />
          {r.refunded && <div className="ml-auto max-w-48 truncate text-xs text-danger" title={r.refunded.reason}>Bekor: {r.refunded.reason}</div>}
        </div>
      ),
    },
    { title: 'Qabul qildi', dataIndex: 'receivedByName', responsive: ['xl'] },
    {
      key: 'a',
      width: 96,
      render: (_: unknown, r: PaymentView) => (
        <div className="flex gap-1">
          <Button type="text" size="small" aria-label="Chek chop etish" title="Chek chop etish" icon={<Printer size={16} strokeWidth={1.5} />} onClick={() => setReceipt(r.id)} />
          {canRefund && !r.refunded && (
            <Button type="text" size="small" danger aria-label="To‘lovni bekor qilish" title="To‘lovni bekor qilish" icon={<Undo2 size={16} strokeWidth={1.5} />} onClick={() => setRefunding(r)} />
          )}
        </div>
      ),
    },
  ];
  return (
    <>
      <Table rowKey="id" size="middle" loading={loading} columns={columns} dataSource={data} scroll={{ x: 640 }} pagination={pagination(pager)} locale={{ emptyText: <EmptyState title="To‘lovlar yo‘q" description="To‘lov «To‘lov qabul qilish» tugmasi yoki qabulni yakunlash oynasi orqali olinadi" /> }} />
      <RefundModal payment={refunding} onClose={() => setRefunding(null)} />
      <ReceiptPrinter paymentId={receipt} onDone={() => setReceipt(null)} />
    </>
  );
};

export const DebtorsTable = ({ data, loading }: { data?: Debtor[]; loading?: boolean }) => {
  const openPayment = usePaymentModal((s) => s.show);
  const canReceive = usePermission('payment.receive');
  return (
    <Table
      rowKey="patientId"
      size="middle"
      loading={loading}
      dataSource={data}
      scroll={{ x: 560 }}
      pagination={false}
      locale={{ emptyText: <EmptyState title="Qarzdorlar yo‘q" description="Barcha bemorlar to‘lovlarini to‘liq yopgan" /> }}
      columns={[
        { title: 'Bemor', dataIndex: 'patientName', render: (v: string) => <span className="font-medium">{v}</span> },
        { title: 'Telefon', dataIndex: 'phone', render: (v: string) => <PhoneText phone={v} /> },
        { title: 'Qarz', dataIndex: 'debt', align: 'right', render: (v: number) => <MoneyText value={v} debt strong /> },
        { title: 'Ochiq hisob', dataIndex: 'openInvoices', align: 'right', responsive: ['lg'], render: (v: number) => <span className="tabular-nums">{v}</span> },
        { title: 'Oxirgi to‘lov', dataIndex: 'lastPaymentAt', responsive: ['md'], render: (v?: string) => (v ? formatDate(v) : <span className="text-muted">To‘lov qilmagan</span>) },
        {
          key: 'a',
          width: 150,
          render: (_: unknown, r: Debtor) =>
            canReceive && (
              <Button size="small" icon={<Wallet size={16} strokeWidth={1.5} />} onClick={() => openPayment({ patientId: r.patientId })}>
                To‘lov olish
              </Button>
            ),
        },
      ]}
    />
  );
};
