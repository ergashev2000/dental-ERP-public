import { TONE_DOT_CLASS } from '@/shared/components/ui';
import { APPOINTMENT_STATUS } from '@/shared/constants/status';
import { cn } from '@/shared/utils/cn';
import type { AppointmentStatus } from '../types';

const ORDER: AppointmentStatus[] = ['SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'NO_SHOW', 'CANCELLED'];

/** Kalendar bloklari rangining izohi — rang har doim so'z bilan */
export const StatusLegend = ({ includeCancelled, className }: { includeCancelled?: boolean; className?: string }) => (
  <ul className={cn('m-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0 text-xs text-muted', className)} aria-label="Status ranglari">
    {ORDER.filter((s) => includeCancelled || s !== 'CANCELLED').map((s) => (
      <li key={s} className="inline-flex items-center gap-1.5">
        <span className={cn('size-2.5 shrink-0 rounded-full', TONE_DOT_CLASS[APPOINTMENT_STATUS[s].tone])} aria-hidden />
        {APPOINTMENT_STATUS[s].label}
      </li>
    ))}
  </ul>
);
