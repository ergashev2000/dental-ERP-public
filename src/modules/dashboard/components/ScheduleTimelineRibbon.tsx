import { Button } from 'antd';
import { CalendarDays } from '@/shared/icons';
import { useState } from 'react';
import { Link } from 'react-router';
import { useAppointmentParam } from '@/modules/appointments';
import { UserAvatar } from '@/shared/components/ui';

interface ScheduleItem {
  id: string;
  name: string;
  start: string;
  end: string;
  timeSlot: string; // masalan "9:30 – 10:30"
  hourIndex: number; // 9, 10, 11, 12, 14, 15
  service: string;
  room: string;
  variant: 'ink' | 'subtle' | 'white';
}

const SCHEDULE_ITEMS: ScheduleItem[] = [
  {
    id: 'apt-1',
    name: 'Alimov Jamshid',
    start: '09:30',
    end: '10:30',
    timeSlot: '09:30 – 10:30',
    hourIndex: 9,
    service: 'Kariyesni davolash',
    room: '1-Kreslo',
    variant: 'ink',
  },
  {
    id: 'apt-2',
    name: 'Karimova Zarina',
    start: '11:00',
    end: '12:00',
    timeSlot: '11:00 – 12:00',
    hourIndex: 11,
    service: 'Breket nazorati',
    room: '2-Kreslo',
    variant: 'subtle',
  },
  {
    id: 'apt-3',
    name: 'Saidov Bobur',
    start: '14:00',
    end: '15:00',
    timeSlot: '14:00 – 15:00',
    hourIndex: 14,
    service: 'Implantatsiya',
    room: '3-Kreslo',
    variant: 'white',
  },
  {
    id: 'apt-4',
    name: 'Toshmatova Nargiza',
    start: '16:00',
    end: '17:00',
    timeSlot: '16:00 – 17:00',
    hourIndex: 16,
    service: 'Profilaktik tozalash',
    room: '1-Kreslo',
    variant: 'subtle',
  },
];

const HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export const ScheduleTimelineRibbon = () => {
  const [, open] = useAppointmentParam();
  const [selectedHour, setSelectedHour] = useState<string>('09:00');

  return (
    <section className="flex flex-col gap-4 rounded-card bg-surface p-5">
      {/* Sarlavha va Kalendarga o'tish */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="m-0 text-xl font-normal text-ink">Bugungi jadval chizig‘i</h3>
          <p className="m-0 mt-0.5 text-xs text-muted">
            Vaqt o‘qi bo‘yicha qabullar ketma-ketligi va xonalar bandligi
          </p>
        </div>

        <Link to="/appointments">
          <Button
            size="small"
            className="rounded-pill"
            icon={<CalendarDays size={14} strokeWidth={1.5} />}
          >
            To‘liq kalendar
          </Button>
        </Link>
      </div>

      {/* 1-rasmdagi vaqt shkalasi bo'yicha gorizontal chiziq */}
      <div className="relative pt-2 pb-1 overflow-x-auto">
        <div className="min-w-[680px]">
          {/* Soatlar sarlavhasi va vertikal o'qlar */}
          <div className="grid grid-cols-9 gap-2 text-center text-xs text-muted pb-3 border-b border-line-soft">
            {HOURS.map((h) => {
              const isCur = h === selectedHour;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => setSelectedHour(h)}
                  className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                    isCur ? 'text-ink font-medium' : 'hover:text-ink'
                  }`}
                >
                  <span className="tabular-nums">{h}</span>
                  <span
                    className={`size-1.5 rounded-full ${
                      isCur ? 'bg-ink' : 'bg-transparent'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Qabullar pill bloklari (1-rasm uslubida) */}
          <div className="mt-4 flex flex-wrap gap-3">
            {SCHEDULE_ITEMS.map((item) => {
              const isInk = item.variant === 'ink';
              const isSubtle = item.variant === 'subtle';

              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => void open(item.id)}
                  onKeyDown={(e) => e.key === 'Enter' && void open(item.id)}
                  className={`group flex cursor-pointer items-center gap-3 rounded-pill px-4 py-2.5 transition-all duration-150 hover:scale-[1.02] ${
                    isInk
                      ? 'bg-ink text-on-ink'
                      : isSubtle
                        ? 'bg-subtle text-ink hover:bg-neutral-200'
                        : 'bg-surface text-ink ring-1 ring-line hover:bg-subtle'
                  }`}
                >
                  <UserAvatar name={item.name} size={30} />
                  <div className="min-w-0 pr-1">
                    <div className="truncate text-xs font-medium leading-tight">
                      {item.name}
                    </div>
                    <div className={`truncate text-xs ${isInk ? 'text-on-ink/75' : 'text-muted'}`}>
                      {item.service} · {item.room}
                    </div>
                  </div>
                  <span
                    className={`ml-1 shrink-0 rounded-pill px-2.5 py-0.5 text-xs tabular-nums font-medium ${
                      isInk ? 'bg-surface/15 text-on-ink' : 'bg-surface text-ink'
                    }`}
                  >
                    {item.timeSlot}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
