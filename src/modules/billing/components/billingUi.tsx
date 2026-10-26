import type { AppIcon } from '@/shared/icons';
import { formatMoney } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';

/** Katta summa: raqam yengil, "so‘m" kichik va xira (Lime Health numeral) */
export const Amount = ({ value, className, unitClassName = 'text-muted' }: { value: number; className?: string; unitClassName?: string }) => (
  <span className={cn('whitespace-nowrap tabular-nums', className)}>
    {formatMoney(value, false)} <span className={cn('text-[0.55em]', unitClassName)}>so‘m</span>
  </span>
);

/** Ikonka doirasi (karta ichida) */
export const IconCircle = ({ icon: Icon, className }: { icon: AppIcon; className?: string }) => (
  <span className={cn('grid size-10 shrink-0 place-items-center rounded-full bg-subtle text-ink', className)}>
    <Icon size={20} strokeWidth={1.5} />
  </span>
);
