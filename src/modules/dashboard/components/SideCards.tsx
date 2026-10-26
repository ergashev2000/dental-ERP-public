import { Button, Progress, Skeleton } from 'antd';
import { PackagePlus } from '@/shared/icons';
import { Link } from 'react-router';
import { EmptyState, Panel, StatusTag, UserAvatar } from '@/shared/components/ui';
import { STOCK_STATE } from '@/shared/constants/status';
import { palette } from '@/shared/theme/tokens';
import { formatNumber } from '@/shared/utils/format';
import { useLowStock } from '@/modules/inventory';
import type { DashboardSummary } from '../types';

export const DoctorLoadCard = ({ data }: { data?: DashboardSummary['doctorLoad'] }) => (
  <Panel title="Shifokorlar bandligi">
    {!data ? (
      <Skeleton active paragraph={{ rows: 3 }} />
    ) : !data.length ? (
      <EmptyState compact title="Bugun ishlaydigan shifokor yo‘q" description="Ish jadvalini «Xodimlar» bo‘limida tekshiring" />
    ) : (
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {data.map((d) => (
          <li key={d.doctorId} className="flex items-center gap-3">
            <UserAvatar name={d.name} color={d.color} size={38} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium text-ink">{d.name}</span>
                <span className="shrink-0 text-xs text-muted tabular-nums">{d.count} qabul</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted mb-1">
                <span>{d.specialty || 'Stomatolog'}</span>
                <span className="tabular-nums">{d.loadPct}%</span>
              </div>
              <Progress percent={d.loadPct} size="small" strokeColor={palette.primary[500]} showInfo={false} />
            </div>
          </li>
        ))}
      </ul>
    )}
  </Panel>
);

export const ReminderStatusCard = ({ data }: { data?: DashboardSummary['reminders'] }) => {
  const items = [
    { label: 'Tasdiqladi', value: data?.confirmed ?? 0, cls: 'bg-success' },
    { label: 'Bekor qildi', value: data?.cancelled ?? 0, cls: 'bg-danger' },
    { label: 'Javob bermadi', value: data?.noAnswer ?? 0, cls: 'bg-warning' },
    { label: 'Navbatda', value: data?.pending ?? 0, cls: 'bg-info' },
  ];
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  return (
    <Panel title="Eslatmalar (bugun)">
      {!data ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <>
          <div className="mb-4 flex h-2.5 overflow-hidden rounded-full bg-subtle" aria-hidden>
            {items.map((i) => (
              <span key={i.label} className={i.cls} style={{ width: `${(i.value / total) * 100}%` }} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {items.map((i) => (
              <div key={i.label} className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${i.cls}`} />
                <span className="text-sm text-muted">{i.label}</span>
                <span className="ml-auto tabular-nums">{i.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
};

export const LowStockCard = () => {
  const { data, isLoading } = useLowStock(5);
  return (
    <Panel
      title="Kam qolgan mahsulotlar"
      extra={
        <Link to="/inventory?tab=receipt">
          <Button size="small" icon={<PackagePlus size={14} strokeWidth={1.75} />}>
            Kirim qilish
          </Button>
        </Link>
      }
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : !data?.length ? (
        <EmptyState compact title="Hammasi yetarli" />
      ) : (
        <ul className="m-0 list-none divide-y divide-line-soft p-0">
          {data.map((p) => (
            <li key={p.id}>
              <Link to={`/inventory?product=${p.id}`} className="flex items-center gap-3 py-2.5 text-ink">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted">
                    Qoldiq {formatNumber(p.stock, 2)} {p.unit} · min. {formatNumber(p.minStock)}
                  </div>
                </div>
                <StatusTag meta={STOCK_STATE[p.stock <= 0 ? 'OUT' : 'LOW']} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};
