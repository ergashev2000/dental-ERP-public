import { Button, Skeleton } from 'antd';
import { CircleDollarSign, HandCoins } from '@/shared/icons';
import dayjs from '@/shared/lib/dayjs';
import { StatCard } from '@/shared/components/ui';
import { PAYMENT_METHOD } from '@/shared/constants/status';
import { cn } from '@/shared/utils/cn';
import { useCashbox, useDebtors } from '../hooks/useBilling';
import { Amount, IconCircle } from './billingUi';
import { METHOD_ICON } from './methodMeta';

/**
 * To'lovlar sahifasi tepasidagi bugungi ko'rsatkichlar:
 * tushum (qatordagi yagona lime blok), to'lov turlari bo'yicha bo'linish va umumiy qarzdorlik.
 */
export const TodayStats = ({ onDebtors }: { onDebtors: () => void }) => {
  const today = dayjs().format('YYYY-MM-DD');
  const { data: cash, isLoading } = useCashbox(today);
  const { data: debtors, isLoading: debtLoading } = useDebtors(null);
  const count = cash?.byMethod.reduce((s, m) => s + m.count, 0) ?? 0;
  const debt = debtors?.reduce((s, d) => s + d.debt, 0) ?? 0;
  const max = Math.max(1, ...(cash?.byMethod.map((m) => m.amount) ?? []));

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {/* Hero — bugungi tushum */}
      <section className="flex flex-col gap-3 rounded-card bg-lime p-5 text-on-lime">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs">Bugungi tushum</span>
          <IconCircle icon={CircleDollarSign} className="bg-surface" />
        </div>
        {isLoading || !cash ? (
          <Skeleton.Input active size="small" />
        ) : (
          <div className="text-3xl font-normal tracking-[-0.02em]">
            <Amount value={cash.total} unitClassName="" />
          </div>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="tabular-nums">{count} ta to‘lov</span>
          {!!cash?.refunds && (
            <span className="tabular-nums">
              Qaytarilgan: <Amount value={cash.refunds} unitClassName="" />
            </span>
          )}
        </div>
      </section>

      {/* To'lov turlari bo'yicha */}
      <section className="flex flex-col gap-3 rounded-card bg-surface p-5 md:order-last md:col-span-2 xl:order-none xl:col-span-1">
        <span className="text-xs text-muted">Bugun to‘lov turlari bo‘yicha</span>
        {isLoading || !cash ? (
          <Skeleton active paragraph={{ rows: 2 }} title={false} />
        ) : (
          <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-3 xl:grid-cols-1">
            {cash.byMethod.map((m) => (
              <li key={m.method} className="flex items-center gap-3">
                <IconCircle icon={METHOD_ICON[m.method]} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate">{PAYMENT_METHOD[m.method]}</span>
                    <Amount value={m.amount} className="text-sm" />
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-pill bg-subtle">
                      <span className={cn('block h-full rounded-pill bg-ink', !m.amount && 'hidden')} style={{ width: `${(m.amount / max) * 100}%` }} />
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted">{m.count} ta</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <StatCard
        icon={HandCoins}
        title="Umumiy qarzdorlik"
        loading={debtLoading}
        value={<Amount value={debt} />}
        hint={
          <>
            <span className="tabular-nums">{debtors?.length ?? 0} bemor</span>
            <Button type="link" size="small" className="h-auto px-1 text-xs" onClick={onDebtors}>
              Ro‘yxatni ochish
            </Button>
          </>
        }
      />
    </div>
  );
};
