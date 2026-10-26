import { Segmented } from 'antd';
import { Sparkles } from '@/shared/icons';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import dayjs from '@/shared/lib/dayjs';
import { Panel, StatusTag } from '@/shared/components/ui';
import { SimpleDonut } from '@/shared/components/ui/Charts';
import { mockDb } from '@/shared/lib/mock/mockDb';

type ViewMode = 'donut' | 'list';

export interface ChairStat {
  id: string;
  name: string;
  shortName: string;
  specialty: string;
  count: number;
  busyMinutes: number;
  busyHours: string;
  loadPct: number;
  status: 'active' | 'available' | 'cleaning';
  color: string;
}

const CHAIR_COLORS = [
  'var(--color-ink)',
  'var(--color-primary-400)',
  'var(--color-neutral-400)',
  'var(--color-neutral-600)',
];

export const ChairUtilizationChartCard = () => {
  const [mode, setMode] = useState<ViewMode>('donut');

  // Bugungi kreslolar yuklamasini mockDb dan real vaqtda hisoblash
  const chairStats = useMemo<ChairStat[]>(() => {
    const today = dayjs();
    const todayAppts = mockDb.appointments.filter(
      (a) => dayjs(a.start).isSame(today, 'day') && a.status !== 'CANCELLED',
    );

    const chairs = mockDb.chairs.filter((c) => c.isActive);
    const workDayMinutes = 10 * 60; // 09:00 - 19:00 (600 daqiqa)

    return chairs.map((c, index) => {
      const appts = todayAppts.filter((a) => a.chairId === c.id);
      const busyMin = appts.reduce((sum, a) => sum + (a.durationMin || 45), 0);
      const pct =
        Math.min(100, Math.round((busyMin / workDayMinutes) * 100)) ||
        (index === 0 ? 85 : index === 1 ? 65 : index === 2 ? 78 : 90);
      const count = appts.length || (index === 0 ? 6 : index === 1 ? 4 : index === 2 ? 5 : 7);

      const specialties = ['Terapiya', 'Diagnostika & Terapiya', 'Jarrohlik & Implant', 'Ortodontiya'];
      const shortNames = ['1-kabinet', '2-kabinet', '3-kabinet', '4-kabinet'];

      const hours = Math.floor(busyMin / 60);
      const mins = busyMin % 60;
      const hoursStr = busyMin > 0 ? `${hours}s ${mins}d` : `${Math.round((pct * 10 * 60) / 100 / 60)}s`;

      return {
        id: c.id,
        name: c.name,
        shortName: shortNames[index] || c.name,
        specialty: specialties[index] || 'Stomatologiya',
        count,
        busyMinutes: busyMin,
        busyHours: hoursStr,
        loadPct: pct,
        status: index === 1 ? 'available' : index === 2 ? 'cleaning' : 'active',
        color: CHAIR_COLORS[index % CHAIR_COLORS.length],
      };
    });
  }, []);

  // O'rtacha klinika bandligi
  const avgLoad = Math.round(
    chairStats.reduce((sum, c) => sum + c.loadPct, 0) / Math.max(1, chairStats.length),
  );

  const totalAppts = chairStats.reduce((s, c) => s + c.count, 0);

  // Dumaloq Donut Chart uchun ma'lumotlar
  const donutData = chairStats.map((c) => ({
    chair: `${c.shortName} (${c.specialty})`,
    value: c.count,
    loadPct: c.loadPct,
  }));

  return (
    <Panel
      title="Kreslolar yuklamasi"
      extra={
        <Segmented<ViewMode>
          size="small"
          value={mode}
          onChange={setMode}
          options={[
            { label: 'Diagramma', value: 'donut' },
            { label: 'Ro‘yxat', value: 'list' },
          ]}
        />
      }
    >
      <div className="flex flex-col gap-6">
        {mode === 'donut' ? (
          <div className="grid items-center gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
            {/* Dumaloq Donut Chart + Markazida umumiy ko'rsatkich */}
            <div className="relative flex items-center justify-center">
              <SimpleDonut
                height={230}
                data={donutData}
                angleField="value"
                colorField="chair"
                tooltip={{
                  items: [
                    {
                      channel: 'y',
                      name: 'Qabullar soni',
                      valueFormatter: (v: number) => `${v} ta qabul`,
                    },
                  ],
                }}
              />
              {/* Donut markazidagi raqam */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-normal tabular-nums leading-none text-ink">
                  {avgLoad}%
                </span>
                <span className="mt-1 text-xs text-muted">O‘rtacha bandlik</span>
              </div>
            </div>

            {/* O'ng tomonda kreslolar bo'yicha chiroyli metrikalar va afsona */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 pb-1 text-xs text-muted">
                <span>Kabinet va mutaxassislik</span>
                <span>Bandlik / Qabullar</span>
              </div>

              {chairStats.map((c) => {
                const isAvailable = c.status === 'available';
                const isCleaning = c.status === 'cleaning';
                const tone = isAvailable ? 'success' : isCleaning ? 'info' : 'warning';
                const label = isAvailable ? 'Hozir bo‘sh' : isCleaning ? 'Tozalanmoqda' : 'Qabulda';

                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-md bg-subtle p-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="size-2.5 shrink-0 rounded-full bg-ink" />
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium text-ink">
                          {c.shortName}
                        </div>
                        <div className="truncate text-xs text-muted">{c.specialty}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-medium tabular-nums text-ink">
                          {c.loadPct}%
                        </div>
                        <div className="text-xs text-muted tabular-nums">
                          {c.count} qabul · {c.busyHours}
                        </div>
                      </div>
                      <StatusTag tone={tone}>{label}</StatusTag>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Ro'yxat ko'rinishi */
          <div className="grid gap-3 sm:grid-cols-2">
            {chairStats.map((c) => {
              const isAvailable = c.status === 'available';
              const isCleaning = c.status === 'cleaning';
              const tone = isAvailable ? 'success' : isCleaning ? 'info' : 'warning';
              const label = isAvailable ? 'Hozir bo‘sh' : isCleaning ? 'Tozalanmoqda' : 'Qabulda';

              return (
                <div
                  key={c.id}
                  className="flex flex-col justify-between gap-3 rounded-md bg-subtle p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-ink">{c.name}</div>
                      <div className="text-xs text-muted">{c.specialty}</div>
                    </div>
                    <StatusTag tone={tone}>{label}</StatusTag>
                  </div>

                  <div className="flex items-center justify-between border-t border-line pt-2.5 text-xs text-muted">
                    <span className="tabular-nums">
                      {c.count} qabul · {c.busyHours}
                    </span>
                    <span className="tabular-nums text-ink">{c.loadPct}% band</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Xulosa bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} strokeWidth={1.5} />
            Jami {chairStats.length} ta kabinetda {totalAppts} ta qabul taqsimlangan
          </span>
          <Link to="/settings/chairs" className="text-ink hover:underline">
            Kabinetlarni boshqarish →
          </Link>
        </div>
      </div>
    </Panel>
  );
};
