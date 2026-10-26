import { memo } from 'react';
import { palette, toothColors as c } from '@/shared/theme/tokens';
import type { Surface, SurfaceMap, SurfaceState } from '../types';
import { surfaceAt, surfaceLetter, surfaceName, type SurfacePos } from '../utils';

const fillFor = (state?: SurfaceState) => (state === 'CARIES' ? c.caries : state === 'FILLING' ? c.fillingSurface : c.crown);

/* ---------- Doira (asosiy sxemada, referens rasmdagi kabi) ---------- */

const polar = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [+(r * Math.cos(a)).toFixed(3), +(r * Math.sin(a)).toFixed(3)] as const;
};

const sector = (r1: number, r2: number, from: number, to: number) => {
  const [x1, y1] = polar(r2, from);
  const [x2, y2] = polar(r2, to);
  const [x3, y3] = polar(r1, to);
  const [x4, y4] = polar(r1, from);
  return `M${x1} ${y1} A${r2} ${r2} 0 0 1 ${x2} ${y2} L${x3} ${y3} A${r1} ${r1} 0 0 0 ${x4} ${y4} Z`;
};

const R_OUT = 16;
const R_IN = 6.5;
const RING: Record<Exclude<SurfacePos, 'center'>, string> = {
  top: sector(R_IN, R_OUT, -135, -45),
  right: sector(R_IN, R_OUT, -45, 45),
  bottom: sector(R_IN, R_OUT, 45, 135),
  left: sector(R_IN, R_OUT, 135, 225),
};

/** Kichik 5 zonali doira: yuzalar holati (faqat ko'rish uchun) */
export const SurfaceCircle = memo(({ tooth, surfaces, size = 32, dimmed }: { tooth: number; surfaces: SurfaceMap; size?: number; dimmed?: boolean }) => (
  <svg viewBox="-17 -17 34 34" width={size} height={size} aria-hidden className={dimmed ? 'opacity-40' : undefined}>
    {(Object.keys(RING) as (keyof typeof RING)[]).map((pos) => (
      <path key={pos} d={RING[pos]} fill={fillFor(surfaces[surfaceAt(tooth, pos)])} stroke={c.stroke} strokeWidth={0.9} />
    ))}
    <circle r={R_IN} fill={fillFor(surfaces.O)} stroke={c.stroke} strokeWidth={0.9} />
  </svg>
));
SurfaceCircle.displayName = 'SurfaceCircle';

/* ---------- Kvadrat 5 zonali sxema (tish drawer'ida, bosiladigan) ---------- */

const SQ: Record<SurfacePos, { d: string; label: [number, number] }> = {
  top: { d: 'M0 0 L120 0 L84 36 L36 36 Z', label: [60, 20] },
  right: { d: 'M120 0 L120 120 L84 84 L84 36 Z', label: [103, 62] },
  bottom: { d: 'M0 120 L120 120 L84 84 L36 84 Z', label: [60, 104] },
  left: { d: 'M0 0 L36 36 L36 84 L0 120 Z', label: [17, 62] },
  center: { d: 'M36 36 L84 36 L84 84 L36 84 Z', label: [60, 62] },
};

interface SquareProps {
  tooth: number;
  value: SurfaceMap;
  onChange?: (next: SurfaceMap) => void;
  /** Bosilganda qo'yiladigan holat */
  brush: SurfaceState;
  disabled?: boolean;
}

/** Klassik 5 zonali sxema: har zona bosiladi — tanlangan holat (karies/plomba) qo'yiladi yoki olib tashlanadi */
export const SurfaceSquare = ({ tooth, value, onChange, brush, disabled }: SquareProps) => {
  const toggle = (s: Surface) => {
    if (disabled || !onChange) return;
    const next = { ...value };
    if (next[s] === brush) delete next[s];
    else next[s] = brush;
    onChange(next);
  };
  return (
    <svg viewBox="-2 -2 124 124" width={176} height={176} role="group" aria-label="Tish yuzalari">
      {(Object.keys(SQ) as SurfacePos[]).map((pos) => {
        const s = surfaceAt(tooth, pos);
        const st = value[s];
        return (
          <g
            key={pos}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={`${surfaceName(tooth, s)} yuza${st ? `, ${st === 'CARIES' ? 'karies' : 'plomba'}` : ''}`}
            aria-pressed={!!st}
            onClick={() => toggle(s)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle(s);
              }
            }}
            className={disabled ? undefined : 'cursor-pointer outline-none [&:focus-visible>path]:stroke-ink'}
          >
            <path d={SQ[pos].d} fill={fillFor(st)} stroke={palette.neutral[400]} strokeWidth={1.25} strokeLinejoin="round" />
            <text
              x={SQ[pos].label[0]}
              y={SQ[pos].label[1]}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={13}
              fontWeight={500}
              fill={st === 'CARIES' ? palette.neutral[0] : palette.neutral[700]}
              className="pointer-events-none select-none"
            >
              {surfaceLetter(tooth, s)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
