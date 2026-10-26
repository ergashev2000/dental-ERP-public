import { App, Button } from 'antd';
import { Printer } from '@/shared/icons';
import { useState } from 'react';
import { usePermission } from '@/shared/hooks/usePermission';
import { formatMoney, formatRelativeDay } from '@/shared/utils/format';
import { ReceiptPrinter } from '@/modules/billing';
import type { CompleteResult } from '../types';

/** Qabul yakunlangach: qisqa xulosa (to'landi / qarz / keyingi tashrif) va chek chop etish */
export const useCompletionResult = (onClosed?: () => void) => {
  const { modal } = App.useApp();
  const canReceive = usePermission('payment.receive');
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const show = (res: CompleteResult) => {
    const done = modal.success({
      title: 'Qabul yakunlandi',
      width: 480,
      afterClose: onClosed,
      content: (
        <div className="flex flex-col gap-1">
          <div>
            Jami: <span className="font-medium tabular-nums">{formatMoney(res.invoiceTotal)}</span>
          </div>
          {canReceive && (
            <div>
              To‘landi: <span className="font-medium tabular-nums">{formatMoney(res.paid)}</span>
            </div>
          )}
          {res.debt > 0 && <div className="text-danger">Qarz qoldi: {formatMoney(res.debt)}</div>}
          {!canReceive && <div className="text-muted">To‘lovni registratura qabul qiladi</div>}
          <div className="text-muted">{res.followUpStart ? `Keyingi tashrif: ${formatRelativeDay(res.followUpStart)}` : 'Keyingi tashrif belgilanmadi'}</div>
        </div>
      ),
      okText: 'Yopish',
      footer: (_, { OkBtn }) => (
        <div className="flex flex-wrap justify-end gap-2">
          {res.paymentId && (
            <Button
              icon={<Printer size={16} strokeWidth={1.5} />}
              onClick={() => {
                setReceiptId(res.paymentId!);
                done.destroy();
              }}
            >
              Chek chop etish
            </Button>
          )}
          <OkBtn />
        </div>
      ),
    });
  };

  return { show, receipt: <ReceiptPrinter paymentId={receiptId} onDone={() => setReceiptId(null)} /> };
};
