export type { ToothCondition, ToothRecord, ToothHistory, Surface, SurfaceMap, Dentition } from './types';
export { useChart, useToothHistory } from './hooks/useChart';
export { ToothChart } from './components/ToothChart';
export { ToothShape } from './components/ToothShape';
export { DentalChartTab } from './components/DentalChartTab';
export { ToothDrawer } from './components/ToothDrawer';
export { ToothHistoryList } from './components/ToothHistoryList';
export { ChartLegend } from './components/ChartLegend';
export { conditionsLabel, surfaceCode } from './utils';
export { SurfaceSquare } from './components/SurfaceMaps';
// 3D jag' modeli: three.js faqat ochilganda yuklanadi (Jaw3DView ichida React.lazy)
export { Jaw3DView } from './components/Jaw3DView';
export { Jaw3DLegend } from './components/Jaw3DLegend';
export { JawPresentationModal, type JawPresentationModalProps } from './components/JawPresentationModal';
export type { Jaw3DViewProps, JawView } from './jaw3d/types';
