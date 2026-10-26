import { App, Button, DatePicker, Descriptions, Drawer, Input, Timeline } from 'antd';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ExternalLink, Pencil, RotateCcw } from '@/shared/icons';
import { MoneyText, PhoneText, StatusTag } from '@/shared/components/ui';
import { ROUTES } from '@/shared/constants/routes';
import { usePermission } from '@/shared/hooks/usePermission';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { formatDate, formatDateTime } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import { CAN_REMAKE, LAB_STATUS, LAB_WORK_TYPE, teethLabel } from '../constants';
import { useSetLabStatus } from '../hooks/useLab';
import type { LabOrderView } from '../types';
import { LabDueText, NextStatusButton } from './LabBits';

interface Props {
  order?: LabOrderView;
  onClose: () => void;
  onEdit: (o: LabOrderView) => void;
  /** Bemor kartasidan ochilganda "Bemor kartasi" havolasi kerak emas */
  hidePatientLink?: boolean;
}

const TIMELINE_DOT: Record<string, string> = {
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-neutral-400',
  primary: 'bg-ink',
};

/** Buyurtma tafsilotlari: ma'lumot, bosqich amallari va status tarixi */
export const LabOrderDetailDrawer = ({ order: o, onClose, onEdit, hidePatientLink }: Props) => {
  const isMobile = useIsMobile();
  const canManage = usePermission('lab.manage');
  const navigate = useNavigate();
  const set = useSetLabStatus();
  const { message } = App.useApp();
  const [remake, setRemake] = useState<{ note: string; due: Dayjs | null } | null>(null);

  const close = () => {
    setRemake(null);
    onClose();
  };

  const sendRemake = () => {
    if (!o || !remake) return;
    set.mutate(
      { id: o.id, status: 'REMAKE', note: remake.note, dueDate: remake.due?.format('YYYY-MM-DD') },
      {
        onSuccess: () => {
          message.success('Buyurtma qayta ishlashga qaytarildi');
          setRemake(null);
        },
        onError: (e) => message.error(errorMessage(e)),
      },
    );
  };

  return (
    <Drawer
      open={!!o}
      onClose={close}
      width={isMobile ? '100%' : 480}
      title={o ? `Buyurtma ${o.number}` : ''}
      destroyOnHidden
      footer={
        o &&
        canManage && (
          <div className="flex flex-wrap justify-end gap-2">
            <Button icon={<Pencil size={16} strokeWidth={1.5} />} onClick={() => onEdit(o)}>
              Tahrirlash
            </Button>
            <NextStatusButton o={o} size="middle" type="primary" />
          </div>
        )
      }
    >
      {o && (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-2xl font-normal text-ink">{o.patientName}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                  <span>{o.patientCardNo}</span>
                  {o.patientPhone && <PhoneText phone={o.patientPhone} />}
                </div>
              </div>
              <StatusTag meta={LAB_STATUS[o.status]} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex h-7.5 items-center rounded-pill bg-subtle px-3 text-xs">{LAB_WORK_TYPE[o.workType]}</span>
              <span className="inline-flex h-7.5 items-center rounded-pill bg-subtle px-3 text-xs tabular-nums">Tishlar: {teethLabel(o.teeth)}</span>
              {o.shade && <span className="inline-flex h-7.5 items-center rounded-pill bg-subtle px-3 text-xs">Rang {o.shade}</span>}
            </div>
            {!hidePatientLink && (
              <Button
                type="link"
                className="self-start px-0!"
                icon={<ExternalLink size={16} strokeWidth={1.5} />}
                onClick={() => {
                  close();
                  navigate(ROUTES.patient(o.patientId));
                }}
              >
                Bemor kartasini ochish
              </Button>
            )}
          </section>

          <Descriptions
            column={1}
            size="small"
            items={[
              { key: 'due', label: 'Qaytish muddati', children: <LabDueText o={o} full /> },
              { key: 'lab', label: 'Laboratoriya', children: o.labName },
              { key: 'doc', label: 'Shifokor', children: o.doctorName },
              { key: 'sent', label: 'Yuborilgan', children: o.sentDate ? formatDate(o.sentDate) : 'Hali yuborilmagan' },
              ...(o.returnedAt ? [{ key: 'ret', label: 'Qaytgan', children: formatDateTime(o.returnedAt) }] : []),
              { key: 'price', label: 'Narx', children: <MoneyText value={o.price} /> },
              ...(o.note ? [{ key: 'note', label: 'Izoh', children: <span className="whitespace-pre-line">{o.note}</span> }] : []),
            ]}
          />

          {canManage && CAN_REMAKE.includes(o.status) && (
            <section className="flex flex-col gap-3 rounded-md bg-subtle p-4">
              {remake ? (
                <>
                  <div className="text-sm text-ink">Qayta ishlash sababi</div>
                  <Input.TextArea
                    autoFocus
                    rows={2}
                    value={remake.note}
                    placeholder="Masalan, rang mos kelmadi yoki kontakt nuqtasi yo‘q"
                    className="bg-surface"
                    onChange={(e) => setRemake({ ...remake, note: e.target.value })}
                  />
                  <DatePicker
                    format="DD.MM.YYYY"
                    placeholder="Yangi muddat (ixtiyoriy)"
                    className="w-full bg-surface"
                    value={remake.due}
                    onChange={(due) => setRemake({ ...remake, due })}
                  />
                  <div className="flex justify-end gap-2">
                    <Button className="bg-surface" onClick={() => setRemake(null)}>
                      Bekor qilish
                    </Button>
                    <Button type="primary" danger loading={set.isPending} disabled={!remake.note.trim()} onClick={sendRemake}>
                      Qayta ishlashga
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted">Ish mos kelmadimi?</span>
                  <Button className="bg-surface" icon={<RotateCcw size={16} strokeWidth={1.5} />} onClick={() => setRemake({ note: '', due: null })}>
                    Qayta ishlashga
                  </Button>
                </div>
              )}
            </section>
          )}

          <section>
            <h4 className="m-0 mb-4 text-base font-medium">Status tarixi</h4>
            <Timeline
              items={[...o.history].reverse().map((h, i) => ({
                key: `${h.at}-${i}`,
                dot: <span className={cn('block size-2.5 rounded-full', TIMELINE_DOT[LAB_STATUS[h.status].tone])} />,
                children: (
                  <div className="leading-tight">
                    <div className="text-sm text-ink">{LAB_STATUS[h.status].label}</div>
                    <div className="mt-0.5 text-xs text-muted">
                      {formatDateTime(h.at)} · {h.byName}
                    </div>
                    {h.note && <div className="mt-1 text-sm text-muted">{h.note}</div>}
                  </div>
                ),
              }))}
            />
          </section>
        </div>
      )}
    </Drawer>
  );
};
