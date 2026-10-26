import { App, Badge, Button, Drawer, Segmented } from 'antd';
import { CalendarPlus, Globe, Hourglass, Send, X } from '@/shared/icons';
import { useState } from 'react';
import { EmptyState, PhoneText, StatusTag } from '@/shared/components/ui';
import dayjs from '@/shared/lib/dayjs';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { formatDate } from '@/shared/utils/format';
import { useOnlineRequests, useResolveOnline, useResolveWaitlist, useWaitlist } from '../../hooks/useBooking';
import { useNewAppointment } from '../../store/appointmentModalStore';
import type { OnlineRequest, WaitlistEntry } from '../../types';

type Tab = 'online' | 'waitlist';

const ago = (iso: string) => {
  const min = dayjs().diff(dayjs(iso), 'minute');
  if (min < 60) return `${Math.max(1, min)} daqiqa oldin`;
  const h = Math.round(min / 60);
  return h < 24 ? `${h} soat oldin` : formatDate(iso);
};

const Card = ({ children }: { children: React.ReactNode }) => <li className="flex flex-col gap-2 rounded-md bg-subtle p-3">{children}</li>;

const OnlineItem = ({ o, onBook }: { o: OnlineRequest; onBook: () => void }) => {
  const resolve = useResolveOnline();
  const { message } = App.useApp();
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 leading-tight">
          <div className="truncate font-medium">{o.name}</div>
          <PhoneText phone={o.phone} className="text-xs" />
        </div>
        <StatusTag tone={o.channel === 'TELEGRAM' ? 'info' : 'neutral'} dot={false}>
          {o.channel === 'TELEGRAM' ? 'Telegram' : 'Sayt'}
        </StatusTag>
      </div>
      <div className="text-sm">
        {formatDate(o.preferredDate)}
        {o.preferredTime && `, ${o.preferredTime}`}
        {o.serviceName && <span className="text-muted"> · {o.serviceName}</span>}
      </div>
      {o.note && <div className="text-sm text-muted">{o.note}</div>}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto text-xs text-muted">
          {ago(o.createdAt)}
          {o.patientId && ' · mavjud bemor'}
        </span>
        <Button
          size="small"
          type="text"
          icon={<X size={16} strokeWidth={1.5} />}
          loading={resolve.isPending}
          onClick={() => resolve.mutate({ id: o.id, status: 'DECLINED' }, { onSuccess: () => message.info('So‘rov rad etildi'), onError: (e) => message.error(errorMessage(e)) })}
        >
          Rad etish
        </Button>
        <Button size="small" type="primary" icon={<CalendarPlus size={16} strokeWidth={1.5} />} onClick={onBook}>
          Qabulga yozish
        </Button>
      </div>
    </Card>
  );
};

const WaitItem = ({ w, onBook }: { w: WaitlistEntry; onBook: () => void }) => {
  const resolve = useResolveWaitlist();
  const { message } = App.useApp();
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 leading-tight">
          <div className="truncate font-medium">{w.patientName}</div>
          <PhoneText phone={w.patientPhone} className="text-xs" />
        </div>
        <span className="text-xs text-muted tabular-nums">
          {formatDate(w.from)} – {formatDate(w.to)}
        </span>
      </div>
      <div className="text-sm">
        {w.serviceNames.join(', ')}
        {w.doctorName && <span className="text-muted"> · {w.doctorName}</span>}
      </div>
      {w.note && <div className="text-sm text-muted">{w.note}</div>}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          size="small"
          type="text"
          icon={<X size={16} strokeWidth={1.5} />}
          onClick={() => resolve.mutate({ id: w.id, status: 'REMOVED' }, { onSuccess: () => message.info('Ro‘yxatdan olindi'), onError: (e) => message.error(errorMessage(e)) })}
        >
          Olib tashlash
        </Button>
        <Button
          size="small"
          icon={<Send size={16} strokeWidth={1.5} />}
          onClick={() => message.success(`${w.patientName}ga bo‘sh vaqt haqida SMS yuborildi (simulyatsiya)`)}
        >
          Taklif yuborish
        </Button>
        <Button size="small" type="primary" icon={<CalendarPlus size={16} strokeWidth={1.5} />} onClick={onBook}>
          Vaqt topish
        </Button>
      </div>
    </Card>
  );
};

/** Qabullar sahifasidagi "So'rovlar" tugmasi: onlayn so'rovlar va kutish ro'yxati bitta oynada */
export const BookingInbox = () => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('online');
  const isMobile = useIsMobile();
  const show = useNewAppointment((s) => s.show);
  const { data: online = [] } = useOnlineRequests();
  const { data: waitlist = [] } = useWaitlist();
  const total = online.length + waitlist.length;

  const bookOnline = (o: OnlineRequest) => {
    setOpen(false);
    show({
      patientId: o.patientId,
      search: o.patientId ? undefined : o.phone,
      newPatientName: o.patientId ? undefined : o.name,
      serviceIds: o.serviceId ? [o.serviceId] : undefined,
      date: dayjs(o.preferredDate).isBefore(dayjs(), 'day') ? undefined : o.preferredDate,
      note: o.note,
      source: 'OTHER',
      onlineRequestId: o.id,
    });
  };

  const bookWait = (w: WaitlistEntry) => {
    setOpen(false);
    show({
      patientId: w.patientId,
      serviceIds: w.serviceIds,
      doctorId: w.doctorId,
      date: dayjs(w.from).isBefore(dayjs(), 'day') ? undefined : w.from,
      note: w.note,
      waitlistId: w.id,
    });
  };

  return (
    <>
      <Badge count={total} size="small" offset={[-6, 4]}>
        <Button icon={<Globe size={18} strokeWidth={1.5} />} onClick={() => setOpen(true)} className="bg-surface">
          So‘rovlar
        </Button>
      </Badge>
      <Drawer open={open} onClose={() => setOpen(false)} width={isMobile ? '100%' : 440} title="So‘rovlar va kutish ro‘yxati">
        <div className="flex flex-col gap-4">
          <Segmented<Tab>
            block
            value={tab}
            onChange={setTab}
            options={[
              { value: 'online', label: `Onlayn so‘rovlar · ${online.length}` },
              { value: 'waitlist', label: `Kutish ro‘yxati · ${waitlist.length}` },
            ]}
          />
          {tab === 'online' &&
            (online.length ? (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {online.map((o) => (
                  <OnlineItem key={o.id} o={o} onBook={() => bookOnline(o)} />
                ))}
              </ul>
            ) : (
              <EmptyState icon={Globe} title="Yangi so‘rov yo‘q" description="Telegram bot va sayt orqali yozilganlar shu yerda chiqadi" />
            ))}
          {tab === 'waitlist' &&
            (waitlist.length ? (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {waitlist.map((w) => (
                  <WaitItem key={w.id} w={w} onBook={() => bookWait(w)} />
                ))}
              </ul>
            ) : (
              <EmptyState icon={Hourglass} title="Kutish ro‘yxati bo‘sh" description="Mos vaqt topilmaganda bemorni yangi qabul oynasidan shu yerga qo‘shasiz" />
            ))}
        </div>
      </Drawer>
    </>
  );
};
