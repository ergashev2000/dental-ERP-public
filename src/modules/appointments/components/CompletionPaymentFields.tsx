import { Form, Radio } from 'antd';
import { Wallet } from '@/shared/icons';
import { useEffect } from 'react';
import { MoneyInput, MoneyText } from '@/shared/components/ui';
import { PAYMENT_METHOD } from '@/shared/constants/status';
import { formatMoney } from '@/shared/utils/format';
import { useClinic } from '@/modules/settings';
import type { PaymentMethod } from '@/modules/billing';
import { paidAmount, type CompletionPaymentValues } from '../utils';

export type { CompletionPaymentValues, PayMode } from '../utils';

/** Yakunlash oynasidagi "To'lov" bo'limi (Form ichida, name="payment") */
export const CompletionPaymentFields = ({ total, previousDebt }: { total: number; previousDebt: number }) => {
  const form = Form.useFormInstance();
  const { data: clinic } = useClinic();
  const payment = Form.useWatch('payment', form) as Partial<CompletionPaymentValues> | undefined;
  const mode = payment?.mode ?? 'FULL';
  const paid = paidAmount(payment, total);
  const debt = Math.max(0, total - paid);
  const methods = (Object.keys(PAYMENT_METHOD) as PaymentMethod[]).filter((m) => clinic?.paymentMethods[m] ?? true);

  // Jami summa kamaysa — qisman summa undan oshib ketmasin
  useEffect(() => {
    if (mode === 'PARTIAL' && (payment?.amount ?? 0) > total) form.setFieldValue(['payment', 'amount'], total);
  }, [mode, payment?.amount, total, form]);

  return (
    <div className="mb-6 rounded-md bg-subtle p-4">
      <div className="mb-3 flex items-center gap-3">
        <Wallet size={18} strokeWidth={1.5} className="text-ink" />
        <div className="flex-1">
          <div className="font-medium">To‘lov</div>
          <div className="text-xs text-muted">Bemor hozir qancha to‘ladi — qolgani avtomatik qarz bo‘lib yoziladi</div>
        </div>
      </div>

      <Form.Item name={['payment', 'mode']} className="mb-3">
        <Radio.Group
          optionType="button"
          className="flex flex-wrap gap-y-2"
          options={[
            { value: 'FULL', label: 'To‘liq to‘ladi' },
            { value: 'PARTIAL', label: 'Qisman to‘ladi' },
            { value: 'DEBT', label: 'Keyin to‘laydi (qarz)' },
          ]}
        />
      </Form.Item>

      {mode === 'PARTIAL' && (
        <Form.Item
          name={['payment', 'amount']}
          label="Hozir to‘lagan summa"
          rules={[
            {
              validator: (_, v?: number) =>
                !v || v <= 0
                  ? Promise.reject(new Error('Summani kiriting'))
                  : v >= total
                    ? Promise.reject(new Error(`To‘liq summa (${formatMoney(total)}) bo‘lsa «To‘liq to‘ladi»ni tanlang`))
                    : Promise.resolve(),
            },
          ]}
        >
          <MoneyInput max={total} autoFocus />
        </Form.Item>
      )}

      {mode !== 'DEBT' && (
        <Form.Item name={['payment', 'method']} label="To‘lov turi" rules={[{ required: true, message: 'To‘lov turini tanlang' }]}>
          <Radio.Group optionType="button" className="flex flex-wrap gap-y-2" options={methods.map((m) => ({ value: m, label: PAYMENT_METHOD[m] }))} />
        </Form.Item>
      )}

      <div className="grid grid-cols-3 gap-2 rounded-md bg-surface px-4 py-3 text-sm">
        <div>
          <div className="text-xs text-muted">Jami</div>
          <MoneyText value={total} strong />
        </div>
        <div>
          <div className="text-xs text-muted">Hozir to‘lanadi</div>
          <MoneyText value={paid} strong />
        </div>
        <div>
          <div className="text-xs text-muted">Qarz qoladi</div>
          {debt > 0 ? <MoneyText value={debt} debt strong /> : <span className="font-medium text-success">Qarz yo‘q</span>}
        </div>
      </div>
      {previousDebt > 0 && (
        <div className="mt-2 text-xs text-muted">
          Bemorning oldingi qarzi: <MoneyText value={previousDebt} debt /> — uni «To‘lov qabul qilish» orqali alohida yopish mumkin.
        </div>
      )}
    </div>
  );
};
