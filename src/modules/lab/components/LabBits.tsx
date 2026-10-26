import { App, Button } from 'antd';
import { ArrowRight, TriangleAlert } from '@/shared/icons';
import dayjs from '@/shared/lib/dayjs';
import { usePermission } from '@/shared/hooks/usePermission';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { cn } from '@/shared/utils/cn';
import { LAB_STATUS, NEXT_STATUS, PENDING_STATUSES } from '../constants';
import { useSetLabStatus } from '../hooks/useLab';
import type { LabOrderView } from '../types';

/** Qaytish muddati: sana + so‘z bilan holat (kechikkan — danger, bugun — warning) */
export const LabDueText = ({ o, full }: { o: LabOrderView; full?: boolean }) => {
  const date = dayjs(o.dueDate).format(full ? 'DD.MM.YYYY' : 'DD.MM');
  if (!PENDING_STATUSES.includes(o.status)) return <span className="whitespace-nowrap tabular-nums text-muted">{date}</span>;
  const n = o.daysLeft;
  const hint = n < 0 ? `${-n} kun kechikdi` : n === 0 ? 'bugun' : n === 1 ? 'ertaga' : `${n} kun qoldi`;
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap tabular-nums', n < 0 ? 'text-danger' : n === 0 ? 'text-warning' : 'text-ink')}>
      {n < 0 && <TriangleAlert size={16} strokeWidth={1.5} />}
      {date}
      <span className={cn('text-xs', n > 0 && 'text-muted')}>· {hint}</span>
    </span>
  );
};

/** Qatordagi tezkor amal: buyurtmani keyingi bosqichga o‘tkazish */
export const NextStatusButton = ({ o, size = 'small', type }: { o: LabOrderView; size?: 'small' | 'middle'; type?: 'primary' }) => {
  const canManage = usePermission('lab.manage');
  const set = useSetLabStatus();
  const { message } = App.useApp();
  const next = NEXT_STATUS[o.status];
  if (!canManage || !next) return null;
  return (
    <Button
      size={size}
      type={type}
      loading={set.isPending}
      icon={<ArrowRight size={16} strokeWidth={1.5} />}
      iconPosition="end"
      aria-label={`${o.number}: “${LAB_STATUS[next.to].label}” bosqichiga o‘tkazish`}
      onClick={(e) => {
        e.stopPropagation();
        set.mutate(
          { id: o.id, status: next.to },
          {
            onSuccess: () => message.success(`${o.number} — ${LAB_STATUS[next.to].label.toLowerCase()}`),
            onError: (err) => message.error(errorMessage(err)),
          },
        );
      }}
    >
      {next.label}
    </Button>
  );
};
