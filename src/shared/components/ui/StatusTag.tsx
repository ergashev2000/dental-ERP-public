import type { ReactNode } from 'react';
import type { Tone } from '@/shared/theme/tokens';
import type { StatusMeta } from '@/shared/constants/status';
import { cn } from '@/shared/utils/cn';
import { TONE_CLASS } from './toneClass';

interface Props {
  meta?: StatusMeta;
  tone?: Tone;
  children?: ReactNode;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

/** Status chip (Lime Health): 30px pill, soft fon + base matn, nuqta har doim so‘z bilan */
export const StatusTag = ({ meta, tone, children, dot = true, pulse, className }: Props) => {
  const t = meta?.tone ?? tone ?? 'neutral';
  return (
    <span
      className={cn(
        'inline-flex h-7.5 items-center gap-1.5 whitespace-nowrap rounded-pill px-3 text-xs leading-none',
        TONE_CLASS[t],
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 shrink-0 rounded-full bg-current', pulse && 'pulse-dot')} />}
      {children ?? meta?.label}
    </span>
  );
};
