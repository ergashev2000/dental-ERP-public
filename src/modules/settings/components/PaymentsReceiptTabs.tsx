import { App, Button, Form, Input, Skeleton, Switch } from 'antd';
import { useEffect, useState } from 'react';
import { ArrowRightLeft, CreditCard, Wallet, type AppIcon } from '@/shared/icons';
import { Panel } from '@/shared/components/ui';
import { PAYMENT_METHOD } from '@/shared/constants/status';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { formatDateTime } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import type { PaymentMethod } from '@/modules/billing/types';
import { useClinic, useUpdateClinic } from '../hooks/useSettings';
import { SettingsSection } from './SettingsSection';

const METHOD_META: Record<PaymentMethod, { icon: AppIcon; hint: string }> = {
  CASH: { icon: Wallet, hint: 'Kassaga naqd pul' },
  TRANSFER: { icon: ArrowRightLeft, hint: 'Bemor kartasidan klinika kartasiga o‘tkazma' },
  CARD: { icon: CreditCard, hint: 'Terminal orqali (Uzcard, Humo)' },
};

export const PaymentMethodsTab = () => {
  const { data } = useClinic();
  const update = useUpdateClinic();
  const { message } = App.useApp();
  /** Qaysi tur saqlanmoqda — faqat o'sha switch aylanadi */
  const [pending, setPending] = useState<PaymentMethod | null>(null);

  const methods = Object.keys(PAYMENT_METHOD) as PaymentMethod[];
  const enabled = data ? methods.filter((m) => data.paymentMethods[m]).length : 0;

  return (
    <SettingsSection
      title="Kassada qabul qilinadi"
      description="O‘chirilgan to‘lov turi to‘lov oynasida ko‘rinmaydi. Kamida bitta tur yoqilgan bo‘lishi kerak."
      extra={
        data && (
          <span className="inline-flex h-7.5 shrink-0 items-center rounded-pill bg-subtle px-3 text-xs tabular-nums">
            {enabled} / {methods.length} yoqilgan
          </span>
        )
      }
    >
      {!data ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1.5 rounded-sheet bg-panel p-2">
          {methods.map((m) => {
            const { icon: Icon, hint } = METHOD_META[m];
            const on = data.paymentMethods[m];
            const last = on && enabled === 1;
            const id = `pay-${m}`;
            return (
              <li key={m}>
                <label htmlFor={id} className={cn('flex items-center gap-3 rounded-card bg-surface py-2 pl-2 pr-4', last ? 'cursor-not-allowed' : 'cursor-pointer')}>
                  <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', on ? 'bg-ink text-on-ink' : 'bg-subtle text-muted')} aria-hidden>
                    <Icon size={20} strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className={cn('block text-sm', !on && 'text-muted')}>{PAYMENT_METHOD[m]}</span>
                    <span className="block text-xs text-muted">{last ? 'Oxirgi yoqilgan tur — o‘chirib bo‘lmaydi' : hint}</span>
                  </span>
                  <Switch
                    id={id}
                    checked={on}
                    disabled={last}
                    loading={update.isPending && pending === m}
                    onChange={(next) => {
                      setPending(m);
                      update.mutate(
                        { paymentMethods: { ...data.paymentMethods, [m]: next } },
                        {
                          onSuccess: () => message.success(`${PAYMENT_METHOD[m]} ${next ? 'yoqildi' : 'o‘chirildi'}`),
                          onError: (e) => message.error(errorMessage(e)),
                        },
                      );
                    }}
                  />
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </SettingsSection>
  );
};

/** Namuna chek sanasi (modul yuklanganda bir marta) */
const SAMPLE_DATE = formatDateTime(new Date().toISOString());

/** Chek namunasi (80 mm): ReceiptPrinter tuzilishiga o'xshash, matnlar formadan jonli olinadi */
const ReceiptPreview = ({ header, footer }: { header?: string; footer?: string }) => {
  const line = <div className="my-2 border-t border-dashed border-neutral-400" />;
  const row = (a: string, b: string, cls?: string) => (
    <div className={cn('flex justify-between gap-3', cls)}>
      <span>{a}</span>
      <span className="tabular-nums">{b}</span>
    </div>
  );
  return (
    <div className="rounded-sheet bg-panel p-4 sm:p-6">
      <div className="mx-auto w-full max-w-72 rounded-sm bg-surface px-4 py-5 font-mono text-xs leading-5 text-ink" aria-label="Chek namunasi">
        <div className={cn('whitespace-pre-line text-center font-medium', !header && 'text-hint')}>{header || 'Tepadagi matn shu yerda'}</div>
        {line}
        {row('Chek:', 'P-1024')}
        {row('Sana:', SAMPLE_DATE)}
        <div>Bemor: Namuna Bemor</div>
        {line}
        <div>Tish plombalash (36)</div>
        {row('1 × 350 000', '350 000')}
        <div className="mt-1">Professional tozalash</div>
        {row('1 × 250 000', '250 000')}
        {line}
        {row('JAMI', '600 000 so‘m', 'font-medium')}
        {row('To‘landi (Naqd pul)', '600 000')}
        {row('Qoldiq', '0')}
        {line}
        <div className={cn('whitespace-pre-line text-center', !footer && 'text-hint')}>{footer || 'Pastdagi matn shu yerda'}</div>
      </div>
    </div>
  );
};

export const ReceiptTab = () => {
  const { data } = useClinic();
  const update = useUpdateClinic();
  const { message } = App.useApp();
  const [form] = Form.useForm<{ receiptHeader: string; receiptFooter: string }>();
  const header = Form.useWatch('receiptHeader', form);
  const footer = Form.useWatch('receiptFooter', form);
  const dirty = !!data && ((header ?? '') !== data.receiptHeader || (footer ?? '') !== data.receiptFooter);

  useEffect(() => {
    if (data) form.setFieldsValue({ receiptHeader: data.receiptHeader, receiptFooter: data.receiptFooter });
  }, [data, form]);

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
      <Panel title="Chek matni" bodyClassName="p-5 pt-4">
        <p className="mb-5 mt-0 text-sm text-muted">
          Har bir to‘lov chekining tepasi va pastida chiqadi. Odatda tepada — klinika nomi, manzil va telefon; pastda — minnatdorchilik va keyingi tashrif eslatmasi.
        </p>
        <Form
          form={form}
          layout="vertical"
          onFinish={(v) => update.mutate(v, { onSuccess: () => message.success('Chek matni saqlandi'), onError: (e) => message.error(errorMessage(e)) })}
        >
          <Form.Item name="receiptHeader" label="Chek tepasidagi matn">
            <Input.TextArea rows={4} maxLength={300} showCount placeholder={'Klinika nomi\nManzil\nTelefon'} />
          </Form.Item>
          <Form.Item name="receiptFooter" label="Chek pastidagi matn">
            <Input.TextArea rows={3} maxLength={200} showCount placeholder="Tashrifingiz uchun rahmat" />
          </Form.Item>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              disabled={!dirty}
              onClick={() => data && form.setFieldsValue({ receiptHeader: data.receiptHeader, receiptFooter: data.receiptFooter })}
            >
              Bekor qilish
            </Button>
            <Button type="primary" htmlType="submit" disabled={!dirty} loading={update.isPending}>
              Saqlash
            </Button>
          </div>
        </Form>
      </Panel>

      <Panel
        title="Ko‘rinishi"
        extra={<span className="inline-flex h-7.5 items-center rounded-pill bg-subtle px-3 text-xs">80 mm termal chek</span>}
        bodyClassName="p-5 pt-4"
      >
        <ReceiptPreview header={header} footer={footer} />
        <p className="mb-0 mt-3 text-xs text-muted">Namuna — summalar va bemor ma’lumoti haqiqiy chekda to‘lovdan olinadi</p>
      </Panel>
    </div>
  );
};
