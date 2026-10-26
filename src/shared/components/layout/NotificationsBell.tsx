import { Badge, Button, Popover } from 'antd';
import { Bell, CalendarClock, Check, PackageX, PhoneMissed, PhoneOff, Smile, UserRoundCog, Wallet } from '@/shared/icons';
import type { AppIcon } from '@/shared/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import dayjs from '@/shared/lib/dayjs';
import { useDismissNotification, useNotifications, type NotificationKind } from '@/modules/dashboard';
import { EmptyState } from '../ui/States';

const KIND: Record<NotificationKind, { icon: AppIcon; cls: string }> = {
  LOW_STOCK: { icon: PackageX, cls: 'bg-warning-soft text-warning' },
  UNCONFIRMED: { icon: CalendarClock, cls: 'bg-info-soft text-info' },
  CALL_FAILED: { icon: PhoneOff, cls: 'bg-danger-soft text-danger' },
  CALL_CANCELLED: { icon: PhoneMissed, cls: 'bg-danger-soft text-danger' },
  OPERATOR: { icon: UserRoundCog, cls: 'bg-warning-soft text-warning' },
  PAYMENT_DUE: { icon: Wallet, cls: 'bg-primary-50 text-primary-600' },
  ORTHO_OVERDUE: { icon: Smile, cls: 'bg-danger-soft text-danger' },
};

const DISMISSABLE: NotificationKind[] = ['CALL_FAILED', 'CALL_CANCELLED', 'OPERATOR'];

export const NotificationsBell = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data = [] } = useNotifications();
  const dismiss = useDismissNotification();

  const content = (
    <div className="w-[min(380px,calc(100vw-32px))]">
      <div className="flex items-center justify-between px-1 pb-3">
        <span className="text-base font-medium">Bildirishnomalar</span>
        <span className="text-xs text-muted">{data.length} ta</span>
      </div>
      {data.length === 0 ? (
        <EmptyState compact icon={Bell} title="Yangi bildirishnoma yo‘q" />
      ) : (
        <ul className="m-0 max-h-[420px] list-none space-y-1 overflow-y-auto p-0">
          {data.map((n) => {
            const k = KIND[n.kind];
            return (
              <li key={n.id} className="group flex items-start gap-3 rounded-md p-2.5 transition-colors duration-150 hover:bg-neutral-50">
                <span className={`grid size-9 shrink-0 place-items-center rounded-sm ${k.cls}`}>
                  <k.icon size={18} strokeWidth={1.75} />
                </span>
                <button
                  type="button"
                  className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent p-0 text-left"
                  onClick={() => {
                    setOpen(false);
                    navigate(n.link);
                  }}
                >
                  <div className="text-sm font-semibold text-ink">{n.title}</div>
                  <div className="text-xs text-muted">{n.description}</div>
                  {DISMISSABLE.includes(n.kind) && <div className="mt-0.5 text-xs text-neutral-400">{dayjs(n.at).fromNow()}</div>}
                </button>
                {DISMISSABLE.includes(n.kind) && (
                  <Button
                    type="text"
                    size="small"
                    aria-label="Bajarildi"
                    icon={<Check size={16} strokeWidth={1.75} />}
                    onClick={() => dismiss.mutate(n.id)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen} trigger="click" placement="bottomRight" content={content} arrow={false}>
      <Badge count={data.length} size="small" offset={[-4, 4]} color="var(--color-danger)">
        <Button
          aria-label="Bildirishnomalar"
          icon={<Bell size={20} strokeWidth={1.5} />}
          shape="circle"
          className="bg-surface"
        />
      </Badge>
    </Popover>
  );
};
