import { memo } from 'react';
import { GUM, IMPLANT, TOOTH_TEMPLATES, TOOTH_VIEWBOX } from '@/shared/assets/teeth/paths';
import { toothColors as c } from '@/shared/theme/tokens';
import { isPatientRight, isUpper } from '@/shared/utils/fdi';
import type { ToothCondition } from '../types';
import { templateFor, toothScale } from '../utils';

interface Props {
  tooth: number;
  conditions: ToothCondition[];
  width?: number;
}

const STROKE = {
  strokeWidth: 1.25,
  strokeLinejoin: 'round' as const,
  vectorEffect: 'non-scaling-stroke' as const,
};

/**
 * Bitta tishning anatomik SVG ko'rinishi.
 * Ranglar faqat tokenlardan, rang o‘tishlari va filtrlarsiz — hajm toj/ildiz tuslari bilan beriladi.
 */
export const ToothShape = memo(({ tooth, conditions, width = 44 }: Props) => {
  const t = TOOTH_TEMPLATES[templateFor(tooth)];
  const has = (x: ToothCondition) => conditions.includes(x);
  const missing = has('MISSING');
  const implant = has('IMPLANT');
  const upper = isUpper(tooth);
  const mirrorX = !isPatientRight(tooth);
  const s = toothScale(tooth);

  // pastki jag' — vertikal ko'zgu; chap tomon — gorizontal ko'zgu; o'lcham — bo'yin nuqtasi atrofida
  const transform = [
    `translate(24 ${upper ? 0 : 100})`,
    `scale(${mirrorX ? -1 : 1} ${upper ? 1 : -1})`,
    `translate(-24 0)`,
    `translate(24 58) scale(${s}) translate(-24 -58)`,
  ].join(' ');

  const crownFill = missing
    ? 'none'
    : has('CARIES')
      ? c.cariesSoft
      : has('FILLING')
        ? c.filling
        : has('CROWN')
          ? c.crownFill
          : c.crown;
  const crownStroke = missing ? c.missing : has('CROWN') ? c.crownStroke : c.stroke;
  const dash = missing ? '3 3' : undefined;

  const gumY = upper ? GUM.y : 100 - GUM.y - GUM.h;

  // Tartib: ildiz → milk → toj → pulpa → belgilar (pulpa kamerasi toj ichida ko'rinib turadi)
  return (
    <svg viewBox={TOOTH_VIEWBOX} width={width} height={(width * 100) / 48} className="block overflow-visible" aria-hidden>
      <g transform={transform}>
        {implant ? (
          <>
            <path d={IMPLANT.body} fill={c.crown} stroke={c.implant} {...STROKE} />
            {IMPLANT.threads.map((d) => (
              <path key={d} d={d} fill="none" stroke={c.implant} {...STROKE} />
            ))}
          </>
        ) : (
          <path d={t.root} fill={missing ? 'none' : c.root} stroke={missing ? c.missing : c.stroke} strokeDasharray={dash} className="tooth-outline" {...STROKE} />
        )}
      </g>
      <rect x={0} y={gumY} width={48} height={GUM.h} fill={c.gum} fillOpacity={missing ? 0.1 : 0.24} />
      <g transform={transform}>
        {implant && !has('CROWN') && <path d={IMPLANT.abutment} fill={c.crown} stroke={c.implant} {...STROKE} />}
        {(!implant || has('CROWN')) && (
          <path
            d={t.crown}
            fill={crownFill}
            stroke={crownStroke}
            strokeDasharray={dash}
            className="tooth-outline"
            {...STROKE}
            strokeWidth={has('CROWN') ? 2.4 : STROKE.strokeWidth}
          />
        )}
        {!missing && !implant && <path d={t.pulp} fill={has('ROOT_CANAL') ? c.rootCanal : c.pulp} fillOpacity={has('ROOT_CANAL') ? 1 : 0.9} />}
        {has('CARIES') && !missing && <circle cx={t.dot[0]} cy={t.dot[1]} r={3.4} fill={c.caries} />}
        {has('EXTRACTION_PLANNED') && (
          <g stroke={c.extraction} strokeWidth={2.4} strokeLinecap="round">
            <path d="M12 30 L36 88" vectorEffect="non-scaling-stroke" />
            <path d="M36 30 L12 88" vectorEffect="non-scaling-stroke" />
          </g>
        )}
      </g>
    </svg>
  );
});
ToothShape.displayName = 'ToothShape';
