import type { Tone } from '@/shared/theme/tokens';

/** Semantik ohang → soft fon + base matn (Tailwind klasslari) */
export const TONE_CLASS: Record<Tone, string> = {
  info: 'bg-info-soft text-info',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  primary: 'bg-lime text-on-lime',
  neutral: 'bg-neutral-100 text-neutral-600',
};

/**
 * Zich bloklar (kalendar qabuli) uchun: soft fon + chap 3px chiziq status rangida.
 * Lime faqat `primary` (masalan, "Qabulda" — hozir kresloda) — kalendardagi yagona lime blok.
 */
export const TONE_BLOCK_CLASS: Record<Tone, string> = {
  info: 'bg-info-soft border-l-info',
  success: 'bg-success-soft border-l-success',
  warning: 'bg-warning-soft border-l-warning',
  danger: 'bg-danger-soft border-l-danger',
  primary: 'bg-lime border-l-ink',
  // yakunlangan — sokin: oq blok, ingichka chegara (ish vaqtidan tashqari kulrang fondan ajralsin)
  neutral: 'bg-surface ring-1 ring-inset ring-line border-l-neutral-400',
};

/** Legend nuqtalari — blok chizig'i bilan bir xil rang */
export const TONE_DOT_CLASS: Record<Tone, string> = {
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  primary: 'bg-lime ring-1 ring-inset ring-ink',
  neutral: 'bg-neutral-400',
};
