import { Segmented } from 'antd';
import { useState } from 'react';
import dayjs from '@/shared/lib/dayjs';
import { Panel } from '@/shared/components/ui';
import { SimpleArea, SimpleColumn } from '@/shared/components/ui/Charts';
import { formatMoney } from '@/shared/utils/format';
import type { DashboardSummary } from '../types';
import { MoneyKpi } from './KpiValue';

interface Props {
  weeklyRevenue?: DashboardSummary['weeklyRevenue'];
}

type TabMode = 'revenue' | 'visits' | 'services';

const SERVICE_STATS = [
  { name: 'Terapiya va plomba', share: 42, count: 28, amount: '12 400 000 so‘m' },
  { name: 'Ortodontiya (breketlar)', share: 26, count: 18, amount: '7 800 000 so‘m' },
  { name: 'Jarrohlik va implant', share: 18, count: 12, amount: '5 400 000 so‘m' },
  { name: 'Profilaktika va gigiyena', share: 14, count: 9, amount: '4 200 000 so‘m' },
];

export const WeeklyAnalyticsPanel = ({ weeklyRevenue }: Props) => {
  const [mode, setMode] = useState<TabMode>('revenue');

  const chartData = (weeklyRevenue || []).map((d) => ({
    day: dayjs(d.date).format('dd, DD.MM'),
    amount: d.amount,
    visits: Math.max(3, Math.round(d.amount / 350_000)),
  }));

  const totalWeekly = (weeklyRevenue || []).reduce((sum, d) => sum + d.amount, 0);
  const avgDaily = Math.round(totalWeekly / Math.max(1, weeklyRevenue?.length ?? 7));

  return (
    <Panel
      title="Haftalik tahlil"
      extra={
        <Segmented<TabMode>
          size="small"
          value={mode}
          onChange={setMode}
          options={[
            { label: 'Tushum', value: 'revenue' },
            { label: 'Qabullar', value: 'visits' },
            { label: 'Xizmatlar', value: 'services' },
          ]}
        />
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
        {/* Chart qismi */}
        <div className="min-h-[260px]">
          {mode === 'revenue' && (
            <SimpleColumn
              height={260}
              data={chartData}
              xField="day"
              yField="amount"
              tooltip={{
                items: [
                  {
                    channel: 'y',
                    name: 'Kunlik tushum',
                    valueFormatter: (v: number) => formatMoney(v),
                  },
                ],
              }}
            />
          )}

          {mode === 'visits' && (
            <SimpleArea
              height={260}
              data={chartData}
              xField="day"
              yField="visits"
              tooltip={{
                items: [
                  {
                    channel: 'y',
                    name: 'Qabullar soni',
                    valueFormatter: (v: number) => `${v} ta bemor`,
                  },
                ],
              }}
            />
          )}

          {mode === 'services' && (
            <div className="flex flex-col justify-center gap-3.5 py-2">
              {SERVICE_STATS.map((s) => (
                <div key={s.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-ink">{s.name}</span>
                    <span className="shrink-0 tabular-nums text-muted">
                      {s.share}% · {s.amount}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-subtle">
                    <div
                      className="h-full rounded-full bg-ink transition-all duration-300"
                      style={{ width: `${s.share}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Yon KPI xulosalari */}
        <div className="flex flex-col justify-between gap-4 rounded-md bg-subtle p-4">
          <div>
            <div className="text-xs text-muted">Haftalik jami tushum</div>
            <div className="text-2xl font-normal tabular-nums text-ink">
              <MoneyKpi value={totalWeekly} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-line pt-3">
            <div>
              <div className="text-xs text-muted">Kunlik o‘rtacha</div>
              <div className="text-sm tabular-nums text-ink">
                <MoneyKpi value={avgDaily} />
              </div>
            </div>
            <div>
              <div className="text-xs text-muted">Qayta tashrif</div>
              <div className="text-sm tabular-nums text-ink">
                84%
              </div>
            </div>
          </div>

          <div className="text-xs leading-relaxed text-muted">
            Eng yuqori qabul va tushum ko‘rsatkichi seshanba va payshanba kunlariga to‘g‘ri kelmoqda.
          </div>
        </div>
      </div>
    </Panel>
  );
};
