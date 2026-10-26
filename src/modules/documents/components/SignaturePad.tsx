import { Button } from 'antd';
import { useEffect, useRef, type PointerEvent } from 'react';
import { RotateCcw } from '@/shared/icons';
import { brand } from '@/shared/theme/tokens';

interface Props {
  /** Imzo chizilsa — PNG data URL, tozalansa — null */
  onChange: (dataUrl: string | null) => void;
  empty: boolean;
  label?: string;
}

/** Oddiy imzo maydoni: canvas + pointer events (sichqoncha, barmoq, stilus) */
export const SignaturePad = ({ onChange, empty, label = 'Bemor imzosi' }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const ready = useRef(false);

  // Retina ekranlarda tiniq chiziq uchun o'lchamni devicePixelRatio bilan moslash
  const setup = () => {
    const c = canvasRef.current;
    if (!c || ready.current || !c.offsetWidth) return;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = brand.ink;
    ready.current = true;
  };

  // oxlint-disable-next-line react-hooks/exhaustive-deps -- faqat birinchi chizilganda
  useEffect(setup, []);

  const point = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const down = (e: PointerEvent<HTMLCanvasElement>) => {
    setup();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
    // bitta nuqta ham ko'rinsin
    const ctx = e.currentTarget.getContext('2d');
    if (ctx && last.current) {
      ctx.beginPath();
      ctx.arc(last.current.x, last.current.y, 1.1, 0, Math.PI * 2);
      ctx.fillStyle = brand.ink;
      ctx.fill();
    }
  };

  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return;
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const up = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    onChange(e.currentTarget.toDataURL('image/png'));
  };

  const clear = () => {
    const c = canvasRef.current;
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height);
    onChange(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted">{label}</span>
        <Button size="small" type="text" icon={<RotateCcw size={16} strokeWidth={1.5} />} disabled={empty} onClick={clear}>
          Tozalash
        </Button>
      </div>
      <div className="relative overflow-hidden rounded-md bg-subtle">
        <canvas
          ref={canvasRef}
          aria-label={`${label} — barmoq yoki sichqoncha bilan chizing`}
          className="block h-40 w-full cursor-crosshair touch-none"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        />
        {empty && (
          <span className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted">Shu yerga imzo qo‘ying</span>
        )}
        <span className="pointer-events-none absolute inset-x-6 bottom-8 border-t border-dashed border-line" />
      </div>
    </div>
  );
};
