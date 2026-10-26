import type { useAppProps } from 'antd/es/app/context';
import { formatMoney } from '@/shared/utils/format';

interface Summary {
  total: number;
  paid: number;
  /** To'lov bo'limi ko'rsatilganmi (registratura / boshqaruvchi) */
  canReceive: boolean;
  followUp?: string;
}

/** Yakunlashdan oldin qisqa xulosa — yakunlangan qabul qayta ochilmaydi */
export const confirmCompletion = (modal: useAppProps['modal'], s: Summary, onOk: () => unknown) =>
  modal.confirm({
    title: 'Qabul yakunlansinmi?',
    width: 440,
    content: (
      <div className="flex flex-col gap-1">
        <div>
          Jami: <span className="font-medium tabular-nums">{formatMoney(s.total)}</span>
        </div>
        {s.canReceive && (
          <>
            <div>
              Hozir to‘lanadi: <span className="font-medium tabular-nums">{formatMoney(s.paid)}</span>
            </div>
            {s.total - s.paid > 0 && <div className="text-danger">Qarz qoladi: {formatMoney(s.total - s.paid)}</div>}
          </>
        )}
        <div className="text-muted">Keyingi tashrif: {s.followUp ?? 'belgilanmagan'}</div>
        <div className="mt-2 text-xs text-muted">Yakunlangan qabulni qayta ochib bo‘lmaydi.</div>
      </div>
    ),
    okText: 'Ha, yakunlash',
    cancelText: 'Orqaga',
    onOk,
  });
