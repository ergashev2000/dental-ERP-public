import { toothColors as c } from '@/shared/theme/tokens';
import { TOOTH_CONDITION } from '@/shared/constants/status';
import type { ToothCondition } from '../types';
import { CONDITIONS } from '../utils';

const S = { strokeWidth: 1.25, vectorEffect: 'non-scaling-stroke' as const };

export const ConditionIcon = ({ condition, size = 16 }: { condition: ToothCondition; size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden className="shrink-0">
    {condition === 'HEALTHY' && <rect x={2} y={2} width={12} height={12} rx={4} fill={c.crown} stroke={c.stroke} {...S} />}
    {condition === 'CARIES' && (
      <>
        <rect x={2} y={2} width={12} height={12} rx={4} fill={c.cariesSoft} stroke={c.stroke} {...S} />
        <circle cx={8} cy={8} r={2.4} fill={c.caries} />
      </>
    )}
    {condition === 'FILLING' && <rect x={2} y={2} width={12} height={12} rx={4} fill={c.filling} stroke={c.stroke} {...S} />}
    {condition === 'ROOT_CANAL' && (
      <>
        <rect x={2} y={2} width={12} height={12} rx={4} fill={c.root} stroke={c.stroke} {...S} />
        <path d="M8 3.5 L8 12.5" stroke={c.rootCanal} strokeWidth={2.2} strokeLinecap="round" />
      </>
    )}
    {condition === 'CROWN' && <rect x={2.5} y={2.5} width={11} height={11} rx={4} fill={c.crownFill} stroke={c.crownStroke} strokeWidth={2.2} />}
    {condition === 'IMPLANT' && (
      <>
        <path d="M5.5 2.5 L10.5 2.5 L10.5 11 Q8 14.5 5.5 11 Z" fill={c.crown} stroke={c.implant} {...S} />
        <path d="M5 5.5 L11 4.5 M5 8.5 L11 7.5" stroke={c.implant} {...S} />
      </>
    )}
    {condition === 'MISSING' && <rect x={2} y={2} width={12} height={12} rx={4} fill="none" stroke={c.missing} strokeDasharray="2 2" {...S} />}
    {condition === 'EXTRACTION_PLANNED' && (
      <path d="M3.5 3.5 L12.5 12.5 M12.5 3.5 L3.5 12.5" stroke={c.extraction} strokeWidth={2.2} strokeLinecap="round" />
    )}
    {condition === 'PLANNED' && <circle cx={8} cy={8} r={4} fill="none" stroke={c.planned} strokeWidth={2.2} />}
  </svg>
);

export const ChartLegend = () => (
  <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-2 p-0">
    {CONDITIONS.map((k) => (
      <li key={k} className="flex items-center gap-1.5 text-xs text-muted">
        <ConditionIcon condition={k} />
        {TOOTH_CONDITION[k].short}
      </li>
    ))}
    <li className="flex items-center gap-1.5 text-xs text-muted">
      <span className="size-3 rounded-full bg-danger" aria-hidden />
      Yuza: karies
    </li>
    <li className="flex items-center gap-1.5 text-xs text-muted">
      <span className="size-3 rounded-full bg-lime-press" aria-hidden />
      Yuza: plomba
    </li>
  </ul>
);
