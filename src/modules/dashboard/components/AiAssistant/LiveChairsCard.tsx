import { Skeleton } from 'antd';
import { Building2 } from '@/shared/icons';
import { EmptyState, Panel, StatusTag } from '@/shared/components/ui';
import { formatTime } from '@/shared/utils/format';
import { useAppointmentParam } from '@/modules/appointments';
import { useDashboardDay } from '../../hooks/useDashboard';

/** Kreslolar hozirgi holati: kim kresloda, keyingisi kim (real vaqt, 15 soniyada yangilanadi) */
export const LiveChairsCard = () => {
  const { data, isLoading } = useDashboardDay();
  const [, open] = useAppointmentParam();
  const chairs = data?.chairs ?? [];

  return (
    <Panel
      title="Kreslolar"
      extra={
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <span className="pulse-dot size-2 rounded-full bg-success" />
          Real vaqt
        </span>
      }
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : !chairs.length ? (
        <EmptyState compact icon={Building2} title="Faol kreslo yo‘q" description="Kreslolarni «Sozlamalar»da qo‘shing" />
      ) : (
        <div className="flex flex-col gap-2 rounded-sheet bg-panel p-2">
          {chairs.map((c) => {
            const v = c.current ?? c.next;
            return (
              <div
                key={c.id}
                role={v ? 'button' : undefined}
                tabIndex={v ? 0 : undefined}
                onClick={() => v && void open(v.id)}
                onKeyDown={(e) => v && e.key === 'Enter' && void open(v.id)}
                className="flex items-center justify-between gap-3 rounded-card bg-surface p-3.5 transition-colors duration-150 hover:bg-neutral-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-subtle text-ink">
                    <Building2 size={20} strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">{c.name}</div>
                    <div className="truncate text-xs text-muted">
                      {c.current
                        ? `${c.current.patientName} · ${c.current.doctorName}`
                        : c.next
                          ? `Keyingi: ${c.next.patientName}, ${formatTime(c.next.start)}`
                          : 'Bugun boshqa qabul yo‘q'}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {c.current ? (
                    <StatusTag tone="primary">Qabulda</StatusTag>
                  ) : (
                    <StatusTag tone="success">Bo‘sh</StatusTag>
                  )}
                  {c.left > 0 && <span className="text-xs text-muted tabular-nums">yana {c.left} ta</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
};
