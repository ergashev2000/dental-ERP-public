import { TOOTH_CONDITION } from '@/shared/constants/status';
import { toothColors as c } from '@/shared/theme/tokens';
import { cn } from '@/shared/utils/cn';
import { allJawTeeth, jawTeeth } from '../jaw3d/layout';
import { LOOK_COLOR, LOOK_OPACITY, toothLook, type LookKey } from '../jaw3d/look';
import type { Dentition, ToothCondition, ToothRecord } from '../types';
import { CONDITIONS } from '../utils';

/** 3D modeldagi tish ko'rinishi bilan bir xil namuna (rang + kontur) */
export const Jaw3DSwatch = ({ condition, size = 16 }: { condition: ToothCondition; size?: number }) => {
  if (condition === 'PLANNED')
    return (
      <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden className="shrink-0">
        <circle cx={8} cy={8} r={5.5} fill={c.crown} stroke={c.planned} strokeWidth={2.2} />
      </svg>
    );
  const key = condition as LookKey;
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden className="shrink-0">
      <circle
        cx={8}
        cy={8}
        r={6}
        fill={key === 'MISSING' ? 'none' : LOOK_COLOR[key]}
        fillOpacity={LOOK_OPACITY[key] ?? 1}
        stroke={key === 'CROWN' ? c.crownStroke : key === 'MISSING' || key === 'HEALTHY' ? c.stroke : 'none'}
        strokeWidth={key === 'CROWN' ? 2 : 1}
        strokeDasharray={key === 'MISSING' ? '2 2' : undefined}
      />
    </svg>
  );
};

interface Props {
  records: ToothRecord[];
  dentition?: Dentition;
  highlight?: number[];
  /** lg — bemorga ko'rsatish rejimi: katta yozuv, to'liq nom va tishlar soni */
  size?: 'sm' | 'lg';
}

/**
 * 3D model belgilari. sm — barcha holatlar (2D legend kabi);
 * lg — faqat shu bemorda uchraydigan holatlar, soni bilan.
 */
export const Jaw3DLegend = ({ records, dentition = 'adult', highlight, size = 'sm' }: Props) => {
  const lg = size === 'lg';
  const counts = new Map<ToothCondition, number>();
  if (lg) {
    const byTooth = new Map(records.map((r) => [r.tooth, r]));
    for (const t of allJawTeeth(jawTeeth(dentition, records, highlight))) {
      const look = toothLook(byTooth.get(t)?.conditions ?? []);
      counts.set(look.key, (counts.get(look.key) ?? 0) + 1);
      if (look.planned) counts.set('PLANNED', (counts.get('PLANNED') ?? 0) + 1);
    }
  }
  const items = lg ? CONDITIONS.filter((k) => counts.get(k)) : CONDITIONS;

  return (
    <ul className={cn('m-0 list-none p-0', lg ? 'flex flex-col gap-3' : 'flex flex-wrap gap-x-4 gap-y-2')}>
      {items.map((k) => (
        <li key={k} className={cn('flex items-center', lg ? 'gap-3 text-base text-ink' : 'gap-1.5 text-xs text-muted')}>
          <Jaw3DSwatch condition={k} size={lg ? 22 : 16} />
          <span className="min-w-0 flex-1">{lg ? TOOTH_CONDITION[k].label : TOOTH_CONDITION[k].short}</span>
          {lg && <span className="text-sm tabular-nums text-muted">{counts.get(k)} ta</span>}
        </li>
      ))}
    </ul>
  );
};
