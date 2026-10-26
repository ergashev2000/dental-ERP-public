import { Button, DatePicker, Skeleton } from 'antd';
import { Printer } from '@/shared/icons';
import dayjs from '@/shared/lib/dayjs';
import { MoneyText, PrintHeader, Squiggle, StatusTag, usePrint } from '@/shared/components/ui';
import { PAYMENT_METHOD } from '@/shared/constants/status';
import { formatDate, formatMoney, formatTime } from '@/shared/utils/format';
import { useCashbox } from '../hooks/useBilling';
import { PaymentsTable } from './BillingTables';
import { Amount, IconCircle } from './billingUi';
import { METHOD_ICON } from './methodMeta';

/** Kassa: kunlik tushum to'lov turlari bo'yicha. "Kassani yopish" — MVPda chop etiladigan kun hisoboti */
export const CashboxTab = ({ date, onDate }: { date: string; onDate: (d: Date | null) => void }) => {
  const { data, isLoading } = useCashbox(date);
  const { print, portal } = usePrint();
  const isToday = dayjs(date).isSame(dayjs(), 'day');
  const count = data?.byMethod.reduce((s, m) => s + m.count, 0) ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <DatePicker
          value={dayjs(date)}
          onChange={(d) => onDate(d ? d.toDate() : null)}
          format="DD.MM.YYYY"
          allowClear={false}
          disabledDate={(d) => d.isAfter(dayjs())}
          aria-label="Kassa sanasi"
        />
        {!isToday && (
          <Button type="text" onClick={() => onDate(null)}>
            Bugun
          </Button>
        )}
      </div>

      {isLoading || !data ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Kun yakuni — mobil'da birinchi */}
          <section className="flex flex-col gap-5 self-start rounded-card bg-panel p-5 lg:order-last">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="m-0 text-xl font-normal">Kun yakuni</h3>
                <Squiggle />
              </div>
              <StatusTag tone={isToday ? 'info' : 'neutral'}>{isToday ? 'Bugun' : formatDate(date)}</StatusTag>
            </div>

            <div>
              <div className="text-xs text-muted">Kassadagi jami tushum</div>
              <div className="text-3xl font-normal tracking-[-0.02em] text-ink">
                <Amount value={data.total} />
              </div>
              <div className="mt-1 text-xs tabular-nums text-muted">{count} ta to‘lov</div>
            </div>

            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {data.byMethod.map((m) => (
                <li key={m.method} className="flex items-center gap-3 rounded-md bg-surface px-3 py-2.5">
                  <IconCircle icon={METHOD_ICON[m.method]} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{PAYMENT_METHOD[m.method]}</div>
                    <div className="text-xs tabular-nums text-muted">{m.count} ta</div>
                  </div>
                  <Amount value={m.amount} className="text-base" />
                </li>
              ))}
              {data.refunds > 0 && (
                <li className="flex items-center justify-between gap-3 rounded-md bg-surface px-3 py-2.5 text-sm">
                  <StatusTag tone="danger">Qaytarilgan</StatusTag>
                  <MoneyText value={-data.refunds} className="text-danger" />
                </li>
              )}
            </ul>

            <Button type="primary" block icon={<Printer size={18} strokeWidth={1.5} />} onClick={print}>
              Kassani yopish (hisobot)
            </Button>
          </section>

          <div className="min-w-0">
            <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
              <span className="text-base">{isToday ? 'Bugungi to‘lovlar' : `${formatDate(date)} to‘lovlari`}</span>
              <span className="text-xs tabular-nums text-muted">{data.payments.length} ta</span>
            </div>
            <PaymentsTable data={data.payments} />
          </div>
        </div>
      )}

      {data &&
        portal(
          <div>
            <PrintHeader title="Kassa hisoboti" subtitle={formatDate(date)} />
            <table className="w-full text-sm">
              <tbody>
                {data.byMethod.map((m) => (
                  <tr key={m.method}>
                    <td className="py-1">{PAYMENT_METHOD[m.method]}</td>
                    <td className="py-1 text-right">{m.count} ta</td>
                    <td className="py-1 text-right font-medium">{formatMoney(m.amount)}</td>
                  </tr>
                ))}
                {data.refunds > 0 && (
                  <tr>
                    <td className="py-1">Qaytarilgan</td>
                    <td />
                    <td className="py-1 text-right">{formatMoney(-data.refunds)}</td>
                  </tr>
                )}
                <tr className="border-t border-line">
                  <td className="py-2 font-medium">Jami</td>
                  <td className="py-2 text-right">{count} ta</td>
                  <td className="py-2 text-right font-medium">{formatMoney(data.total)}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-6 text-sm font-medium">To‘lovlar</div>
            {data.payments.map((p) => (
              <div key={p.id} className="flex justify-between border-b border-line-soft py-1 text-xs">
                <span>
                  {formatTime(p.createdAt)} · {p.patientName} · {PAYMENT_METHOD[p.method]}
                </span>
                <MoneyText value={p.amount} className={p.refunded ? 'line-through' : ''} />
              </div>
            ))}
            <p className="mt-8 text-xs">Kassir imzosi: ____________ Boshqaruvchi imzosi: ____________</p>
          </div>,
        )}
    </div>
  );
};
