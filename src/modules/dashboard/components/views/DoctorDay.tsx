import { CalendarCheck2, CircleCheck, Hourglass, TriangleAlert } from '@/shared/icons';
import { StatCard } from '@/shared/components/ui';
import { useDashboardDay } from '../../hooks/useDashboard';
import { useTodayCounts } from '../../hooks/useTodayCounts';
import { KpiValue } from '../KpiValue';
import { NextPatientCard } from '../NextPatientCard';
import { TodayTimeline } from '../TodayTimeline';
import { UnfinishedVisitsCard } from '../UnfinishedVisitsCard';

/** Shifokor: "Mening kunim" — keyingi bemor (lime hero), kun ro'yxati, yakunlanmagan tashriflar */
export const DoctorDay = ({ staffId }: { staffId: string }) => {
  const c = useTodayCounts(staffId);
  const { data: day, isLoading: dayLoading } = useDashboardDay();
  const unfinished = day?.unfinished.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarCheck2} title="Bugungi bemorlarim" loading={c.isLoading} value={<KpiValue value={c.total} unit="ta" />} />
        <StatCard
          icon={CircleCheck}
          title="Qabul qilindi"
          loading={c.isLoading}
          value={<KpiValue value={c.done} unit={`/ ${c.total}`} />}
          hint={c.inChair ? <span>Hozir 1 bemor kresloda</span> : undefined}
        />
        <StatCard
          icon={Hourglass}
          title="Qoldi"
          loading={c.isLoading}
          value={<KpiValue value={c.remaining + c.arrived} unit="ta" />}
          hint={c.arrived ? <span>{c.arrived} ta bemor kutish zalida</span> : undefined}
        />
        <StatCard
          icon={TriangleAlert}
          title="Yakunlanmagan"
          loading={dayLoading}
          value={<KpiValue value={unfinished} unit="ta" />}
          hint={<span>{unfinished ? 'Tashrifni yakunlab, natijani yozing' : 'Hammasi yakunlangan'}</span>}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <TodayTimeline title="Mening kunim" doctorId={staffId} hideDoctor />
        {/* Mobil: keyingi bemor birinchi ko'rinadi */}
        <div className="order-first flex flex-col gap-4 xl:order-none">
          <NextPatientCard doctorId={staffId} />
          <UnfinishedVisitsCard />
        </div>
      </div>
    </div>
  );
};
