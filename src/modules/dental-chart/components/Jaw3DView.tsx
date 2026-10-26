import { Component, lazy, Suspense, useState, type ReactNode } from 'react';
import { Cube3D } from '@/shared/icons';
import { EmptyState } from '@/shared/components/ui';
import { cn } from '@/shared/utils/cn';
import type { Jaw3DViewProps } from '../jaw3d/types';

// three.js faqat 3D ko'rinish birinchi marta ochilganda yuklanadi (alohida bo'lak)
const Jaw3D = lazy(() => import('./Jaw3D'));

const DEFAULT_SIZE = 'h-[320px] md:h-[440px]';

const hasWebGL = () => {
  try {
    if (!window.WebGLRenderingContext) return false;
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    // tekshiruv konteksti darhol bo'shatiladi (brauzer kontekstlar sonini cheklaydi)
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
};

/** WebGL konteksti yaratilmasa yoki bo'lak yuklanmasa — 3D o'rniga do'stona xabar */
class Jaw3DBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const Frame = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cn('grid place-items-center rounded-md bg-neutral-25', className ?? DEFAULT_SIZE)}>{children}</div>
);

const Unavailable = ({ className }: { className?: string }) => (
  <Frame className={className}>
    <EmptyState
      icon={Cube3D}
      title="3D ko‘rinish mavjud emas"
      description="Bu qurilma yoki brauzer 3D grafikani (WebGL) qo‘llamaydi. Tish sxemasi 2D ko‘rinishda to‘liq ishlaydi."
    />
  </Frame>
);

const Loading = ({ className }: { className?: string }) => (
  <Frame className={className}>
    <div className="flex flex-col items-center gap-3 text-sm text-muted" role="status">
      <span className="grid size-12 animate-pulse place-items-center rounded-full bg-subtle text-ink">
        <Cube3D size={20} strokeWidth={1.5} />
      </span>
      3D model yuklanmoqda…
    </div>
  </Frame>
);

/**
 * 3D jag' modeli — lazy o'ram. Bemorga tushuntirish va ko'rish uchun; ma'lumot kiritish 2D sxemada.
 *
 * @example
 * const { data: records = [] } = useChart(patient.id);
 * <Jaw3DView records={records} dentition="adult" highlight={[16, 26]} onToothClick={(t) => setOpen(t)} />
 */
export const Jaw3DView = (props: Jaw3DViewProps) => {
  const [webgl] = useState(hasWebGL);
  if (!webgl) return <Unavailable className={props.className} />;
  return (
    <Jaw3DBoundary fallback={<Unavailable className={props.className} />}>
      <Suspense fallback={<Loading className={props.className} />}>
        <Jaw3D {...props} />
      </Suspense>
    </Jaw3DBoundary>
  );
};
