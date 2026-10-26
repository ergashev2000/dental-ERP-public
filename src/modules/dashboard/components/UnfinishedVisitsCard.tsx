import { Button, Skeleton } from 'antd';
import { CircleCheck, PanelsTopLeft } from '@/shared/icons';
import { useNavigate } from 'react-router';
import { EmptyState, Panel, StatusTag } from '@/shared/components/ui';
import { ROUTES } from '@/shared/constants/routes';
import { formatRelativeDay } from '@/shared/utils/format';
import { useAppointmentParam } from '@/modules/appointments';
import { useDashboardDay } from '../hooks/useDashboard';

/** Shifokor: vaqti o'tgan, lekin yakunlanmagan yoki holati belgilanmagan tashriflar */
export const UnfinishedVisitsCard = () => {
  const { data, isLoading } = useDashboardDay();
  const [, open] = useAppointmentParam();
  const navigate = useNavigate();
  const items = data?.unfinished ?? [];

  return (
    <Panel
      title="Yakunlanmagan tashriflar"
      extra={items.length > 0 && <StatusTag tone="warning">{items.length} ta</StatusTag>}
      bodyClassName="p-2 pt-3 md:p-3"
    >
      {isLoading ? (
        <div className="p-3">
          <Skeleton active paragraph={{ rows: 3 }} />
        </div>
      ) : !items.length ? (
        <EmptyState compact icon={CircleCheck} title="Hammasi yakunlangan" description="Ochiq qolgan tashrif yo‘q" />
      ) : (
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
          {items.map((v) => (
            <li
              key={v.id}
              role="button"
              tabIndex={0}
              onClick={() => void open(v.id)}
              onKeyDown={(e) => e.key === 'Enter' && void open(v.id)}
              className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-colors duration-150 hover:bg-subtle"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-ink">{v.patientName}</div>
                <div className="truncate text-xs text-muted">
                  {formatRelativeDay(v.start)} · {v.serviceNames.join(', ')}
                </div>
              </div>
              {v.reason === 'open' ? (
                <Button
                  size="small"
                  icon={<PanelsTopLeft size={16} strokeWidth={1.5} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(ROUTES.visit(v.id));
                  }}
                >
                  Davom ettirish
                </Button>
              ) : (
                <StatusTag tone="neutral">Belgilanmagan</StatusTag>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};
