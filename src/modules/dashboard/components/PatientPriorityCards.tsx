import { ArrowRight, CalendarClock } from '@/shared/icons';
import { useAppointmentParam } from '@/modules/appointments';
import { UserAvatar } from '@/shared/components/ui';

interface PriorityPatient {
  id: string;
  name: string;
  age: number;
  treatment: string;
  category: string;
  time: string;
  status: 'active' | 'waiting' | 'upcoming';
  statusLabel: string;
  isHero?: boolean;
}

const PATIENTS: PriorityPatient[] = [
  {
    id: 'apt-1',
    name: 'Alimov Jamshid',
    age: 36,
    treatment: 'Kariyesni davolash · Plomba',
    category: 'Terapiya',
    time: '09:30 – 10:30',
    status: 'active',
    statusLabel: 'Hozir qabulda',
    isHero: true,
  },
  {
    id: 'apt-2',
    name: 'Karimova Zarina',
    age: 28,
    treatment: 'Breket tizimi aktivatsiyasi',
    category: 'Ortodontiya',
    time: '11:00 – 11:45',
    status: 'waiting',
    statusLabel: 'Kutish zalida',
  },
  {
    id: 'apt-3',
    name: 'Saidov Bobur',
    age: 42,
    treatment: 'Implantatsiya nazorati',
    category: 'Jarrohlik',
    time: '14:00 – 15:00',
    status: 'upcoming',
    statusLabel: 'Tasdiqlangan',
  },
];

/** 1-rasmdagi tibbiy puls / tish salomatligi kardiogramma mini to'lqini */
const SparklineWave = ({ color = 'currentColor' }: { color?: string }) => (
  <svg
    viewBox="0 0 100 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-24 shrink-0"
    aria-hidden
  >
    <path
      d="M1 12H18L23 5L28 19L33 9L38 15L43 12H60L65 3L70 21L75 8L80 16L85 12H99"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PatientPriorityCards = () => {
  const [, open] = useAppointmentParam();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {PATIENTS.map((p) => {
        const isHero = p.isHero;
        return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => void open(p.id)}
            onKeyDown={(e) => e.key === 'Enter' && void open(p.id)}
            className={`group relative flex flex-col justify-between gap-4 rounded-card p-5 cursor-pointer transition-all duration-150 ${
              isHero
                ? 'bg-lime text-on-lime hover:bg-lime-press'
                : 'bg-surface text-ink hover:bg-neutral-50'
            }`}
          >
            {/* Tepasi: Avatar, Ism, Yosh va doira CTA strelka */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar name={p.name} size={44} />
                <div className="min-w-0">
                  <h4 className="m-0 truncate text-base font-medium leading-tight">
                    {p.name}
                  </h4>
                  <span className={`text-xs ${isHero ? 'text-ink/75' : 'text-muted'}`}>
                    {p.age} yosh · {p.category}
                  </span>
                </div>
              </div>

              {/* O'ng tepa: 1-rasmdagi doira ichidagi strelka (Circle CTA) */}
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-full transition-transform duration-150 group-hover:scale-105 ${
                  isHero ? 'bg-surface text-ink' : 'bg-subtle text-ink'
                }`}
              >
                <ArrowRight size={16} strokeWidth={1.75} className="-rotate-45" />
              </span>
            </div>

            {/* O'rta qism: Muolaja nishoni va mini kardiogramma to'lqini */}
            <div className="flex items-center justify-between gap-2 border-y py-2.5 border-current/10">
              <div className="min-w-0 flex-1">
                <div className={`text-xs ${isHero ? 'text-on-lime' : 'text-muted'}`}>
                  Muolaja
                </div>
                <div className="truncate text-xs font-medium">{p.treatment}</div>
              </div>

              {/* 1-rasmdagi kardiogramma sparkline */}
              <div className="flex items-center gap-1.5 pl-2">
                <span className={`size-1.5 rounded-full ${isHero ? 'bg-ink' : 'bg-danger'}`} />
                <SparklineWave color={isHero ? 'var(--color-ink)' : 'var(--color-muted)'} />
              </div>
            </div>

            {/* Pastki qism: Holat tegi va Vaqt pillasi */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <span
                className={`inline-flex h-6 items-center gap-1.5 rounded-pill px-2.5 text-xs ${
                  isHero
                    ? 'bg-ink text-on-ink'
                    : p.status === 'active'
                      ? 'bg-success-soft text-success'
                      : 'bg-subtle text-ink'
                }`}
              >
                <span className="size-1.5 rounded-full bg-current" />
                {p.statusLabel}
              </span>

              <span
                className={`inline-flex items-center gap-1 text-xs tabular-nums ${
                  isHero ? 'text-ink/80' : 'text-muted'
                }`}
              >
                <CalendarClock size={13} strokeWidth={1.5} />
                {p.time}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
