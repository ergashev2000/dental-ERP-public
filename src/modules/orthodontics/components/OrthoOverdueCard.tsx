import { Button, Skeleton } from 'antd';
import { ArrowRight, Smile } from '@/shared/icons';
import { Link } from 'react-router';
import { Can, EmptyState, Panel, StatusTag, UserAvatar } from '@/shared/components/ui';
import { ROUTES } from '@/shared/constants/routes';
import { useOrthoCases } from '../hooks/useOrtho';
import { AutoCallButton } from './AutoCallButton';

/** Bosh sahifa: korreksiyasi kechikkan breketli bemorlar (eng ko'p kechikkanlar tepada) */
export const OrthoOverdueCard = () => {
  const { data = [], isLoading } = useOrthoCases({ overdue: true });
  return (
    <Panel
      title="Breket: kechikkanlar"
      extra={
        <Link to={`${ROUTES.ortho}?overdue=true`}>
          <Button size="small" type="text" icon={<ArrowRight size={16} strokeWidth={1.5} />} iconPosition="end" tabIndex={-1}>
            Hammasi
          </Button>
        </Link>
      }
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : !data.length ? (
        <EmptyState compact icon={Smile} title="Hamma o‘z vaqtida kelmoqda" description="Breketli bemorlarning barchasi qabulga yozilgan yoki muddati hali kelmagan" />
      ) : (
        <>
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {data.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link to={ROUTES.orthoCase(c.id)} className="flex items-center gap-3 rounded-md px-2 py-2 text-ink transition-colors duration-150 hover:bg-subtle">
                  <UserAvatar name={c.patientName} size={32} />
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate text-sm">{c.patientName}</div>
                    <div className="truncate text-xs text-muted" title={c.lastContact?.note}>
                      {c.lastContact ? `Qo‘ng‘iroq: ${c.lastContact.note}` : 'Hali qo‘ng‘iroq qilinmagan'}
                    </div>
                  </div>
                  <span title={`${c.daysSinceVisit} kundan beri kelmagan`}>
                    <StatusTag tone="danger">{c.overdueDays} kun kechikdi</StatusTag>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Can perm="ortho.manage">
            <AutoCallButton block className="mt-3" ids={data.map((c) => c.id)} label={`Hammasiga avtomatik qo‘ng‘iroq (${data.length})`} />
          </Can>
        </>
      )}
    </Panel>
  );
};
