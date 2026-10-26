import { Skeleton } from 'antd';
import { History } from '@/shared/icons';
import { EmptyState } from '@/shared/components/ui';
import { formatDateTime } from '@/shared/utils/format';
import { useToothHistory } from '../hooks/useChart';

/** Tish bo'yicha tarix: kim, qachon, avvalgi → yangi holat */
export const ToothHistoryList = ({ patientId, tooth }: { patientId: string; tooth?: number }) => {
  const { data = [], isLoading } = useToothHistory(patientId, tooth);
  if (isLoading) return <Skeleton active paragraph={{ rows: 3 }} />;
  if (!data.length) return <EmptyState compact icon={History} title="Tarix yo‘q" description="Bu tish bo‘yicha o‘zgarishlar hali kiritilmagan" />;
  return (
    <ol className="m-0 list-none space-y-0 p-0">
      {data.map((h) => (
        <li key={h.id} className="relative border-l border-line pb-4 pl-4 last:pb-0">
          <span className="absolute -left-[5px] top-1 size-2.5 rounded-full border-2 border-surface bg-primary-400" />
          <div className="text-sm font-medium text-ink">{h.action}</div>
          <div className="text-xs text-muted">
            {formatDateTime(h.createdAt)} · {h.doctorName}
            {tooth === undefined && ` · ${h.tooth}-tish`}
          </div>
          {(h.oldValue || h.newValue) && (
            <div className="mt-1 text-xs text-muted">
              {h.oldValue && <span className="line-through decoration-neutral-300">{h.oldValue}</span>}
              {h.oldValue && h.newValue && ' → '}
              {h.newValue && <span className="font-medium">{h.newValue}</span>}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
};
