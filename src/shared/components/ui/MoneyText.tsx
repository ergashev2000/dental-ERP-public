import { formatMoney } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';

interface Props {
  value: number;
  /** true — qiymat qarz sifatida belgilanadi (0 dan katta bo'lsa oldida kichik danger nuqta) */
  debt?: boolean;
  strong?: boolean;
  muted?: boolean;
  className?: string;
}

/**
 * Summa. Qarz raqami qizilga bo'yalmaydi (dizayn qoidasi: raqam bo'yalmaydi, status kichik va so'z bilan) —
 * raqam ink, oldida kichik danger nuqta; "qarz" so'zi ustun sarlavhasi yoki yonidagi labelda turadi.
 */
export const MoneyText = ({ value, debt, strong, muted, className }: Props) => {
  const isDebt = debt && value > 0;
  return (
    <span
      className={cn('tabular-nums whitespace-nowrap', isDebt && 'inline-flex items-center gap-1.5', strong && 'font-medium', muted && 'text-muted', className)}
      aria-label={isDebt ? `qarz ${formatMoney(value)}` : undefined}
    >
      {isDebt && <span className="size-1.5 shrink-0 rounded-full bg-danger" aria-hidden />}
      {formatMoney(value)}
    </span>
  );
};
