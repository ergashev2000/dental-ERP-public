import { Tooltip } from 'antd';
import { Phone, PhoneMissed, TriangleAlert } from '@/shared/icons';
import { useEffect, useState, type DragEvent, type ReactNode } from 'react';
import dayjs from '@/shared/lib/dayjs';
import { APPOINTMENT_STATUS } from '@/shared/constants/status';
import { staffColors, type StaffColor } from '@/shared/theme/tokens';
import { TONE_BLOCK_CLASS } from '@/shared/components/ui';
import { fromMin, minOfDay } from '@/shared/utils/schedule';
import { cn } from '@/shared/utils/cn';
import type { AppointmentView } from '../types';

export interface GridColumn {
  key: string;
  title: ReactNode;
  date: string;
  doctorId?: string;
  chairId?: string;
  /** Ish vaqtidan tashqari / tushlik oraliqlari (daqiqada) — tekis kulrang fon */
  off: [number, number][];
  items: AppointmentView[];
}

interface Props {
  columns: GridColumn[];
  startMin: number;
  endMin: number;
  step: number;
  canDrag: (a: AppointmentView) => boolean;
  onSlotClick: (col: GridColumn, min: number) => void;
  onOpen: (a: AppointmentView) => void;
  onDrop: (a: AppointmentView, col: GridColumn, min: number) => void;
  /** Bir ustunda bir nechta shifokor bo'lsa — blokda shifokor rangi nuqtasi */
  doctorColorOf?: (doctorId: string) => StaffColor | undefined;
}

/** Ustma-ust tushgan qabullarni yonma-yon "yo'lak"larga ajratish */
const layoutLanes = (items: AppointmentView[]) => {
  const out = new Map<string, { lane: number; lanes: number }>();
  const sorted = [...items].sort((x, y) => x.start.localeCompare(y.start));
  let cluster: { id: string; lane: number }[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;
  const flush = () => {
    for (const c of cluster) out.set(c.id, { lane: c.lane, lanes: laneEnds.length });
    cluster = [];
    laneEnds = [];
  };
  for (const a of sorted) {
    const s = minOfDay(a.start);
    const e = s + a.durationMin;
    if (s >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= s);
    if (lane < 0) lane = laneEnds.push(e) - 1;
    else laneEnds[lane] = e;
    cluster.push({ id: a.id, lane });
    clusterEnd = Math.max(clusterEnd, e);
  }
  flush();
  return out;
};

const ROW = 22; // px — bitta qadam (odatda 15 daqiqa)

const useNowMin = () => {
  const [now, setNow] = useState(() => dayjs());
  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
};

interface BlockProps {
  a: AppointmentView;
  top: number;
  height: number;
  draggable: boolean;
  onOpen: () => void;
  lane?: { lane: number; lanes: number };
  dot?: StaffColor;
}

const Block = ({ a, top, height, draggable, onOpen, lane, dot }: BlockProps) => {
  const tone = APPOINTMENT_STATUS[a.status].tone;
  const small = height < 40;
  const content = (
    <div
      role="button"
      tabIndex={0}
      draggable={draggable}
      onDragStart={(e: DragEvent) => {
        e.dataTransfer.setData('text/appointment', a.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!a.masked) onOpen();
      }}
      onKeyDown={(e) => e.key === 'Enter' && !a.masked && onOpen()}
      aria-label={`${fromMin(minOfDay(a.start))} ${a.patientName}, ${APPOINTMENT_STATUS[a.status].label}`}
      className={cn(
        'absolute z-10 overflow-hidden rounded-xs border-l-[3px] px-2 py-1 text-xs leading-4 transition-shadow duration-150',
        a.masked ? 'cursor-default border-l-line bg-neutral-100 text-muted' : cn('cursor-pointer text-ink hover:shadow-float', TONE_BLOCK_CLASS[tone]),
        a.status === 'NO_SHOW' && 'opacity-70',
        a.status === 'CANCELLED' && 'opacity-40 line-through',
        draggable && 'active:cursor-grabbing',
      )}
      style={{
        top,
        height: height - 2,
        left: `calc(${((lane?.lane ?? 0) / (lane?.lanes ?? 1)) * 100}% + 4px)`,
        width: `calc(${100 / (lane?.lanes ?? 1)}% - 8px)`,
      }}
    >
      <div className="flex items-center gap-1">
        {dot && <span className="size-2 shrink-0 rounded-full" style={{ background: staffColors[dot].base }} aria-hidden />}
        <span className="truncate font-medium">{a.patientName}</span>
        {a.noShowRisk === 'HIGH' && <TriangleAlert size={12} strokeWidth={2} className="shrink-0 text-danger" aria-label="Kelmay qolish xavfi" />}
        {!a.masked && a.status === 'SCHEDULED' && (
          a.reminder?.status === 'NO_ANSWER' || a.reminder?.status === 'BUSY' ? (
            <PhoneMissed size={12} strokeWidth={2} className="ml-auto shrink-0 text-warning" aria-label="Javob bermadi" />
          ) : (
            <Phone size={12} strokeWidth={2} className="ml-auto shrink-0 text-muted" aria-label="Tasdiqlanmagan" />
          )
        )}
      </div>
      {!small && <div className="truncate text-muted">{a.serviceNames.join(', ') || (a.masked ? 'Boshqa shifokor' : '')}</div>}
      {!small && height >= 60 && (
        <div className="tabular-nums text-muted">
          {fromMin(minOfDay(a.start))}–{fromMin(minOfDay(a.start) + a.durationMin)}
        </div>
      )}
    </div>
  );
  return a.masked ? content : (
    <Tooltip mouseEnterDelay={0.4} title={`${fromMin(minOfDay(a.start))} · ${a.patientName} · ${a.doctorName} · ${APPOINTMENT_STATUS[a.status].label}${a.noShowRisk === 'HIGH' ? ' · kelmay qolish xavfi' : ''}`}>
      {content}
    </Tooltip>
  );
};

/** Resurs ustunlari × vaqt qatorlari. FullCalendar ishlatilmaydi — CSS grid. */
export const TimeGrid = ({ columns, startMin, endMin, step, canDrag, onSlotClick, onOpen, onDrop, doctorColorOf }: Props) => {
  const now = useNowMin();
  const rows = Math.ceil((endMin - startMin) / step);
  const px = ROW / step;
  const height = rows * ROW;
  const [over, setOver] = useState<string | null>(null);

  const drop = (e: DragEvent, col: GridColumn, min: number) => {
    e.preventDefault();
    setOver(null);
    const id = e.dataTransfer.getData('text/appointment');
    const a = columns.flatMap((c) => c.items).find((x) => x.id === id);
    if (a) onDrop(a, col, min);
  };

  return (
    <div className="max-h-[calc(100vh-240px)] min-h-[420px] overflow-auto rounded-md bg-surface">
      <div className="grid min-w-full" style={{ gridTemplateColumns: `60px repeat(${columns.length}, minmax(168px, 1fr))` }}>
        {/* Sarlavha */}
        <div className="sticky left-0 top-0 z-30 border-b border-line bg-surface" />
        {columns.map((c) => (
          <div key={c.key} className="sticky top-0 z-20 border-b border-l border-line bg-surface px-3 py-3">
            {c.title}
          </div>
        ))}

        {/* Vaqt ustuni */}
        <div className="sticky left-0 z-20 bg-surface" style={{ height }}>
          {Array.from({ length: rows }, (_, i) => {
            const m = startMin + i * step;
            return m % 60 === 0 ? (
              <div key={m} className="absolute right-2 -translate-y-1/2 text-xs font-medium tabular-nums text-muted" style={{ top: i * ROW + (i === 0 ? 8 : 0) }}>
                {fromMin(m)}
              </div>
            ) : null;
          })}
        </div>

        {columns.map((c) => {
          const isToday = dayjs(c.date).isSame(now, 'day');
          const nowMin = now.hour() * 60 + now.minute();
          const lanes = layoutLanes(c.items);
          return (
            <div key={c.key} className="relative border-l border-line" style={{ height }}>
              {Array.from({ length: rows }, (_, i) => {
                const m = startMin + i * step;
                const isOff = c.off.some(([a, b]) => m >= a && m < b);
                const key = `${c.key}-${m}`;
                return (
                  <div
                    key={key}
                    role="button"
                    tabIndex={-1}
                    aria-label={`${fromMin(m)} — bo‘sh`}
                    onClick={() => !isOff && onSlotClick(c, m)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setOver(key);
                    }}
                    onDragLeave={() => setOver((o) => (o === key ? null : o))}
                    onDrop={(e) => drop(e, c, m)}
                    className={cn(
                      'absolute inset-x-0',
                      (m + step) % 60 === 0 ? 'border-b border-line' : 'border-b border-line-soft',
                      isOff ? 'bg-neutral-50' : 'calendar-slot cursor-pointer',
                      over === key && 'bg-lime-soft',
                    )}
                    style={{ top: i * ROW, height: ROW }}
                  />
                );
              })}
              {c.items.map((a) => {
                const s = minOfDay(a.start);
                return (
                  <Block
                    key={a.id}
                    a={a}
                    top={(s - startMin) * px}
                    height={a.durationMin * px}
                    draggable={canDrag(a)}
                    onOpen={() => onOpen(a)}
                    lane={lanes.get(a.id)}
                    dot={doctorColorOf?.(a.doctorId)}
                  />
                );
              })}
              {isToday && nowMin >= startMin && nowMin <= endMin && (
                <div className="pointer-events-none absolute inset-x-0 z-20 h-px bg-danger" style={{ top: (nowMin - startMin) * px }}>
                  <span className="absolute -left-1 -top-1 size-2 rounded-full bg-danger" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
