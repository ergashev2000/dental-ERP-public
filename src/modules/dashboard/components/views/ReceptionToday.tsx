import { CalendarCheck2, CircleCheck, DoorOpen, PhoneMissed } from '@/shared/icons';
import { StatCard } from '@/shared/components/ui';
import type { DashboardSummary } from '../../types';
import { useTodayCounts } from '../../hooks/useTodayCounts';
import { InClinicCard, UnconfirmedCard } from '../TodayQueueCards';
import { TodayTimeline } from '../TodayTimeline';
import { KpiValue } from '../KpiValue';

/** Registratura / administrator: "Bugun" — navbat, tasdiqlanmaganlar, klinikadagilar */
export const ReceptionToday = ({ summary }: { summary?: DashboardSummary }) => {
  const c = useTodayCounts();
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={CalendarCheck2}
          title="Bugungi qabullar"
          loading={c.isLoading}
          value={<KpiValue value={c.total} unit="ta" />}
          change={summary?.today.change}
        />
        <StatCard
          icon={DoorOpen}
          title="Klinikada"
          loading={c.isLoading}
          value={<KpiValue value={c.arrived + c.inChair} unit="bemor" />}
          hint={<span>{c.inChair} ta kresloda, {c.arrived} ta kutmoqda</span>}
        />
        <StatCard
          icon={PhoneMissed}
          title="Tasdiqlanmagan"
          loading={c.isLoading}
          value={<KpiValue value={c.unconfirmed} unit="ta" />}
          hint={<span>{c.unconfirmed ? 'Qo‘ng‘iroq qilib tasdiqlang' : 'Hammasi tasdiqlangan'}</span>}
        />
        <StatCard
          icon={CircleCheck}
          title="Yakunlandi"
          loading={c.isLoading}
          value={<KpiValue value={c.done} unit={`/ ${c.total}`} />}
          hint={<span>Yana {c.remaining} ta qabul kutilmoqda</span>}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <TodayTimeline title="Bugungi navbat" />
        <div className="flex flex-col gap-4">
          <InClinicCard />
          <UnconfirmedCard />
        </div>
      </div>
    </div>
  );
};
