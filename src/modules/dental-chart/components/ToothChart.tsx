import { Tooltip } from 'antd';
import { memo, type KeyboardEvent, type MouseEvent } from 'react';
import { ADULT_LOWER, ADULT_UPPER, CHILD_LOWER, CHILD_UPPER, isUpper, toothName } from '@/shared/utils/fdi';
import { cn } from '@/shared/utils/cn';
import type { Dentition, ToothRecord } from '../types';
import { conditionsLabel, surfaceCode } from '../utils';
import { SurfaceCircle } from './SurfaceMaps';
import { ToothShape } from './ToothShape';

interface CellProps {
  tooth: number;
  record?: ToothRecord;
  selected: boolean;
  onSelect: (tooth: number, multi: boolean) => void;
  onOpen: (tooth: number) => void;
  compact?: boolean;
}

const ToothCell = memo(({ tooth, record, selected, onSelect, onOpen, compact }: CellProps) => {
  const conditions = record?.conditions ?? [];
  const surfaces = record?.surfaces ?? {};
  const upper = isUpper(tooth);
  const label = conditionsLabel(conditions);
  const code = surfaceCode(tooth, surfaces);
  const planned = conditions.includes('PLANNED');
  const missing = conditions.includes('MISSING');

  const click = (e: MouseEvent) => {
    const multi = e.shiftKey || e.ctrlKey || e.metaKey;
    onSelect(tooth, multi);
    // oddiy bosish — tanlab drawer'ni ochadi; Shift/Ctrl — bir nechta tanlash
    if (!multi) onOpen(tooth);
  };
  const key = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onOpen(tooth);
    } else if (e.key === ' ') {
      e.preventDefault();
      onSelect(tooth, e.shiftKey || e.ctrlKey);
    }
  };

  const number = (
    <div className="flex h-5 items-center justify-center gap-1">
      <span className={cn('text-sm font-medium tabular-nums', missing ? 'text-hint' : 'text-ink')}>
        {tooth}
      </span>
      {planned && <span className="size-2.5 rounded-full border-2 border-warning" aria-hidden />}
    </div>
  );

  return (
    <Tooltip
      mouseEnterDelay={0.25}
      title={
        <div className="text-xs leading-5">
          <div className="font-medium">
            {tooth} — {toothName(tooth)}
          </div>
          <div>{label}</div>
          {code && <div>Yuzalar: {code}</div>}
          {record?.note && <div className="opacity-80">{record.note}</div>}
        </div>
      }
    >
      <div
        role="button"
        tabIndex={0}
        data-tooth={tooth}
        aria-label={`Tish ${tooth}, ${label.toLowerCase()}`}
        aria-pressed={selected}
        onClick={click}
        onKeyDown={key}
        className={cn(
          'tooth-cell flex cursor-pointer select-none flex-col items-center gap-1 rounded-sm px-0.5 py-1.5 outline-none',
          selected ? 'bg-lime-soft ring-1 ring-inset ring-ink' : 'bg-neutral-25 hover:bg-subtle',
        )}
      >
        {!upper && number}
        {!upper && (
          <SurfaceCircle tooth={tooth} surfaces={surfaces} dimmed={missing} size={compact ? 26 : 32} />
        )}
        <ToothShape tooth={tooth} conditions={conditions} width={compact ? 36 : 50} />
        {upper && (
          <SurfaceCircle tooth={tooth} surfaces={surfaces} dimmed={missing} size={compact ? 26 : 32} />
        )}
        {upper && number}
      </div>
    </Tooltip>
  );
});
ToothCell.displayName = 'ToothCell';

interface ChartProps {
  records: ToothRecord[];
  dentition: Dentition;
  selected: number[];
  onSelect?: (tooth: number, multi: boolean) => void;
  onOpen?: (tooth: number) => void;
  compact?: boolean;
}

const noop = () => undefined;

/**
 * FDI odontogramma. Shifokor nuqtai nazaridan: yuqori qator 18…11 | 21…28, pastki 48…41 | 31…38.
 * 16 ustunli grid; sut tishlari (10 ta) markazga, 4–13 ustunlarga joylashadi.
 */
export const ToothChart = ({
  records,
  dentition,
  selected,
  onSelect = noop,
  onOpen = noop,
  compact,
}: ChartProps) => {
  const byTooth = new Map(records.map((r) => [r.tooth, r]));

  const row = (teeth: number[], child = false) => (
    <div className="grid grid-cols-16 gap-x-0.5">
      {teeth.map((t, i) => (
        <div
          key={t}
          style={child ? { gridColumnStart: i + 4 } : undefined}
          className={cn((child ? i === 4 : i === 7) && 'border-r border-dashed border-line pr-0.5')}
        >
          <ToothCell
            tooth={t}
            record={byTooth.get(t)}
            selected={selected.includes(t)}
            onSelect={onSelect}
            onOpen={onOpen}
            compact={compact}
          />
        </div>
      ))}
    </div>
  );

  const rows =
    dentition === 'adult'
      ? [row(ADULT_UPPER), 'mid', row(ADULT_LOWER)]
      : dentition === 'child'
        ? [row(CHILD_UPPER, true), 'mid', row(CHILD_LOWER, true)]
        : [row(ADULT_UPPER), row(CHILD_UPPER, true), 'mid', row(CHILD_LOWER, true), row(ADULT_LOWER)];

  return (
    <>
      <div className="overflow-x-auto pb-2">
        <div
          className={cn(
            'mx-auto flex flex-col gap-2',
            compact ? 'min-w-[640px] max-w-[760px]' : 'min-w-[860px] max-w-[1080px]',
          )}
        >
          {rows.map((r, i) =>
            r === 'mid' ? (
              <div
                key={`mid-${i}`}
                className="flex items-center gap-3 text-xs font-medium text-muted"
                aria-hidden
              >
                <span className="whitespace-nowrap">O‘ng</span>
                <span className="h-px flex-1 bg-line" />
                <span className="whitespace-nowrap">Chap</span>
              </div>
            ) : (
              <div key={i}>{r}</div>
            ),
          )}
        </div>
      </div>
      {!compact && (
        <div className="text-center text-xs text-muted xl:hidden">← Sxemani yon tomonga suring →</div>
      )}
    </>
  );
};
