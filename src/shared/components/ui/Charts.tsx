import type { AreaConfig, BarConfig, ColumnConfig, LineConfig } from '@ant-design/charts';
import type { PieConfig } from '@ant-design/plots';
import { Skeleton } from 'antd';
import { lazy, Suspense } from 'react';
import { font, palette } from '@/shared/theme/tokens';
import { formatNumber } from '@/shared/utils/format';

// Chart kutubxonasi og'ir — faqat kerak bo'lganda yuklanadi
const ColumnLazy = lazy(() => import('@ant-design/charts').then((m) => ({ default: m.Column })));
const BarLazy = lazy(() => import('@ant-design/charts').then((m) => ({ default: m.Bar })));
const AreaLazy = lazy(() => import('@ant-design/charts').then((m) => ({ default: m.Area })));
const LineLazy = lazy(() => import('@ant-design/charts').then((m) => ({ default: m.Line })));
const PieLazy = lazy(() => import('@ant-design/charts').then((m) => ({ default: m.Pie })));

/** Qisqa so'm: 1 250 000 → "1,3 mln" */
const shortMoney = (v: number) =>
  v >= 1_000_000 ? `${formatNumber(Math.round(v / 100_000) / 10, 1)} mln` : v >= 1000 ? `${Math.round(v / 1000)} ming` : String(v);

const common = {
  autoFit: true,
  theme: {
    fontFamily: font.family,
    axis: {
      labelFill: palette.neutral[500],
      labelFontSize: 12,
      gridStroke: palette.neutral[100],
      lineStroke: palette.neutral[200],
    },
  },
  axis: {
    x: { tick: false, line: true, labelFill: palette.neutral[500], labelAutoHide: true, labelAutoRotate: false },
    y: {
      grid: true,
      gridLineDash: [0, 0],
      gridStroke: palette.neutral[100],
      labelFill: palette.neutral[500],
      labelAutoHide: true,
      labelAutoRotate: false,
      labelFormatter: (v: number) => shortMoney(v),
    },
  },
};

/** Sahifadan kelgan `axis` umumiy sozlamani butunlay almashtirmasin — ustiga qo'shilsin (`axis={undefined}` ham o'chirmaydi) */
type AxisPart = Record<string, unknown>;
const mergeAxis = (a: unknown) => {
  if (a === false) return false;
  const o = (a ?? {}) as { x?: AxisPart; y?: AxisPart };
  return { x: { ...common.axis.x, ...o.x }, y: { ...common.axis.y, ...o.y } };
};

const Fallback = ({ height }: { height: number }) => (
  <div style={{ height }} className="flex items-center">
    <Skeleton.Node active className="!h-full !w-full" />
  </div>
);

/** Bitta primary rangdagi tekis ustunli chart */
export const SimpleColumn = ({ axis, height = 260, ...config }: Omit<ColumnConfig, 'height'> & { height?: number }) => (
  <Suspense fallback={<Fallback height={height} />}>
    <ColumnLazy
      {...common}
      height={height}
      style={{ fill: palette.neutral[900], radiusTopLeft: 6, radiusTopRight: 6, maxWidth: 36 }}
      {...config}
      axis={mergeAxis(axis)}
    />
  </Suspense>
);

export const SimpleBar = ({ axis, height = 300, ...config }: Omit<BarConfig, 'height'> & { height?: number }) => (
  <Suspense fallback={<Fallback height={height} />}>
    <BarLazy {...common} height={height} style={{ fill: palette.neutral[900], radiusTopRight: 6, radiusBottomRight: 6, maxWidth: 22 }} {...config} axis={mergeAxis(axis)} />
  </Suspense>
);

export const SimpleArea = ({ axis, height = 260, ...config }: Omit<AreaConfig, 'height'> & { height?: number }) => (
  <Suspense fallback={<Fallback height={height} />}>
    <AreaLazy
      {...common}
      height={height}
      style={{ fill: palette.neutral[200], fillOpacity: 0.35, stroke: palette.neutral[900], lineWidth: 2 }}
      {...config}
      axis={mergeAxis(axis)}
    />
  </Suspense>
);

export const SimpleLine = ({ axis, height = 260, ...config }: Omit<LineConfig, 'height'> & { height?: number }) => (
  <Suspense fallback={<Fallback height={height} />}>
    <LineLazy
      {...common}
      height={height}
      style={{ stroke: palette.neutral[900], lineWidth: 2 }}
      {...config}
      axis={mergeAxis(axis)}
    />
  </Suspense>
);

export const SimpleDonut = ({ height = 240, ...config }: Omit<PieConfig, 'height'> & { height?: number }) => (
  <Suspense fallback={<Fallback height={height} />}>
    <PieLazy
      autoFit
      height={height}
      innerRadius={0.68}
      radius={0.92}
      legend={false}
      {...config}
    />
  </Suspense>
);
