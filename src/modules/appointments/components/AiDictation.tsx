import { Button } from 'antd';
import { AiMic, Check, RotateCcw, Sparkles, X } from '@/shared/icons';
import { useEffect, useState } from 'react';
import { StatusTag } from '@/shared/components/ui';
import { useServices } from '@/modules/services';
import type { CompleteItem } from '../types';

type Phase = 'idle' | 'listening' | 'ready';

/**
 * AI diktovka (TZ 5-bo'lim) — MOCK: shifokor gapiradi, tizim tuzilgan klinik yozuv taklif qiladi.
 * Haqiqiy nutq → matn va LLM backend'dagi AI shlyuzi orqali ulanadi (kalitlar faqat serverda).
 * Hozircha bugungi ish ro'yxatidan namunaviy yozuv tuziladi. Natija — faqat taklif: shifokor tasdiqlamaguncha saqlanmaydi.
 */
export const AiDictation = ({ items, onApply }: { items: CompleteItem[]; onApply: (text: string) => void }) => {
  const { data: services = [] } = useServices();
  const [phase, setPhase] = useState<Phase>('idle');
  const [text, setText] = useState('');

  useEffect(() => {
    if (phase !== 'listening') return;
    const t = setTimeout(() => {
      const lines = items
        .filter((i) => i?.serviceId)
        .map((i) => `${services.find((s) => s.id === i.serviceId)?.name ?? 'Muolaja'}${i.tooth ? ` — ${i.tooth}-tish` : ''}`);
      const teeth = [...new Set(items.map((i) => i?.tooth).filter((t): t is number => !!t))];
      setText(
        [
          `Shikoyat: ${teeth.length ? `${teeth.join(', ')}-tish sohasida sovuq va shirinlikdan og‘riq.` : 'Profilaktik ko‘rik, shikoyat yo‘q.'}`,
          `Ko‘rik: ${teeth.length ? 'chuqur karioz bo‘shliq, perkussiya og‘riqsiz.' : 'shilliq qavat sog‘lom, tish toshi oz miqdorda.'}`,
          `Muolaja: ${lines.length ? lines.join('; ') : 'ko‘rik va maslahat'}.`,
          'Tavsiya: 2 soat ovqat yemaslik, issiq-sovuqdan ehtiyot bo‘lish.',
        ].join('\n'),
      );
      setPhase('ready');
    }, 2200);
    return () => clearTimeout(t);
  }, [phase, items, services]);

  if (phase === 'idle') {
    return (
      <div className="flex items-center gap-3 rounded-md bg-subtle p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface" aria-hidden>
          <AiMic size={20} strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1 text-sm leading-tight">
          Ovoz bilan yozish
          <span className="block text-xs text-muted">Gapiring — AI shikoyat, ko‘rik va muolajani o‘zi ajratadi</span>
        </div>
        <Button onClick={() => setPhase('listening')}>Boshlash</Button>
      </div>
    );
  }

  if (phase === 'listening') {
    return (
      <div className="flex items-center gap-3 rounded-md bg-subtle p-3" role="status">
        <span className="size-2.5 shrink-0 rounded-full bg-danger pulse-dot" aria-hidden />
        <span className="flex-1 text-sm">Tinglayapman… (simulyatsiya)</span>
        <Button size="small" type="text" icon={<X size={16} strokeWidth={1.5} />} onClick={() => setPhase('idle')}>
          To‘xtatish
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md bg-subtle p-3">
      <div className="flex items-center gap-2">
        <StatusTag tone="info" dot={false}>
          <Sparkles size={14} strokeWidth={1.5} />
          AI taklifi
        </StatusTag>
        <span className="text-xs text-muted">Tekshiring — tasdiqlamaguningizcha saqlanmaydi</span>
      </div>
      <pre className="m-0 whitespace-pre-wrap font-sans text-sm text-ink">{text}</pre>
      <div className="flex flex-wrap justify-end gap-2">
        <Button size="small" type="text" icon={<RotateCcw size={16} strokeWidth={1.5} />} onClick={() => setPhase('listening')}>
          Qayta
        </Button>
        <Button size="small" type="text" icon={<X size={16} strokeWidth={1.5} />} onClick={() => setPhase('idle')}>
          Bekor
        </Button>
        <Button
          size="small"
          type="primary"
          icon={<Check size={16} strokeWidth={1.5} />}
          onClick={() => {
            onApply(text);
            setPhase('idle');
          }}
        >
          Izohga qo‘shish
        </Button>
      </div>
    </div>
  );
};
