import { Button, Progress, Skeleton } from 'antd';
import { useState, type ReactNode } from 'react';
import { ArrowRight, CalendarClock, CalendarPlus } from '@/shared/icons';
import { Can, EmptyState, Panel, StatusTag } from '@/shared/components/ui';
import { APPOINTMENT_STATUS } from '@/shared/constants/status';
import { sourceLabel } from '@/shared/constants/options';
import { formatAddress } from '@/shared/constants/regions';
import { formatDate, formatDateTime, formatMoney, formatPhone, formatRelativeDay } from '@/shared/utils/format';
import { useAppointmentParam, useAppointmentsList, useNewAppointment } from '@/modules/appointments';
import { useInvoices } from '@/modules/billing';
import { useTreatmentPlan } from '@/modules/treatments';
import type { PatientTab } from '../hooks/usePatients';
import type { PatientRow } from '../types';

/** Summa: raqam katta, valyuta kichik va xira */
const Money = ({ value, className = '' }: { value: number; className?: string }) => (
  <span className={`tabular-nums whitespace-nowrap ${className}`}>
    {formatMoney(value, false)} <span className="text-[0.55em] text-muted">so‘m</span>
  </span>
);

const Stat = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="min-w-0">
    <div className="text-xs text-muted">{label}</div>
    <div className="mt-1 text-xl font-normal text-ink">{children}</div>
  </div>
);

/** Kartadagi ikkinchi darajali o'tish tugmasi (sarlavha yonida) */
const LinkButton = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <Button type="text" size="small" onClick={onClick} icon={<ArrowRight size={16} strokeWidth={1.5} />} iconPosition="end">
    {children}
  </Button>
);

interface Props {
  patient: PatientRow;
  onOpenTab?: (tab: PatientTab) => void;
}

/** Bemor kartasi → Umumiy: keyingi qabul, balans, davolash rejasi, oxirgi tashriflar va asosiy ma'lumotlar */
export const OverviewTab = ({ patient, onOpenTab }: Props) => {
  const [, openAppointment] = useAppointmentParam();
  const openNew = useNewAppointment((s) => s.show);
  const [nowIso] = useState(() => new Date().toISOString());
  const { data: visits, isLoading } = useAppointmentsList({ patientId: patient.id, pageSize: 50 });
  const { data: invoices } = useInvoices({ patientId: patient.id, pageSize: 100 });
  const { data: plan, isLoading: planLoading } = useTreatmentPlan(patient.id);

  const past = (visits?.items ?? []).filter((a) => a.status === 'COMPLETED').slice(0, 3);
  const next = (visits?.items ?? [])
    .filter((a) => ['SCHEDULED', 'CONFIRMED'].includes(a.status) && a.start > nowIso)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  const billed = (invoices?.items ?? []).filter((i) => i.status !== 'CANCELLED').reduce((s, i) => s + i.total, 0);
  const paid = (invoices?.items ?? []).reduce((s, i) => s + i.paid, 0);

  const planItems = (plan ?? []).filter((i) => i.status !== 'CANCELLED');
  const planDone = planItems.filter((i) => i.status === 'DONE').length;
  const planLeft = planItems.filter((i) => i.status !== 'DONE').reduce((s, i) => s + i.total, 0);
  const planPct = planItems.length ? Math.round((planDone / planItems.length) * 100) : 0;

  const info: { label: string; value: ReactNode }[] = [
    { label: 'Tug‘ilgan sana', value: formatDate(patient.birthDate) },
    { label: 'Telefon', value: <span className="tabular-nums">{formatPhone(patient.phone)}</span> },
    { label: 'Qo‘shimcha telefon', value: patient.phone2 ? <span className="tabular-nums">{formatPhone(patient.phone2)}</span> : '—' },
    { label: 'Manzil', value: formatAddress(patient) },
    { label: 'Qanday bilib kelgan', value: sourceLabel(patient.source) },
    {
      label: 'Qo‘ng‘iroq eslatmasi',
      value: patient.callConsent ? <StatusTag tone="success">Rozi</StatusTag> : <StatusTag tone="danger">Rozilik bermagan</StatusTag>,
    },
    { label: 'Ro‘yxatga olingan', value: formatDate(patient.createdAt) },
    { label: 'Oxirgi tashrif', value: formatDate(patient.lastVisit) },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel title="Keyingi qabul">
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : next ? (
          <button
            type="button"
            onClick={() => void openAppointment(next.id)}
            className="flex w-full cursor-pointer items-center gap-3 rounded-md border-0 bg-lime-soft p-4 text-left text-ink transition-colors hover:bg-subtle"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface">
              <CalendarClock size={20} strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-base font-medium">{formatRelativeDay(next.start)}</div>
              <div className="truncate text-xs text-muted">
                {next.doctorName} · {next.serviceNames.join(', ') || 'Ko‘rik'}
              </div>
            </div>
            <StatusTag meta={APPOINTMENT_STATUS[next.status]} />
          </button>
        ) : (
          <EmptyState
            compact
            icon={CalendarClock}
            title="Rejalashtirilgan qabul yo‘q"
            action={
              <Can perm="appointment.manage">
                <Button icon={<CalendarPlus size={20} strokeWidth={1.5} />} onClick={() => openNew({ patientId: patient.id })}>
                  Qabulga yozish
                </Button>
              </Can>
            }
          />
        )}
      </Panel>

      <Panel title="Balans" extra={onOpenTab && <LinkButton onClick={() => onOpenTab('payments')}>To‘lovlar</LinkButton>}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label="Hisoblangan">
            <Money value={billed} />
          </Stat>
          <Stat label="To‘langan">
            <Money value={paid} />
          </Stat>
          <Stat label="Qarz">
            {patient.debt > 0 ? <Money value={patient.debt} /> : <span className="text-base text-muted">—</span>}
          </Stat>
        </div>
        <div className="mt-4">
          {patient.debt > 0 ? <StatusTag tone="danger">To‘lanmagan qoldiq bor</StatusTag> : <StatusTag tone="success">Qarz yo‘q</StatusTag>}
        </div>
      </Panel>

      <Panel title="Davolash rejasi" extra={onOpenTab && planItems.length > 0 && <LinkButton onClick={() => onOpenTab('plan')}>Rejani ochish</LinkButton>}>
        {planLoading ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : planItems.length ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <Stat label="Bajarildi">
                <span className="tabular-nums">
                  {planDone} <span className="text-[0.55em] text-muted">/ {planItems.length} muolaja</span>
                </span>
              </Stat>
              <Stat label="Qolgan summa">
                <Money value={planLeft} />
              </Stat>
            </div>
            <Progress percent={planPct} showInfo={false} aria-label={`Reja ${planPct}% bajarildi`} />
            <div className="text-xs text-muted">{planPct === 100 ? 'Reja to‘liq bajarilgan' : `Reja ${planPct}% bajarildi`}</div>
          </div>
        ) : (
          <EmptyState
            compact
            title="Davolash rejasi tuzilmagan"
            action={onOpenTab && <Button onClick={() => onOpenTab('plan')}>Rejaga o‘tish</Button>}
          />
        )}
      </Panel>

      <Panel title="Oxirgi tashriflar" extra={onOpenTab && past.length > 0 && <LinkButton onClick={() => onOpenTab('visits')}>Barchasi</LinkButton>}>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : !past.length ? (
          <EmptyState compact title="Yakunlangan tashriflar yo‘q" description="Qabul yakunlangach shu yerda ko‘rinadi" />
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {past.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => void openAppointment(v.id)}
                  className="flex w-full cursor-pointer flex-col gap-0.5 rounded-md border-0 bg-transparent px-3 py-2.5 text-left text-ink transition-colors hover:bg-subtle"
                >
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="font-medium tabular-nums">{formatDateTime(v.start)}</span>
                    <span className="text-xs text-muted">{v.doctorName}</span>
                  </span>
                  <span className="truncate text-sm">{v.serviceNames.join(', ') || 'Ko‘rik'}</span>
                  {(v.doctorNote || v.note) && <span className="line-clamp-2 text-xs text-muted">{v.doctorNote ?? v.note}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Asosiy ma’lumotlar" className="md:col-span-2">
        <dl className="m-0 grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
          {info.map((it) => (
            <div key={it.label} className="min-w-0">
              <dt className="text-xs text-muted">{it.label}</dt>
              <dd className="m-0 mt-1 break-words text-sm text-ink">{it.value}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  );
};
