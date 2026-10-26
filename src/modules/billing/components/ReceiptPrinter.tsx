import { useEffect } from 'react';
import { usePrint } from '@/shared/components/ui';
import { PAYMENT_METHOD } from '@/shared/constants/status';
import { formatDateTime, formatMoney, formatNumber } from '@/shared/utils/format';
import { usePaymentReceipt } from '../hooks/useBilling';

/** 80 mm termal chek: ma'lumot yuklangach chop etish oynasi ochiladi */
export const ReceiptPrinter = ({ paymentId, onDone }: { paymentId: string | null; onDone: () => void }) => {
  const { data } = usePaymentReceipt(paymentId);
  const { print, portal, printing } = usePrint();

  useEffect(() => {
    if (data && paymentId) print();
  }, [data, paymentId, print]);

  useEffect(() => {
    if (!printing && data && paymentId) {
      const t = setTimeout(onDone, 300);
      return () => clearTimeout(t);
    }
  }, [printing, data, paymentId, onDone]);

  if (!data) return null;
  const { payment: p, invoice: inv, clinic } = data;
  const line = <div className="my-2 border-t border-dashed border-neutral-400" />;
  return portal(
    <div className="print-receipt mx-auto font-mono leading-5 text-ink">
      <div className="whitespace-pre-line text-center font-medium">{clinic.receiptHeader}</div>
      {line}
      <div className="flex justify-between">
        <span>Chek:</span>
        <span>{p.id.toUpperCase()}</span>
      </div>
      <div className="flex justify-between">
        <span>Sana:</span>
        <span>{formatDateTime(p.createdAt)}</span>
      </div>
      <div className="flex justify-between">
        <span>Hisob:</span>
        <span>{inv.number}</span>
      </div>
      <div>Bemor: {inv.patientName}</div>
      {line}
      {inv.lineViews.map((l, i) => (
        <div key={i} className="mb-1">
          <div>
            {l.serviceName}
            {l.tooth ? ` (${l.tooth})` : ''}
          </div>
          <div className="flex justify-between">
            <span>
              {l.qty} × {formatNumber(l.price)}
              {l.discount ? ` −${formatNumber(l.discount)}` : ''}
            </span>
            <span>{formatNumber(l.sum)}</span>
          </div>
        </div>
      ))}
      {inv.discount > 0 && (
        <div className="flex justify-between">
          <span>Chegirma</span>
          <span>−{formatNumber(inv.discount)}</span>
        </div>
      )}
      {line}
      <div className="flex justify-between font-medium">
        <span>JAMI</span>
        <span>{formatMoney(inv.total)}</span>
      </div>
      <div className="flex justify-between">
        <span>To‘landi ({PAYMENT_METHOD[p.method]})</span>
        <span>{formatNumber(p.amount)}</span>
      </div>
      <div className="flex justify-between">
        <span>Qoldiq</span>
        <span>{formatNumber(inv.remaining)}</span>
      </div>
      <div className="mt-1">Kassir: {p.receivedByName}</div>
      {line}
      <div className="whitespace-pre-line text-center">{clinic.receiptFooter}</div>
    </div>,
  );
};
