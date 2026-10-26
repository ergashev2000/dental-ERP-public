import { useEffect, useRef } from 'react';
import { brand, palette } from '@/shared/theme/tokens';

export type VisualizerState = 'idle' | 'listening' | 'speaking' | 'thinking';

interface Props {
  state: VisualizerState;
  audioStream?: MediaStream | null;
  analyserNode?: AnalyserNode | null;
  className?: string;
}

export const VoiceVisualizer = ({ state, audioStream, analyserNode, className = '' }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animIdRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (audioStream) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        const source = ctx.createMediaStreamSource(audioStream);
        source.connect(analyser);

        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
      } catch {
        // audio context xatoligini e'tiborsiz qoldirish
      }
    }

    return () => {
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      analyserRef.current = null;
    };
  }, [audioStream]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const barCount = 32;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const activeAnalyser = analyserNode || analyserRef.current;
      const dataArray = new Uint8Array(barCount);
      if (activeAnalyser && (state === 'listening' || state === 'speaking')) {
        const buffer = new Uint8Array(activeAnalyser.frequencyBinCount);
        activeAnalyser.getByteFrequencyData(buffer);
        for (let i = 0; i < barCount; i++) {
          dataArray[i] = buffer[Math.floor((i * buffer.length) / barCount)] || 0;
        }
      }

      phase += 0.08;
      const centerY = height / 2;
      const barWidth = 4;
      const gap = (width - barCount * barWidth) / (barCount - 1);

      for (let i = 0; i < barCount; i++) {
        let barHeight = 8;
        const x = i * (barWidth + gap);

        if (state === 'speaking') {
          // AI gapirayotganda real chastota yoki to'lqin
          if (activeAnalyser) {
            const val = dataArray[i] / 255;
            barHeight = Math.max(8, val * (height * 0.85) + 6);
          } else {
            const wave1 = Math.sin(phase + i * 0.35) * 28;
            const wave2 = Math.cos(phase * 0.7 + i * 0.2) * 18;
            barHeight = Math.max(8, Math.abs(wave1 + wave2) + 12);
          }
        } else if (state === 'listening') {
          // Foydalanuvchi ovozi
          if (activeAnalyser) {
            const val = dataArray[i] / 255;
            barHeight = Math.max(6, val * (height * 0.75));
          } else {
            const wave = Math.sin(phase * 1.5 + i * 0.4) * 24;
            barHeight = Math.max(8, Math.abs(wave) + 14);
          }
        } else if (state === 'thinking') {
          // Pulsatsiyalanuvchi to'lqin
          const distFromCenter = Math.abs(i - barCount / 2);
          barHeight = Math.max(6, Math.sin(phase * 2 - distFromCenter * 0.3) * 26 + 10);
        } else {
          // Sokin nafas olish (idle)
          const gentle = Math.sin(phase * 0.4 + i * 0.2) * 8;
          barHeight = Math.max(6, Math.abs(gentle) + 8);
        }

        // Chizish: Lime Health ink / olive / line ohanglarida
        const y = centerY - barHeight / 2;
        ctx.fillStyle =
          state === 'speaking'
            ? palette.neutral[900]
            : state === 'listening'
              ? brand.olive
              : state === 'thinking'
                ? palette.neutral[500]
                : palette.neutral[300];

        // Yumaloq burchakli bar
        ctx.beginPath();
        const r = barWidth / 2;
        ctx.roundRect(x, y, barWidth, barHeight, [r, r, r, r]);
        ctx.fill();
      }

      animIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [state, analyserNode]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={320}
        height={90}
        className="w-full max-w-[340px] h-[90px]"
      />
    </div>
  );
};
