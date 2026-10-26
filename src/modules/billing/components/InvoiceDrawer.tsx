import { App, Button, Drawer, Form, Input, InputNumber, Modal, Segmented, Select, Skeleton } from 'antd';
import { BadgePercent, Printer, Wallet } from '@/shared/icons';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Can, MoneyInput, MoneyText, Squiggle, StatusTag } from '@/shared/components/ui';
import { INVOICE_STATUS, PAYMENT_METHOD } from '@/shared/constants/status';
import { ROUTES } from '@/shared/constants/routes';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { usePermission } from '@/shared/hooks/usePermission';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { formatDateTime, formatMoney, formatNumber } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import { useDiscount, useInvoice, usePayments } from '../hooks/useBilling';
import { usePaymentModal } from '../store/paymentModalStore';
import type { DiscountInput, InvoiceLineView } from '../types';
import { ReceiptPrinter } from './ReceiptPrinter';
import { Amount, IconCircle } from './billingUi';
import { METHOD_ICON } from './methodMeta';

type DiscountValues = Omit<DiscountInput, 'invoiceId' | 'lineIndex'> & { target: number };

/** Chegirma: qator yoki butun invoice, foiz yoki summa, sabab majburiy */
const DiscountModal = ({ invoiceId, lines, open, onClose }: { invoiceId: string; lines: InvoiceLineView[]; open: boolean; onClose: () => void }) => {
  const [form] = Form.useForm<DiscountValues>();
  const discount = useDiscount();
  const { message } = App.useApp();
  const mode = Form.useWatch('mode', form);
  return (
    <Modal open={open} onCancel={onClose} title="Chegirma berish" okText="Qo‘llash" cancelText="Bekor qilish" onOk={() => form.submit()} confirmLoading={discount.isPending} destroyOnHidden>
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
        requiredMark={false}
        initialValues={{ target: -1, mode: 'percent' }}
        onFinish={(v) =>
          discount.mutate(
            { invoiceId, lineIndex: v.target < 0 ? null : v.target, mode: v.mode, value: v.value, reason: v.reason },
            {
              onSuccess: () => {
                message.success('Chegirma qo‘llandi');
                onClose();
              },
              onError: (e) => message.error(errorMessage(e)),
            },
          )
        }
      >
        <Form.Item name="target" label="Nimaga">
          <Select options={[{ value: -1, label: 'Butun hisob-faktura' }, ...lines.map((l, i) => ({ value: i, label: `${l.serviceName}${l.tooth ? ` (${l.tooth})` : ''}` }))]} />
        </Form.Item>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
          <Form.Item name="mode" label="Turi">
            <Segmented
              options={[
                { value: 'percent', label: '%' },
                { value: 'amount', label: 'so‘m' },
              ]}
              onChange={() => form.setFieldValue('value', undefined)}
            />
          </Form.Item>
          <Form.Item name="value" label="Qiymat" rules={[{ required: true, message: 'Qiymatni kiriting' }]}>
            {mode === 'amount' ? <MoneyInput min={1} /> : <InputNumber min={1} max={100} suffix="%" className="w-full tabular-nums" />}
          </Form.Item>
        </div>
        <Form.Item name="reason" label="Sabab" className="mb-0" rules={[{ required: true, whitespace: true, message: 'Sabab majburiy' }]}>
          <Input.TextArea rows={2} maxLength={200} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

/** Jami bloki qatori */
const Row = ({ label, children, className }: { label: string; children: ReactNode; className?: string }) => (
  <div className={cn('flex items-baseline justify-between gap-3 text-sm', className)}>
    <span className="text-muted">{label}</span>
    {children}
  </div>
);

export const InvoiceDrawer = ({ id, onClose }: { id: string | null; onClose: () => void }) => {
  const { data: inv, isLoading } = useInvoice(id);
  const { data: payments } = usePayments({ patientId: inv?.patientId, pageSize: 100 }, !!inv?.patientId);
  const openPayment = usePaymentModal((s) => s.show);
  const canDiscount = usePermission('payment.discount');
  const canReceive = usePermission('payment.receive');
  const isMobile = useIsMobile();
  const [discountOpen, setDiscountOpen] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const list = payments?.items.filter((p) => p.invoiceId === id) ?? [];
  const gross = inv?.lineViews.reduce((s, l) => s + l.price * l.qty, 0) ?? 0;
  const lineDiscounts = inv?.lineViews.reduce((s, l) => s + l.discount, 0) ?? 0;
  const active = !!inv && inv.status !== 'CANCELLED';
  const showFooter = active && ((canReceive && inv.remaining > 0) || canDiscount);

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      width={isMobile ? '100%' : 560}
      title={inv ? `Hisob-faktura ${inv.number}` : 'Hisob-faktura'}
      destroyOnHidden
      footer={
        showFooter ? (
          <div className="flex flex-wrap justify-end gap-2">
            <Can perm="payment.discount">
              <Button icon={<BadgePercent size={18} strokeWidth={1.5} />} onClick={() => setDiscountOpen(true)} disabled={inv.remaining <= 0}>
                Chegirma
              </Button>
            </Can>
            {inv.remaining > 0 && (
              <Can perm="payment.receive">
                <Button type="primary" icon={<Wallet size={18} strokeWidth={1.5} />} onClick={() => openPayment({ patientId: inv.patientId, invoiceId: inv.id })}>
                  To‘lov qabul qilish
                </Button>
              </Can>
            )}
          </div>
        ) : null
      }
    >
      {isLoading || !inv ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Bemor va holat */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link to={ROUTES.patient(inv.patientId)} className="text-xl text-ink hover:underline">
                {inv.patientName}
              </Link>
              <div className="mt-1 text-sm text-muted">
                {formatDateTime(inv.createdAt)} · {inv.doctorName}
              </div>
            </div>
            <StatusTag meta={INVOICE_STATUS[inv.status]} />
          </div>

          {/* Xizmatlar */}
          <section>
            <div className="mb-3">
              <h4 className="m-0 text-base font-normal">Xizmatlar</h4>
              <Squiggle />
            </div>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {inv.lineViews.map((l, i) => (
                <li key={i} className="flex items-start justify-between gap-3 rounded-md bg-subtle px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-sm">
                      {l.serviceName}
                      {l.tooth ? <span className="ml-2 inline-flex h-5 items-center rounded-pill bg-surface px-2 text-xs tabular-nums text-muted">tish {l.tooth}</span> : null}
                    </div>
                    <div className="mt-0.5 text-xs tabular-nums text-muted">
                      {l.qty} × {formatNumber(l.price)}
                      {l.discount ? ` · chegirma ${formatMoney(-l.discount)}` : ''}
                    </div>
                  </div>
                  <MoneyText value={l.sum} className="shrink-0 text-sm" />
                </li>
              ))}
            </ul>
          </section>

          {/* Jami */}
          <section className="flex flex-col gap-2 rounded-md bg-panel p-5">
            {(lineDiscounts > 0 || inv.discount > 0) && (
              <Row label="Xizmatlar summasi">
                <MoneyText value={gross} />
              </Row>
            )}
            {lineDiscounts > 0 && (
              <Row label="Qator chegirmalari">
                <MoneyText value={-lineDiscounts} />
              </Row>
            )}
            {inv.discount > 0 && (
              <Row label="Qo‘shimcha chegirma">
                <MoneyText value={-inv.discount} />
              </Row>
            )}
            {inv.discountReason && <div className="text-xs text-muted">Chegirma sababi: {inv.discountReason}</div>}
            <Row label="Jami">
              <MoneyText value={inv.total} className="text-base" />
            </Row>
            <Row label="To‘langan">
              <MoneyText value={inv.paid} />
            </Row>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3 rounded-md bg-surface px-4 py-3">
              <div>
                <div className="text-xs text-muted">Qoldiq</div>
                <div className="text-2xl font-normal text-ink">
                  <Amount value={inv.remaining} />
                </div>
              </div>
              {inv.remaining > 0 ? <StatusTag tone="danger">Qarz</StatusTag> : active && <StatusTag tone="success">To‘liq to‘langan</StatusTag>}
            </div>
          </section>

          {/* To'lovlar tarixi */}
          <section>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <div>
                <h4 className="m-0 text-base font-normal">To‘lovlar tarixi</h4>
                <Squiggle />
              </div>
              {!!list.length && <span className="text-xs tabular-nums text-muted">{list.length} ta</span>}
            </div>
            {!list.length ? (
              <div className="rounded-md bg-subtle px-4 py-3 text-sm text-muted">Hali to‘lov qilinmagan</div>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {list.map((p) => (
                  <li key={p.id} className={cn('flex items-center gap-3 rounded-md bg-subtle px-3 py-2.5', p.refunded && 'opacity-70')}>
                    <IconCircle icon={METHOD_ICON[p.method]} className="bg-surface" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 text-sm">
                        <MoneyText value={p.amount} className={p.refunded ? 'line-through' : ''} />
                        <span className="text-muted">{PAYMENT_METHOD[p.method]}</span>
                      </div>
                      <div className="truncate text-xs text-muted" title={p.refunded?.reason}>
                        {formatDateTime(p.createdAt)} · {p.receivedByName}
                        {p.refunded && ` · bekor: ${p.refunded.reason}`}
                      </div>
                    </div>
                    {p.refunded ? (
                      <StatusTag tone="danger">Bekor</StatusTag>
                    ) : (
                      <Button type="text" shape="circle" aria-label="Chek chop etish" title="Chek chop etish" icon={<Printer size={18} strokeWidth={1.5} />} onClick={() => setReceipt(p.id)} />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <DiscountModal invoiceId={inv.id} lines={inv.lineViews} open={discountOpen} onClose={() => setDiscountOpen(false)} />
          <ReceiptPrinter paymentId={receipt} onDone={() => setReceipt(null)} />
        </div>
      )}
    </Drawer>
  );
};
