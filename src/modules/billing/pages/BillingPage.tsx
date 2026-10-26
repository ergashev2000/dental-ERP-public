import { Button, DatePicker, Select, Tabs } from 'antd';
import { Wallet } from '@/shared/icons';
import dayjs from '@/shared/lib/dayjs';
import { Can, FilterBar, PageHeader, Panel, SearchInput } from '@/shared/components/ui';
import { INVOICE_STATUS, PAYMENT_METHOD } from '@/shared/constants/status';
import { BILLING_TABS, INVOICE_STATUSES, PAYMENT_METHODS, useBillingParams, useDebtors, useInvoices, usePayments } from '../hooks/useBilling';
import { usePaymentModal } from '../store/paymentModalStore';
import { CashboxTab } from '../components/CashboxTab';
import { DebtorsTable, InvoicesTable, PaymentsTable } from '../components/BillingTables';
import { InvoiceDrawer } from '../components/InvoiceDrawer';
import { TodayStats } from '../components/TodayStats';
import { Amount } from '../components/billingUi';

const PAGE = 10;
const iso = (d: Date | null) => (d ? dayjs(d).format('YYYY-MM-DD') : null);

/** Tab yorlig'i yonidagi kichik son (masalan, qarzdorlar soni) */
const Count = ({ n }: { n?: number }) =>
  n ? <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-subtle px-1.5 text-xs tabular-nums text-ink">{n}</span> : null;

export const BillingPage = () => {
  const [p, setP] = useBillingParams();
  const openPayment = usePaymentModal((s) => s.show);
  const invoices = useInvoices({ q: p.q, status: p.status, page: p.page, pageSize: PAGE }, p.tab === 'invoices');
  const payments = usePayments({ q: p.q, method: p.method, from: iso(p.from), to: iso(p.to), page: p.page, pageSize: PAGE }, p.tab === 'payments');
  const debtors = useDebtors(p.tab === 'debtors' ? p.q : null);
  const allDebtors = useDebtors(null);
  const set = (patch: Partial<typeof p>) => void setP({ ...patch, page: 1 });
  const setTab = (tab: (typeof BILLING_TABS)[number]) => void setP({ tab, page: 1, q: null });
  const debtTotal = debtors.data?.reduce((s, d) => s + d.debt, 0) ?? 0;

  return (
    <>
      <PageHeader
        title="To‘lovlar"
        description="Bugungi kassa, hisob-fakturalar va qarzdorlar"
        breadcrumb={[{ label: 'Bosh sahifa', to: '/' }, { label: 'To‘lovlar' }]}
        actions={
          <Can perm="payment.receive">
            <Button type="primary" icon={<Wallet size={18} strokeWidth={1.5} />} onClick={() => openPayment()}>
              To‘lov qabul qilish
            </Button>
          </Can>
        }
      />
      <TodayStats onDebtors={() => setTab('debtors')} />
      <Panel className="flex-1" bodyClassName="px-3 pb-4 md:px-4">
        <Tabs
          activeKey={p.tab}
          onChange={(k) => setTab(k as (typeof BILLING_TABS)[number])}
          items={[
            {
              key: 'invoices',
              label: 'Hisob-fakturalar',
              children: (
                <>
                  <FilterBar active={!!(p.q || p.status)} onReset={() => set({ q: null, status: null })}>
                    <SearchInput value={p.q} onChange={(q) => set({ q })} placeholder="Raqam, bemor yoki telefon" />
                    <Select
                      allowClear
                      placeholder="Holat"
                      className="w-full sm:w-44"
                      value={p.status ?? undefined}
                      onChange={(s?: (typeof INVOICE_STATUSES)[number]) => set({ status: s ?? null })}
                      options={INVOICE_STATUSES.map((s) => ({ value: s, label: INVOICE_STATUS[s].label }))}
                    />
                  </FilterBar>
                  <InvoicesTable
                    data={invoices.data?.items}
                    loading={invoices.isFetching}
                    onOpen={(invoice) => void setP({ invoice })}
                    pager={{ current: p.page, total: invoices.data?.total, pageSize: PAGE, onChange: (page) => void setP({ page }) }}
                  />
                </>
              ),
            },
            {
              key: 'payments',
              label: 'To‘lovlar',
              children: (
                <>
                  <FilterBar active={!!(p.q || p.method || p.from)} onReset={() => set({ q: null, method: null, from: null, to: null })}>
                    <SearchInput value={p.q} onChange={(q) => set({ q })} placeholder="Bemor" />
                    <Select
                      allowClear
                      placeholder="To‘lov turi"
                      className="w-full sm:w-44"
                      value={p.method ?? undefined}
                      onChange={(m?: (typeof PAYMENT_METHODS)[number]) => set({ method: m ?? null })}
                      options={PAYMENT_METHODS.map((m) => ({ value: m, label: PAYMENT_METHOD[m] }))}
                    />
                    <DatePicker.RangePicker
                      format="DD.MM.YYYY"
                      className="w-full sm:w-auto"
                      value={p.from && p.to ? [dayjs(p.from), dayjs(p.to)] : null}
                      onChange={(r) => set({ from: r?.[0]?.toDate() ?? null, to: r?.[1]?.toDate() ?? null })}
                    />
                  </FilterBar>
                  <PaymentsTable
                    data={payments.data?.items}
                    loading={payments.isFetching}
                    pager={{ current: p.page, total: payments.data?.total, pageSize: PAGE, onChange: (page) => void setP({ page }) }}
                  />
                </>
              ),
            },
            {
              key: 'debtors',
              label: (
                <span className="inline-flex items-center">
                  Qarzdorlar
                  <Count n={allDebtors.data?.length} />
                </span>
              ),
              children: (
                <>
                  <FilterBar
                    active={!!p.q}
                    onReset={() => set({ q: null })}
                    extra={
                      debtors.data?.length ? (
                        <span className="text-sm text-muted">
                          {debtors.data.length} bemor · jami <Amount value={debtTotal} className="text-ink" />
                        </span>
                      ) : null
                    }
                  >
                    <SearchInput value={p.q} onChange={(q) => set({ q })} placeholder="Bemor yoki telefon" />
                  </FilterBar>
                  <DebtorsTable data={debtors.data} loading={debtors.isFetching} />
                </>
              ),
            },
            {
              key: 'cashbox',
              label: 'Kassa',
              children: <CashboxTab date={iso(p.date) ?? dayjs().format('YYYY-MM-DD')} onDate={(date) => void setP({ date })} />,
            },
          ]}
        />
      </Panel>
      <InvoiceDrawer id={p.invoice} onClose={() => void setP({ invoice: null })} />
    </>
  );
};
