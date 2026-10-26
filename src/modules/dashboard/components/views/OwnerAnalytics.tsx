import { CalendarCheck2, CircleDollarSign, PhoneMissed, UserPlus, UserX } from '@/shared/icons';
import { StatCard } from '@/shared/components/ui';
import type { DashboardSummary } from '../../types';
import { ChairUtilizationChartCard } from '../ChairUtilizationChartCard';
import { DoctorOverviewCard } from '../DoctorOverviewCard';
import { KpiValue, MoneyKpi } from '../KpiValue';
import { DoctorLoadCard } from '../SideCards';
import { WeeklyAnalyticsPanel } from '../WeeklyAnalyticsPanel';

interface Props {
  summary?: DashboardSummary;
  onOpenCopilot: (prompt?: string) => void;
}

/** Egasi / administrator (tushum ruxsati bilan): "Tahlil" — KPI, haftalik tahlil, kreslolar, shifokorlar */
export const OwnerAnalytics = ({ summary, onOpenCopilot }: Props) => {
  const loading = !summary;
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary?.revenue || loading ? (
          <StatCard
            icon={CircleDollarSign}
            title="Bugungi tushum"
            loading={loading}
            value={<MoneyKpi value={summary?.revenue?.value ?? 0} />}
            change={summary?.revenue?.change}
          />
        ) : (
          <StatCard
            icon={PhoneMissed}
            title="Tasdiqlanmagan"
            value={<KpiValue value={summary?.unconfirmedToday ?? 0} unit="ta" />}
            hint={<span>bugungi qabullar</span>}
          />
        )}
        <StatCard
          icon={CalendarCheck2}
          title="Bugungi qabullar"
          loading={loading}
          value={<KpiValue value={summary?.today.total ?? 0} unit="ta" />}
          change={summary?.today.change}
        />
        <StatCard
          icon={UserX}
          title="Kelmay qolish"
          loading={loading}
          value={<KpiValue value={`${summary?.noShow.value ?? 0}%`} />}
          change={summary?.noShow.change}
          changeLabel="p.p., oldingi 30 kunga nisbatan"
          invert
          hint={summary?.noShow.change === null ? <span>Oxirgi 30 kun</span> : undefined}
        />
        <StatCard
          icon={UserPlus}
          title="Yangi bemorlar"
          loading={loading}
          value={<KpiValue value={summary?.newPatients.value ?? 0} unit="ta" />}
          change={summary?.newPatients.change}
          changeLabel="o‘tgan oyning shu davriga nisbatan"
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-4">
          {summary?.weeklyRevenue && <WeeklyAnalyticsPanel weeklyRevenue={summary.weeklyRevenue} />}
          <ChairUtilizationChartCard />
        </div>
        <div className="flex flex-col gap-4">
          <DoctorOverviewCard summary={summary} onOpenCopilot={onOpenCopilot} />
          <DoctorLoadCard data={summary?.doctorLoad} />
        </div>
      </div>
    </div>
  );
};
