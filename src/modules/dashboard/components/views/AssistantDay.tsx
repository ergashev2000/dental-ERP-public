import { Building2, CalendarCheck2, DoorOpen, Stethoscope } from '@/shared/icons';
import { StatCard } from '@/shared/components/ui';
import { useDashboardDay } from '../../hooks/useDashboard';
import { useTodayCounts } from '../../hooks/useTodayCounts';
import { LiveChairsCard } from '../AiAssistant/LiveChairsCard';
import { KpiValue } from '../KpiValue';
import { NextPatientCard } from '../NextPatientCard';
import { TodayTimeline } from '../TodayTimeline';

/** Assistent: bugungi kreslolar — kim kresloda, keyingi bemor va uning tibbiy ogohlantirishi (faqat ko'rish) */
export const AssistantDay = () => {
  const c = useTodayCounts();
  const { data: day, isLoading: dayLoading } = useDashboardDay();
  const chairs = day?.chairs ?? [];
  const free = chairs.filter((ch) => !ch.current).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarCheck2} title="Bugungi qabullar" loading={c.isLoading} value={<KpiValue value={c.total} unit="ta" />} />
        <StatCard icon={Stethoscope} title="Kresloda" loading={c.isLoading} value={<KpiValue value={c.inChair} unit="bemor" />} />
        <StatCard icon={DoorOpen} title="Kutish zalida" loading={c.isLoading} value={<KpiValue value={c.arrived} unit="bemor" />} />
        <StatCard
          icon={Building2}
          title="Bo‘sh kreslolar"
          loading={dayLoading}
          value={<KpiValue value={free} unit={`/ ${chairs.length}`} />}
          hint={<span>Keyingi bemor uchun tayyorlang</span>}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <LiveChairsCard />
        <div className="order-first flex flex-col gap-4 xl:order-none">
          <NextPatientCard readOnly />
        </div>
      </div>

      <TodayTimeline title="Bugungi qabullar" />
    </div>
  );
};
