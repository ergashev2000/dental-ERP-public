import { Progress, Skeleton, Table } from 'antd';
import type { ReactNode } from 'react';
import { CalendarCheck2, CalendarX2, CircleDollarSign, ClipboardList, type AppIcon } from '@/shared/icons';
import dayjs from '@/shared/lib/dayjs';
import { ColorDot, EmptyState, ErrorState, Panel, StatCard } from '@/shared/components/ui';
import { SimpleColumn } from '@/shared/components/ui/Charts';
import { CALL_RESULT } from '@/shared/constants/status';
import { palette } from '@/shared/theme/tokens';
import { formatMoney, formatNumber, formatPercent } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import type { CallResult } from '@/modules/reminders/types';
import { useDoctors } from '@/modules/staff';
import { reportsApi } from '../api/reportsApi';
import { useReport } from '../hooks/useReports';
import type { ReportQuery } from '../types';

/* ---------- Umumiy bo'laklar ---------- */

/** Summa: raqam asosiy, "so‘m" kichik va xira */
export const Money = ({ value, className }: { value: number; className?: string }) => (
  <span className={cn('whitespace-nowrap tabular-nums', className)}>
    {formatMoney(value, false)} <span className="text-[0.75em] text-muted">so‘m</span>
  </span>
);

/** Ink ustunlar (rangli chart emas) — Charts.tsx standart olive fill'ini almashtiradi */
const INK_COLUMN = { fill: palette.neutral[900], radiusTopLeft: 8, radiusTopRight: 8, maxWidth: 28 };

const pct = (part: number, total: number) => (total ? (part / total) * 100 : 0);

/** Qatordagi yagona lime blok — StatCard ko'rinishida */
const HeroStat = ({ icon: Icon, title, value, hint, loading }: { icon: AppIcon; title: string; value: ReactNode; hint?: ReactNode; loading?: boolean }) => (
  <div className="flex h-full flex-col gap-3 rounded-card bg-lime p-5 text-on-lime">
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs">{title}</span>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-on-ink">
        <Icon size={20} strokeWidth={1.5} />
      </span>
    </div>
    {loading ? <Skeleton.Input active size="small" /> : <div className="text-3xl font-normal tabular-nums tracking-[-0.02em]">{value}</div>}
    <div className="mt-auto min-h-4 text-xs">{hint}</div>
  </div>
);

/** Karta ichidagi kichik ko'rsatkichlar qatori: label tepada, qiymat pastda */
const MiniStats = ({ items }: { items: { label: string; value: ReactNode; hint?: ReactNode }[] }) => (
  <div className="grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4">
    {items.map((i) => (
      <div key={i.label} className="min-w-0">
        <div className="text-xs text-muted">{i.label}</div>
        <div className="mt-1 text-xl font-normal tabular-nums">{i.value}</div>
        {i.hint && <div className="mt-0.5 text-xs text-muted">{i.hint}</div>}
      </div>
    ))}
  </div>
);

const Loading = () => (
  <div className="rounded-card bg-surface p-5">
    <Skeleton active paragraph={{ rows: 8 }} />
  </div>
);

/** Jadval chap, chart o'ng (xl); mobil'da ustma-ust */
const Split = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">{children}</div>
);

const Unit = ({ children }: { children: ReactNode }) => <span className="text-xs text-muted">{children}</span>;

/** Gorizontal ink chiziqlar: nom va qiymat tepada, chiziq pastda — uzun nomlar kesilmaydi, mobil'da ham o'qiladi */
const BarList = ({ items }: { items: { key: string; label: ReactNode; value: number; display: ReactNode }[] }) => {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="m-0 flex list-none flex-col gap-4 p-0">
      {items.map((i) => (
        <li key={i.key} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 flex-1 truncate">{i.label}</span>
            <span className="shrink-0 tabular-nums">{i.display}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-pill bg-subtle">
            <div className="h-full rounded-pill bg-ink" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
};

/* ---------- KPI qatori ---------- */

/** Sahifa tepasidagi asosiy ko'rsatkichlar; tushum faqat 'report.revenue' bo'lsa */
export const ReportKpis = ({ q, revenue }: { q: ReportQuery; revenue: boolean }) => {
  const rev = useReport('revenue', q, reportsApi.revenue, revenue);
  const ap = useReport('appointments', q, reportsApi.appointments);
  const sv = useReport('services', q, reportsApi.services);
  const done = sv.data?.reduce((s, r) => s + r.count, 0) ?? 0;
  const svAmount = sv.data?.reduce((s, r) => s + (r.amount ?? 0), 0) ?? 0;

  const visits = {
    title: 'Qabullar',
    value: formatNumber(ap.data?.total ?? 0),
    hint: `Yakunlangan: ${formatNumber(ap.data?.completed ?? 0)} ta`,
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {revenue ? (
        <HeroStat
          icon={CircleDollarSign}
          title="Tushum"
          loading={rev.isLoading}
          value={
            <>
              <span className="whitespace-nowrap">{formatMoney(rev.data?.total ?? 0, false)}</span> <span className="text-[0.55em]">so‘m</span>
            </>
          }
          hint={`Qaytarilgan: ${formatMoney(rev.data?.refunds ?? 0)}`}
        />
      ) : (
        <HeroStat icon={CalendarCheck2} loading={ap.isLoading} {...visits} />
      )}
      {revenue && <StatCard icon={CalendarCheck2} loading={ap.isLoading} {...visits} />}
      <StatCard
        icon={CalendarX2}
        title="Kelmaganlar"
        loading={ap.isLoading}
        value={formatPercent(ap.data?.noShowPct ?? 0)}
        hint={`${formatNumber(ap.data?.noShow ?? 0)} ta qabul · bekor: ${formatNumber(ap.data?.cancelled ?? 0)}`}
      />
      <StatCard
        icon={ClipboardList}
        title="Bajarilgan xizmatlar"
        loading={sv.isLoading}
        value={formatNumber(done)}
        hint={revenue && done ? `O‘rtacha: ${formatMoney(Math.round(svAmount / done))}` : 'yakunlangan qabullar bo‘yicha'}
      />
      {!revenue && (
        <StatCard
          icon={CalendarCheck2}
          title="Yakunlanganlar ulushi"
          loading={ap.isLoading}
          value={formatPercent(pct(ap.data?.completed ?? 0, ap.data?.total ?? 0))}
          hint="o‘tgan qabullar ichida"
        />
      )}
    </div>
  );
};

/* ---------- Shifokorlar (oy oxiri hisob-kitobi) ---------- */

export const DoctorsReportView = ({ q }: { q: ReportQuery }) => {
  const { data, isLoading, isError, error, refetch } = useReport('doctors', q, reportsApi.doctors);
  const { data: doctors = [] } = useDoctors();
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading || !data) return <Loading />;
  if (!data.length) return <EmptyState title="Shifokorlar topilmadi" description="Boshqa shifokor yoki davrni tanlang" />;
  const withAmount = data.some((r) => r.amount !== null);
  const sum = (k: 'total' | 'completed' | 'noShow' | 'cancelled' | 'amount') => data.reduce((s, r) => s + (r[k] ?? 0), 0);
  const totalAmount = sum('amount');
  const color = (id: string) => doctors.find((d) => d.id === id)?.color;
  const chart = [...data].sort((a, b) => (withAmount ? (b.amount ?? 0) - (a.amount ?? 0) : b.completed - a.completed));

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Shifokorlar bo‘yicha" bodyClassName="p-3 md:p-4">
        <Table
          rowKey="doctorId"
          size="middle"
          pagination={false}
          dataSource={data}
          scroll={{ x: 'max-content' }}
          columns={[
            {
              title: 'Shifokor',
              dataIndex: 'name',
              render: (v: string, r) => (
                <span className="flex items-center gap-2">
                  {color(r.doctorId) && <ColorDot color={color(r.doctorId)!} />}
                  <span className="font-medium">{v}</span>
                </span>
              ),
            },
            { title: 'Qabullar', dataIndex: 'total', align: 'right', render: (v: number) => <span className="tabular-nums">{v}</span> },
            { title: 'Yakunlangan', dataIndex: 'completed', align: 'right', render: (v: number) => <span className="tabular-nums">{v}</span> },
            {
              title: 'Kelmadi',
              dataIndex: 'noShow',
              align: 'right',
              render: (v: number, r) => (
                <span className="tabular-nums">
                  {v} <Unit>· {formatPercent(pct(v, r.total))}</Unit>
                </span>
              ),
            },
            { title: 'Bekor', dataIndex: 'cancelled', align: 'right', render: (v: number) => <span className="tabular-nums">{v}</span> },
            ...(withAmount
              ? [
                  {
                    title: 'Bajarilgan xizmatlar',
                    dataIndex: 'amount',
                    align: 'right' as const,
                    render: (v: number) => <Money value={v} className="font-medium" />,
                  },
                  {
                    title: 'O‘rtacha chek',
                    key: 'avg',
                    align: 'right' as const,
                    render: (_: unknown, r: (typeof data)[number]) => (r.completed ? <Money value={Math.round((r.amount ?? 0) / r.completed)} /> : <span className="text-muted">—</span>),
                  },
                  {
                    title: 'Ulushi',
                    key: 'share',
                    align: 'right' as const,
                    render: (_: unknown, r: (typeof data)[number]) => <span className="tabular-nums">{formatPercent(pct(r.amount ?? 0, totalAmount))}</span>,
                  },
                ]
              : []),
          ]}
          summary={() =>
            data.length > 1 && (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} className="font-medium">Jami</Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right" className="tabular-nums">{sum('total')}</Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right" className="tabular-nums">{sum('completed')}</Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right" className="tabular-nums">
                  {sum('noShow')} <Unit>· {formatPercent(pct(sum('noShow'), sum('total')))}</Unit>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right" className="tabular-nums">{sum('cancelled')}</Table.Summary.Cell>
                {withAmount && (
                  <>
                    <Table.Summary.Cell index={5} align="right"><Money value={totalAmount} className="font-medium" /></Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="right">
                      {sum('completed') ? <Money value={Math.round(totalAmount / sum('completed'))} /> : '—'}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7} align="right">100%</Table.Summary.Cell>
                  </>
                )}
              </Table.Summary.Row>
            )
          }
        />
        {withAmount && (
          <p className="m-0 mt-3 px-1 text-xs text-muted">
            Summa — yakunlangan qabullar bo‘yicha hisob-fakturalar (bekor qilinganlarsiz). Shifokor ulushi shu summadan hisoblanadi.
          </p>
        )}
      </Panel>
      <Panel title={withAmount ? 'Xizmatlar summasi' : 'Yakunlangan qabullar'}>
        <BarList
          items={chart.map((r) => {
            const v = withAmount ? (r.amount ?? 0) : r.completed;
            return {
              key: r.doctorId,
              label: (
                <span className="flex min-w-0 items-center gap-2">
                  {color(r.doctorId) && <ColorDot color={color(r.doctorId)!} />}
                  <span className="truncate">{r.name}</span>
                </span>
              ),
              value: v,
              display: withAmount ? <Money value={v} /> : `${v} ta`,
            };
          })}
        />
      </Panel>
    </div>
  );
};

/* ---------- Xizmatlar (qaysi xizmat pul keltiradi) ---------- */

export const ServicesReportView = ({ q }: { q: ReportQuery }) => {
  const { data, isLoading, isError, error, refetch } = useReport('services', q, reportsApi.services);
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading || !data) return <Loading />;
  if (!data.length) return <EmptyState title="Bu davrda bajarilgan xizmat yo‘q" description="Boshqa davrni tanlang" />;
  const withAmount = data[0]?.amount !== null;
  const rows = withAmount ? [...data].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0)) : data;
  const totalAmount = data.reduce((s, r) => s + (r.amount ?? 0), 0);
  const totalCount = data.reduce((s, r) => s + r.count, 0);
  const top = rows.slice(0, 8);

  return (
    <Split>
      <Panel title={withAmount ? 'Xizmatlar daromadi' : 'Bajarilgan xizmatlar'} bodyClassName="p-3 md:p-4">
        <Table
          rowKey="serviceId"
          size="middle"
          pagination={rows.length > 15 ? { pageSize: 15, showSizeChanger: false, showTotal: (t) => `${t} ta` } : false}
          dataSource={rows}
          scroll={{ x: 'max-content' }}
          columns={[
            { title: 'Kod', dataIndex: 'code', width: 72, render: (v: string) => <span className="font-medium tabular-nums text-muted">{v}</span> },
            {
              title: 'Xizmat',
              dataIndex: 'name',
              render: (v: string) => (
                <span className="block max-w-64 truncate" title={v}>
                  {v}
                </span>
              ),
            },
            { title: 'Soni', dataIndex: 'count', align: 'right', render: (v: number) => <span className="tabular-nums">{v}</span> },
            ...(withAmount
              ? [
                  { title: 'Summa', dataIndex: 'amount', align: 'right' as const, render: (v: number) => <Money value={v} className="font-medium" /> },
                  {
                    title: 'Ulushi',
                    key: 'share',
                    align: 'right' as const,
                    responsive: ['md' as const],
                    render: (_: unknown, r: (typeof rows)[number]) => <span className="tabular-nums">{formatPercent(pct(r.amount ?? 0, totalAmount))}</span>,
                  },
                ]
              : [
                  {
                    title: 'Ulushi',
                    key: 'share',
                    align: 'right' as const,
                    render: (_: unknown, r: (typeof rows)[number]) => <span className="tabular-nums">{formatPercent(pct(r.count, totalCount))}</span>,
                  },
                ]),
          ]}
        />
      </Panel>
      <Panel title={withAmount ? 'Eng ko‘p daromad' : 'Eng ko‘p bajarilgan'}>
        <BarList
          items={top.map((r) => {
            const v = withAmount ? (r.amount ?? 0) : r.count;
            return {
              key: r.serviceId,
              label: (
                <span className="truncate" title={r.name}>
                  <span className="text-muted tabular-nums">{r.code}</span> {r.name}
                </span>
              ),
              value: v,
              display: withAmount ? <Money value={v} /> : `${v} ta`,
            };
          })}
        />
      </Panel>
    </Split>
  );
};

/* ---------- Qabullar (no-show) ---------- */

export const AppointmentsReportView = ({ q }: { q: ReportQuery }) => {
  const { data, isLoading, isError, error, refetch } = useReport('appointments', q, reportsApi.appointments);
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading || !data) return <Loading />;
  const other = Math.max(0, data.total - data.completed - data.noShow - data.cancelled);
  const parts = [
    { label: 'Yakunlangan', value: data.completed },
    { label: 'Kelmadi', value: data.noShow },
    { label: 'Bekor qilingan', value: data.cancelled },
    { label: 'Boshqa holatlar', value: other },
  ];

  return (
    <Split>
      <Panel title="Qabullar holati">
        <div className="flex flex-col gap-6">
          <MiniStats
            items={[
              { label: 'Jami qabullar', value: formatNumber(data.total), hint: 'o‘tgan vaqt bo‘yicha' },
              { label: 'Kelmaganlar ulushi', value: formatPercent(data.noShowPct), hint: `${data.noShow} ta qabul` },
            ]}
          />
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {parts.map((p) => (
              <li key={p.label}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{p.label}</span>
                  <span className="tabular-nums">
                    {p.value} <Unit>· {formatPercent(pct(p.value, data.total))}</Unit>
                  </span>
                </div>
                <Progress percent={pct(p.value, data.total)} showInfo={false} strokeColor={palette.neutral[900]} trailColor={palette.neutral[100]} size="small" />
              </li>
            ))}
          </ul>
        </div>
      </Panel>
      <Panel title="Manbalar bo‘yicha">
        {data.bySource.length ? (
          <SimpleColumn
            data={data.bySource}
            xField="source"
            yField="count"
            style={INK_COLUMN}
            axis={{ y: { labelFormatter: (v: number) => String(v) } }}
            tooltip={{ items: [{ channel: 'y', name: 'Qabullar', valueFormatter: (v: number) => `${v} ta` }] }}
          />
        ) : (
          <EmptyState compact title="Bu davrda qabul yo‘q" />
        )}
      </Panel>
    </Split>
  );
};

/* ---------- Tushum ---------- */

export const RevenueReportView = ({ q }: { q: ReportQuery }) => {
  const { data, isLoading, isError, error, refetch } = useReport('revenue', q, reportsApi.revenue);
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading || !data) return <Loading />;
  const days = data.byDay.length || 1;
  const count = data.byMethod.reduce((s, m) => s + m.count, 0);
  return (
    <div className="flex flex-col gap-4">
      <Panel title="Kunlar bo‘yicha tushum">
        <div className="flex flex-col gap-6">
          <MiniStats
            items={[
              { label: 'Jami tushum', value: <Money value={data.total} /> },
              { label: 'Kunlik o‘rtacha', value: <Money value={Math.round(data.total / days)} />, hint: `${days} kun` },
              { label: 'To‘lovlar soni', value: formatNumber(count) },
              { label: 'Qaytarilgan', value: <Money value={data.refunds} /> },
            ]}
          />
          <SimpleColumn
            data={data.byDay.map((d) => ({ day: dayjs(d.date).format('DD.MM'), amount: d.amount }))}
            xField="day"
            yField="amount"
            style={INK_COLUMN}
            tooltip={{ items: [{ channel: 'y', name: 'Tushum', valueFormatter: (v: number) => formatMoney(v) }] }}
          />
        </div>
      </Panel>
      <Panel title="To‘lov turlari bo‘yicha" bodyClassName="p-3 md:p-4">
        <Table
          rowKey="method"
          size="middle"
          pagination={false}
          dataSource={data.byMethod}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <EmptyState compact title="Bu davrda to‘lov yo‘q" /> }}
          columns={[
            { title: 'To‘lov turi', dataIndex: 'method', render: (v: string) => <span className="font-medium">{v}</span> },
            { title: 'Soni', dataIndex: 'count', align: 'right', render: (v: number) => <span className="tabular-nums">{v}</span> },
            { title: 'Summa', dataIndex: 'amount', align: 'right', render: (v: number) => <Money value={v} className="font-medium" /> },
            { title: 'Ulushi', key: 'p', align: 'right', render: (_, r) => <span className="tabular-nums">{formatPercent(pct(r.amount, data.total))}</span> },
          ]}
          summary={() =>
            data.byMethod.length > 1 && (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} className="font-medium">Jami</Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right" className="tabular-nums">{count}</Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right"><Money value={data.total} className="font-medium" /></Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">100%</Table.Summary.Cell>
              </Table.Summary.Row>
            )
          }
        />
      </Panel>
    </div>
  );
};

/* ---------- Eslatmalar samaradorligi ---------- */

export const RemindersReportView = ({ q }: { q: ReportQuery }) => {
  const { data, isLoading, isError, error, refetch } = useReport('reminders', q, reportsApi.reminders);
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading || !data) return <Loading />;
  return (
    <Split>
      <Panel title="Natijalar taqsimoti" bodyClassName="p-3 md:p-4">
        <Table
          rowKey="result"
          size="middle"
          pagination={false}
          dataSource={data.byResult}
          locale={{ emptyText: <EmptyState compact title="Bu davrda qo‘ng‘iroq yo‘q" /> }}
          columns={[
            { title: 'Natija', dataIndex: 'result', render: (r: string) => CALL_RESULT[r as CallResult]?.label ?? r },
            { title: 'Soni', dataIndex: 'count', align: 'right', render: (v: number) => <span className="tabular-nums">{v}</span> },
            { title: 'Ulushi', key: 'p', align: 'right', render: (_, r) => <span className="tabular-nums">{formatPercent(pct(r.count, data.calls))}</span> },
          ]}
        />
      </Panel>
      <Panel title="Eslatma ta’siri">
        <div className="flex flex-col gap-6">
          <MiniStats
            items={[
              { label: 'Qo‘ng‘iroqlar', value: formatNumber(data.calls) },
              { label: 'Tasdiqlash foizi', value: formatPercent(data.confirmRate), hint: `${data.confirmed} ta tasdiqlandi` },
            ]}
          />
          <div className="flex flex-col gap-4">
            <div className="text-xs text-muted">Kelmay qolish foizi</div>
            {[
              { label: 'Eslatma bilan', rate: data.noShowRateWith, n: data.withCount },
              { label: 'Eslatmasiz', rate: data.noShowRateWithout, n: data.withoutCount },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{r.label}</span>
                  <span className="tabular-nums">
                    {formatPercent(r.rate)} <Unit>· {r.n} ta qabul</Unit>
                  </span>
                </div>
                <Progress percent={r.rate} showInfo={false} strokeColor={palette.neutral[900]} trailColor={palette.neutral[100]} size="small" />
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </Split>
  );
};

/* ---------- Ombor ---------- */

export const InventoryReportView = ({ q }: { q: ReportQuery }) => {
  const { data, isLoading, isError, error, refetch } = useReport('inventory', q, reportsApi.inventory);
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isLoading || !data) return <Loading />;
  return (
    <Panel title="Eng ko‘p ishlatilgan materiallar" bodyClassName="flex flex-col gap-5 p-3 md:p-4">
      <div className="px-2 pt-2">
        <MiniStats
          items={[
            { label: 'Kirim summasi', value: <Money value={data.inSum} />, hint: 'tannarx bo‘yicha' },
            { label: 'Chiqim summasi', value: <Money value={data.outSum} />, hint: 'tannarx bo‘yicha' },
          ]}
        />
      </div>
      <Table
        rowKey="productId"
        size="middle"
        pagination={false}
        dataSource={data.topUsed}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: <EmptyState compact title="Bu davrda material ishlatilmagan" /> }}
        columns={[
          {
            title: 'Mahsulot',
            dataIndex: 'name',
            render: (v: string) => (
              <span className="block max-w-64 truncate font-medium" title={v}>
                {v}
              </span>
            ),
          },
          {
            title: 'Miqdor',
            key: 'q',
            align: 'right',
            render: (_, r) => (
              <span className="tabular-nums">
                {formatNumber(r.qty, 2)} <Unit>{r.unit}</Unit>
              </span>
            ),
          },
          { title: 'Tannarx bo‘yicha', dataIndex: 'cost', align: 'right', render: (v: number) => <Money value={v} className="font-medium" /> },
        ]}
      />
    </Panel>
  );
};
