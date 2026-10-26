import { cn } from '@/shared/utils/cn';

/** Lime Health: bo'lim sarlavhasi (title) ostidagi 26×6 to'lqin. Bitta sarlavhaga bitta, ajratgich emas */
export const Squiggle = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 26 6" className={cn('mt-1.5 block h-1.5 w-6.5', className)} aria-hidden>
    <path d="M1 3c3-3 5 3 8 0s5 3 8 0 5 3 8 0" fill="none" stroke="currentColor" strokeWidth={1.3} />
  </svg>
);
