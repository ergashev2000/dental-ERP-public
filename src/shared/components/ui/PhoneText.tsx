import { formatPhone } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';

export const PhoneText = ({ phone, className, plain }: { phone?: string; className?: string; plain?: boolean }) => {
  if (!phone) return <span className="text-muted">—</span>;
  if (plain) return <span className={cn('tabular-nums whitespace-nowrap', className)}>{formatPhone(phone)}</span>;
  return (
    <a
      href={`tel:${phone}`}
      onClick={(e) => e.stopPropagation()}
      className={cn('tabular-nums whitespace-nowrap text-ink underline-offset-2 hover:underline', className)}
    >
      {formatPhone(phone)}
    </a>
  );
};
