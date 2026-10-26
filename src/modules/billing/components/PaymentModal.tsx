import { App, Button, Form, Input, InputNumber, Modal, Segmented, Skeleton, Switch } from 'antd';
import { BadgePercent, CalendarPlus, Check, Printer } from '@/shared/icons';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { MoneyInput, MoneyText, StatusTag } from '@/shared/components/ui';
import { PAYMENT_METHOD } from '@/shared/constants/status';
import { usePermission } from '@/shared/hooks/usePermission';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { formatDate, formatMoney } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import { useClinic } from '@/modules/settings';
import { useNewAppointment } from '@/modules/appointments';
import { useDiscount, useOpenInvoices, useReceivePayment } from '../hooks/useBilling';
import { usePaymentModal } from '../store/paymentModalStore';
import type { InvoiceView, PaymentMethod, PaymentView } from '../types';
import { ReceiptPrinter } from './ReceiptPrinter';
import { PayerSelect } from './PayerSelect';
import { Amount } from './billingUi';
import { METHOD_ICON, METHOD_SHORT } from './methodMeta';

interface Values {
  patientId: string;
  invoiceId: string;
  amount?: number;
  method: PaymentMethod;
  note?: string;
  discountOn?: boolean;
  discountMode?: 'percent' | 'amount';
  discountValue?: number;
  discountReason?: string;
}

/** Form name — maydon id'lari shu prefiks bilan (summa maydoniga fokus berish uchun) */
const FORM = 'payment';
const QUICK = [50_000, 100_000, 200_000, 300_000, 500_000, 1_000_000, 2_000_000, 5_000_000];
const COLS = ['grid-cols-1', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3'];

/** Roving tabindex: strelkalar bilan tanlash (radio guruh xatti-harakati) */
const arrowStep = (e: KeyboardEvent<HTMLButtonElement>, i: number, n: number) => {
  const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
  if (!d) return null;
  e.preventDefault();
  const next = (i + d + n) % n;
  (e.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
  return next;
};

/** Katta to'lov turi tugmalari — tanlangani lime (oynadagi yagona lime) */
const MethodPicker = ({ value, onChange, methods }: { value?: PaymentMethod; onChange?: (m: PaymentMethod) => void; methods: PaymentMethod[] }) => (
  <div role="radiogroup" aria-label="To‘lov turi" className={cn('grid gap-1.5', COLS[methods.length] ?? 'grid-cols-3')}>
    {methods.map((m, i) => {
      const Icon = METHOD_ICON[m];
      const active = value === m;
      return (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={active}
          tabIndex={active || (!value && i === 0) ? 0 : -1}
          title={PAYMENT_METHOD[m]}
          onClick={() => onChange?.(m)}
          onKeyDown={(e) => {
            const next = arrowStep(e, i, methods.length);
            if (next !== null) onChange?.(methods[next]!);
          }}
          className={cn(
            'flex h-18 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border-0 text-sm transition-colors',
            active ? 'bg-lime text-on-lime' : 'bg-subtle text-ink hover:bg-subtle-strong',
          )}
        >
          <Icon size={20} strokeWidth={1.5} />
          {METHOD_SHORT[m]}
        </button>
      );
    })}
  </div>
);

/** Ochiq hisob-fakturalar — kartochkalar ro'yxati (eng eskisi tepada) */
const InvoicePicker = ({ value, onChange, invoices, loading }: { value?: string; onChange?: (id: string) => void; invoices: InvoiceView[]; loading: boolean }) => {
  if (loading && !invoices.length) return <Skeleton.Input active block />;
  if (!invoices.length)
    return <div className="rounded-md bg-subtle px-4 py-3 text-sm text-muted">Ochiq hisob-faktura yo‘q — bemorning qarzi yo‘q</div>;
  return (
    <div role="radiogroup" aria-label="Hisob-faktura" className="flex max-h-60 flex-col gap-1.5 overflow-y-auto">
      {invoices.map((inv, i) => {
        const active = value === inv.id;
        return (
          <button
            key={inv.id}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active || (!value && i === 0) ? 0 : -1}
            onClick={() => onChange?.(inv.id)}
            onKeyDown={(e) => {
              const next = arrowStep(e, i, invoices.length);
              if (next !== null) onChange?.(invoices[next]!.id);
            }}
            className={cn(
              'flex w-full cursor-pointer items-center gap-3 rounded-md border-0 px-4 py-3 text-left text-ink transition-colors',
              active ? 'bg-lime-soft' : 'bg-subtle hover:bg-subtle-strong',
            )}
          >
            <span className={cn('grid size-6 shrink-0 place-items-center rounded-full', active ? 'bg-ink text-on-ink' : 'bg-surface')}>
              {active && <Check size={14} strokeWidth={2} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm tabular-nums">
                <span className="font-medium">{inv.number}</span> <span className="text-muted">· {formatDate(inv.createdAt)}</span>
              </span>
              <span className="block truncate text-xs text-muted" title={inv.lineViews.map((l) => l.serviceName).join(', ')}>
                {inv.doctorName} · {inv.lineViews.map((l) => l.serviceName).join(', ')}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <MoneyText value={inv.remaining} debt className="block text-sm" />
              <span className="block text-xs tabular-nums text-muted">jami {formatMoney(inv.total)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};

/**
 * To'lov qabul qilish (kassir uchun eng tez yo'l): bemor → hisob (avto) → summa (qoldiq bilan to'ldirilgan) → turi → Enter.
 * Summa qoldiqdan oshmaydi (avans MVPda yo'q). Chegirma — ruxsat bo'lsa, almashtirgich ortida.
 */
export const PaymentModal = () => {
  const { open, patientId, invoiceId, doctorId, followUpBooked, close } = usePaymentModal();
  const openNewAppointment = useNewAppointment((s) => s.show);
  const [form] = Form.useForm<Values>();
  const { message, modal } = App.useApp();
  const receive = useReceivePayment();
  const discount = useDiscount();
  const canDiscount = usePermission('payment.discount');
  const { data: clinic } = useClinic();
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const pid = Form.useWatch('patientId', form);
  const iid = Form.useWatch('invoiceId', form);
  const amount = (Form.useWatch('amount', form) as number | undefined) ?? 0;
  const method = Form.useWatch('method', form) as PaymentMethod | undefined;
  const discountOn = !!Form.useWatch('discountOn', form) && canDiscount;
  const dMode = (Form.useWatch('discountMode', form) as Values['discountMode']) ?? 'percent';
  const dValue = (Form.useWatch('discountValue', form) as number | undefined) ?? 0;

  const { data: invoices = [], isFetching } = useOpenInvoices(pid);
  const inv = invoices.find((i) => i.id === iid);
  const methods = (Object.keys(PAYMENT_METHOD) as PaymentMethod[]).filter((m) => clinic?.paymentMethods[m] ?? true);
  const totalDebt = invoices.reduce((s, i) => s + i.remaining, 0);
  const busy = receive.isPending || discount.isPending;

  // Chegirma API'si butun hisob chegirmasini almashtiradi: yangi qoldiq = qatorlar summasi − chegirma − to'langan
  const base = inv?.lineViews.reduce((s, l) => s + l.sum, 0) ?? 0;
  const discountAmt = inv && discountOn && dValue > 0 ? (dMode === 'percent' ? Math.round((base * Math.min(dValue, 100)) / 100) : dValue) : 0;
  const payable = inv ? (discountOn ? Math.max(0, base - discountAmt - inv.paid) : inv.remaining) : 0;
  const after = Math.max(0, payable - amount);
  // Tez tanlash: to'liq qoldiq + qoldiqdan kichik 3 ta yaxlit summa (kattasidan)
  const quick = [payable, ...QUICK.filter((q) => q < payable).slice(-3).reverse()];

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({ patientId, invoiceId, method: methods.includes('CASH') ? 'CASH' : methods[0], discountMode: 'percent' });
    // Bemor berilmagan bo'lsa — darhol qidiruvga fokus (Modal o'z fokusini qo'ygandan keyin)
    if (patientId) return;
    const t = setTimeout(() => document.getElementById(`${FORM}_patientId`)?.focus(), 120);
    return () => clearTimeout(t);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- faqat oyna ochilganda (to'lov turlari ro'yxati har renderda yangi massiv)
  }, [open, patientId, invoiceId, form]);

  // Bemor tanlanganda — eng eski ochiq hisob avtomatik tanlanadi
  useEffect(() => {
    if (open && !iid && invoices.length) form.setFieldValue('invoiceId', invoices[0]!.id);
  }, [open, iid, invoices, form]);

  // Hisob tanlanganda (yoki chegirma qoldiqni o'zgartirganda) — summa = qoldiq; kassir faqat Enter bosadi yoki summani yozadi
  const prevPayable = useRef(0);
  const invId = inv?.id;
  useEffect(() => {
    if (!open || !invId) return;
    const cur = form.getFieldValue('amount') as number | undefined;
    // kassir summani o'zi yozgan bo'lsa (va u yangi qoldiqdan oshmasa) — tegilmaydi
    if (cur === undefined || cur === prevPayable.current || cur > payable) form.setFieldValue('amount', payable || undefined);
    prevPayable.current = payable;
  }, [open, invId, payable, form]);

  useEffect(() => {
    if (!open || !invId) return;
    form.setFieldValue('amount', payable || undefined);
    prevPayable.current = payable;
    const t = setTimeout(() => {
      const el = document.getElementById(`${FORM}_amount`) as HTMLInputElement | null;
      el?.focus();
      el?.select();
    }, 50);
    return () => clearTimeout(t);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- faqat tanlangan hisob o'zgarganda (qayta yuklanishda kassir summasi saqlanadi)
  }, [open, invId, form]);

  const done = (p: PaymentView, rest: number) => {
    const dlg = modal.success({
      title: `${formatMoney(p.amount)} qabul qilindi`,
      content: (
        <div className="flex flex-col gap-1">
          <div>
            {p.patientName} · {p.invoiceNumber} · {PAYMENT_METHOD[p.method]}
          </div>
          {rest > 0 ? <div className="text-danger">Qoldiq qarz: {formatMoney(rest)}</div> : <div className="text-muted">Hisob to‘liq yopildi</div>}
          {followUpBooked && <div className="text-muted">Keyingi tashrif allaqachon belgilangan</div>}
        </div>
      ),
      okText: 'Yopish',
      width: 480,
      footer: (_, { OkBtn }) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button icon={<Printer size={18} strokeWidth={1.5} />} onClick={() => setReceiptId(p.id)}>
            Chek chop etish
          </Button>
          {!followUpBooked && (
            <Button
              icon={<CalendarPlus size={18} strokeWidth={1.5} />}
              onClick={() => {
                dlg.destroy();
                openNewAppointment({ patientId: p.patientId, doctorId });
              }}
            >
              Keyingi qabulga yozish
            </Button>
          )}
          <OkBtn />
        </div>
      ),
    });
  };

  const submit = async (v: Values) => {
    if (!inv || busy) return;
    try {
      if (discountOn) {
        await discount.mutateAsync({ invoiceId: inv.id, lineIndex: null, mode: v.discountMode ?? 'percent', value: v.discountValue ?? 0, reason: v.discountReason ?? '' });
      }
      if (payable <= 0) {
        message.success('Chegirma qo‘llandi — hisob to‘liq yopildi');
        close();
        return;
      }
      const p = await receive.mutateAsync({ invoiceId: inv.id, amount: v.amount ?? 0, method: v.method, note: v.note?.trim() || undefined });
      close();
      done(p, payable - p.amount);
    } catch (e) {
      message.error(errorMessage(e));
    }
  };

  // Enter — tasdiqlash (qidiruv ro'yxati, matn maydoni va oddiy tugmalardan tashqari)
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    const t = e.target as HTMLElement;
    if (t.closest('.ant-select') || t.tagName === 'TEXTAREA' || (t.tagName === 'BUTTON' && t.getAttribute('role') !== 'radio')) return;
    e.preventDefault();
    form.submit();
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={close}
        title="To‘lov qabul qilish"
        width={560}
        destroyOnHidden
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="mr-auto hidden text-xs text-muted sm:inline">Enter — qabul qilish</span>
            <Button onClick={close}>Bekor qilish</Button>
            <Button type="primary" loading={busy} disabled={!inv} onClick={() => form.submit()}>
              {inv && payable <= 0 ? 'Chegirmani qo‘llash' : 'Qabul qilish'}
            </Button>
          </div>
        }
      >
        <div onKeyDown={onKeyDown}>
          <Form form={form} name={FORM} layout="vertical" className="mt-4" requiredMark={false} onFinish={(v) => void submit(v)}>
            <Form.Item name="patientId" label="Bemor" rules={[{ required: true, message: 'Bemorni tanlang' }]}>
              <PayerSelect autoFocus={!patientId} onChange={() => form.setFieldsValue({ invoiceId: undefined, amount: undefined, discountOn: false })} />
            </Form.Item>

            {pid && (
              <Form.Item
                name="invoiceId"
                label={invoices.length > 1 ? `Ochiq hisob-fakturalar · jami qarz ${formatMoney(totalDebt)}` : 'Hisob-faktura'}
                rules={[{ required: true, message: 'Hisob-fakturani tanlang' }]}
              >
                <InvoicePicker invoices={invoices} loading={isFetching} />
              </Form.Item>
            )}

            {inv && (
              <>
                <Form.Item
                  name="amount"
                  label="Summa"
                  className="mb-2"
                  rules={[
                    {
                      validator: (_, v?: number) =>
                        payable <= 0
                          ? Promise.resolve()
                          : !v || v <= 0
                            ? Promise.reject(new Error('Summani kiriting'))
                            : v > payable
                              ? Promise.reject(new Error(`Qoldiqdan oshmasin: ${formatMoney(payable)}`))
                              : Promise.resolve(),
                    },
                  ]}
                >
                  <MoneyInput size="large" max={payable} disabled={payable <= 0} />
                </Form.Item>
                {payable > 0 && (
                  <div className="mb-5 flex flex-wrap gap-1.5">
                    {quick.map((q, i) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => form.setFieldValue('amount', q)}
                        className={cn(
                          'inline-flex h-8 cursor-pointer items-center rounded-pill border-0 px-3 text-xs tabular-nums transition-colors',
                          amount === q ? 'bg-ink text-on-ink' : 'bg-subtle text-ink hover:bg-subtle-strong',
                        )}
                      >
                        {i === 0 ? `To‘liq · ${formatMoney(q, false)}` : formatMoney(q, false)}
                      </button>
                    ))}
                  </div>
                )}

                <Form.Item name="method" label="To‘lov turi" rules={[{ required: true, message: 'To‘lov turini tanlang' }]}>
                  <MethodPicker methods={methods} />
                </Form.Item>

                {canDiscount && (
                  <div className="mb-5">
                    <label className="flex cursor-pointer items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm">
                        <BadgePercent size={20} strokeWidth={1.5} />
                        Chegirma berish
                      </span>
                      <Form.Item name="discountOn" valuePropName="checked" noStyle>
                        <Switch aria-label="Chegirma berish" />
                      </Form.Item>
                    </label>
                    {discountOn && (
                      <div className="mt-4">
                        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                          <Form.Item name="discountMode" label="Turi">
                            <Segmented
                              options={[
                                { value: 'percent', label: '%' },
                                { value: 'amount', label: 'so‘m' },
                              ]}
                              onChange={() => form.setFieldValue('discountValue', undefined)}
                            />
                          </Form.Item>
                          <Form.Item
                            name="discountValue"
                            label="Qiymat"
                            rules={[
                              { required: true, message: 'Qiymatni kiriting' },
                              {
                                validator: (_, v?: number) =>
                                  v && dMode === 'percent' && v > 100
                                    ? Promise.reject(new Error('Foiz 100 dan oshmasin'))
                                    : v && dMode === 'amount' && v > base - inv.paid
                                      ? Promise.reject(new Error(`Ko‘pi bilan ${formatMoney(Math.max(0, base - inv.paid))}`))
                                      : Promise.resolve(),
                              },
                            ]}
                          >
                            {dMode === 'percent' ? <InputNumber min={1} max={100} suffix="%" className="w-full tabular-nums" /> : <MoneyInput min={1} />}
                          </Form.Item>
                        </div>
                        <Form.Item name="discountReason" label="Sabab" className="mb-0" rules={[{ required: true, whitespace: true, message: 'Chegirma sababi majburiy' }]}>
                          <Input maxLength={200} placeholder="Masalan, doimiy bemor" />
                        </Form.Item>
                        {inv.discount > 0 && (
                          <div className="mt-2 text-xs text-muted">Hisobdagi avvalgi chegirma ({formatMoney(inv.discount)}) yangisi bilan almashtiriladi</div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <Form.Item name="note" label="Izoh" className="mb-5">
                  <Input maxLength={200} placeholder="Ixtiyoriy" />
                </Form.Item>

                <div className="flex flex-wrap items-end justify-between gap-3 rounded-md bg-subtle px-5 py-4">
                  <div className="min-w-0">
                    <div className="text-xs text-muted">To‘lanadi{method ? ` · ${PAYMENT_METHOD[method]}` : ''}</div>
                    <div className="text-3xl font-normal tracking-[-0.02em] text-ink">
                      <Amount value={payable > 0 ? amount : 0} />
                    </div>
                    {discountAmt > 0 && <div className="text-xs tabular-nums text-muted">Chegirma: {formatMoney(-discountAmt)}</div>}
                  </div>
                  {after > 0 ? <StatusTag tone="warning">Qarz qoladi: {formatMoney(after)}</StatusTag> : <StatusTag tone="success">Hisob to‘liq yopiladi</StatusTag>}
                </div>
              </>
            )}
          </Form>
        </div>
      </Modal>
      <ReceiptPrinter paymentId={receiptId} onDone={() => setReceiptId(null)} />
    </>
  );
};
