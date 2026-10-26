import { App, Button, Image, Progress, Tooltip } from 'antd';
import { CalendarPlus, CircleCheck, ExternalLink, Pencil, PhoneCall, Plus, Wallet } from '@/shared/icons';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { Can, CardSkeleton, EmptyState, ErrorState, MedicalAlert, PageHeader, Panel, PhoneText, StatusTag, UserAvatar } from '@/shared/components/ui';
import { ORTHO_APPLIANCE, ORTHO_JAW, ORTHO_STAGE, ORTHO_STATUS } from '@/shared/constants/status';
import { ROUTES } from '@/shared/constants/routes';
import { usePermission } from '@/shared/hooks/usePermission';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import dayjs from '@/shared/lib/dayjs';
import { cn } from '@/shared/utils/cn';
import { formatAge, formatDate, formatRelativeDay } from '@/shared/utils/format';
import { useAppointmentParam, useNewAppointment } from '@/modules/appointments';
import { usePaymentModal } from '@/modules/billing';
import { usePatient } from '@/modules/patients';
import { ContactModal } from '../components/ContactModal';
import { OrthoCaseFormDrawer } from '../components/OrthoCaseFormDrawer';
import { Chip, Money, StageSteps } from '../components/OrthoBits';
import { OrthoVisitModal } from '../components/OrthoVisitModal';
import { useOrthoCase, useSetOrthoStage } from '../hooks/useOrtho';
import { ORTHO_STAGES, type OrthoPhoto, type OrthoStage } from '../types';

const PHOTO_LABEL: Record<OrthoPhoto['kind'], string> = { BEFORE: 'Oldin', PROGRESS: 'Jarayon', AFTER: 'Keyin' };

/** Tashriflar tarixida dastlab ko'rsatiladigan soni */
const VISITS_PREVIEW = 6;

/** Kalit-qiymat qatori (Eslatish, To'lov kartalari) */
const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <li className="flex min-h-9 items-center justify-between gap-3 text-sm">
    <span className="text-muted">{label}</span>
    <span className="text-right">{children}</span>
  </li>
);

/** Bitta bemorning breket davolashi: bosqichlar, korreksiyalar, to'lov rejasi, eslatish */
export const OrthoCasePage = () => {
  const { id = '' } = useParams();
  const { message, modal } = App.useApp();
  const { data: c, isLoading, isError, error, refetch } = useOrthoCase(id);
  const { data: patient } = usePatient(c?.patientId ?? null);
  const canManage = usePermission('ortho.manage');
  const setStage = useSetOrthoStage();
  const openNew = useNewAppointment((s) => s.show);
  const openPayment = usePaymentModal((s) => s.show);
  const [, openAppointment] = useAppointmentParam();
  const [editing, setEditing] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [contact, setContact] = useState(false);
  const [allVisits, setAllVisits] = useState(false);

  const title = c?.patientName ?? 'Breket davolashi';
  const crumbs = [{ label: 'Breketlar', to: ROUTES.ortho }, { label: title }];

  if (isLoading)
    return (
      <>
        <PageHeader title={title} breadcrumb={crumbs} />
        <CardSkeleton rows={8} />
      </>
    );
  if (isError || !c)
    return (
      <>
        <PageHeader title={title} breadcrumb={crumbs} />
        <ErrorState error={error} onRetry={() => void refetch()} />
      </>
    );

  const finished = c.status === 'FINISHED';
  const monthsIn = Math.max(0, dayjs().diff(dayjs(c.startDate), 'month'));
  const monthsPct = Math.min(100, Math.round((monthsIn / Math.max(1, c.plannedMonths)) * 100));
  const stageIdx = ORTHO_STAGES.indexOf(c.stage);
  const photos = c.visits.flatMap((v) => v.photos.map((ph) => ({ ...ph, date: v.date })));
  const before = [...photos].reverse().find((ph) => ph.kind === 'BEFORE');
  const after = photos.find((ph) => ph.kind === 'AFTER' || ph.kind === 'PROGRESS');
  const today = dayjs().startOf('day');
  const visits = allVisits ? c.visits : c.visits.slice(0, VISITS_PREVIEW);
  const book = () => openNew({ patientId: c.patientId, doctorId: c.doctorId });

  const pickStage = (s: OrthoStage) => {
    if (s === c.stage) return;
    modal.confirm({
      title: `Bosqich: «${ORTHO_STAGE[s].label}»`,
      content: 'Davolash shu bosqichga o‘tkazilsinmi?',
      okText: 'Ha, o‘tkazish',
      cancelText: 'Yopish',
      onOk: () =>
        setStage.mutateAsync({ id: c.id, stage: s }).then(
          () => message.success('Bosqich yangilandi'),
          (e: unknown) => message.error(errorMessage(e)),
        ),
    });
  };

  return (
    <>
      <PageHeader title={title} breadcrumb={crumbs} />

      {/* Sarlavha kartasi: bemor, apparat, jag', bosqich + asosiy amal */}
      <section className="mb-4 flex flex-col gap-5 rounded-card bg-surface p-5">
        <div className="flex flex-wrap items-start gap-4">
          <UserAvatar name={c.patientName} size={56} />
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-2xl font-normal leading-tight text-ink">{c.patientName}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              {patient?.birthDate && <span>{formatAge(patient.birthDate)}</span>}
              <PhoneText phone={c.patientPhone} className="text-ink" />
              {patient?.guardian && <span>Vasiy: {patient.guardian.name}</span>}
              <span>{c.doctorName}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <StatusTag meta={ORTHO_STATUS[c.status]} />
              <Chip>{ORTHO_APPLIANCE[c.appliance]}</Chip>
              <Chip>{ORTHO_JAW[c.jaw]}</Chip>
              <Chip>
                {ORTHO_STAGE[c.stage].label}
                <span className="tabular-nums text-muted">
                  {stageIdx + 1}/{ORTHO_STAGES.length}
                </span>
              </Chip>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Can perm="ortho.visit">
              <Button type="primary" icon={<Plus size={18} strokeWidth={1.5} />} onClick={() => setVisitOpen(true)} disabled={finished} className="flex-1 sm:flex-none">
                Korreksiya yozish
              </Button>
            </Can>
            <Can perm="appointment.manage">
              <Tooltip title="Qabulga yozish">
                <Button shape="circle" icon={<CalendarPlus size={20} strokeWidth={1.5} />} onClick={book} aria-label="Qabulga yozish" />
              </Tooltip>
            </Can>
            <Can perm="ortho.manage">
              <Tooltip title="Tahrirlash">
                <Button shape="circle" icon={<Pencil size={20} strokeWidth={1.5} />} onClick={() => setEditing(true)} aria-label="Tahrirlash" />
              </Tooltip>
            </Can>
            <Tooltip title="Bemor kartasi">
              <Link to={ROUTES.patient(c.patientId)} aria-label="Bemor kartasi">
                <Button shape="circle" icon={<ExternalLink size={20} strokeWidth={1.5} />} tabIndex={-1} />
              </Link>
            </Tooltip>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="text-xs text-muted">Davolash muddati</div>
            <div className="flex items-baseline gap-1 text-xl tabular-nums">
              {monthsIn} <span className="text-sm text-muted">/ {c.plannedMonths} oy</span>
            </div>
            <Progress percent={monthsPct} showInfo={false} size="small" className="m-0!" />
            <div className="text-xs text-muted">Boshlangan {formatDate(c.startDate)}</div>
          </div>
          <div>
            <div className="text-xs text-muted">Keyingi korreksiya</div>
            <div className="text-xl tabular-nums">{c.nextAppointment ? formatRelativeDay(c.nextAppointment) : formatDate(c.dueDate)}</div>
            <div className="mt-1">
              {finished ? (
                <span className="text-xs text-muted">Davolash tugagan</span>
              ) : c.nextAppointment ? (
                <StatusTag tone="info">Qabulga yozilgan</StatusTag>
              ) : c.overdueDays > 0 ? (
                <StatusTag tone="danger">{c.overdueDays} kun kechikdi</StatusTag>
              ) : (
                <StatusTag tone="warning">Hali yozilmagan</StatusTag>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted">Qolgan qarz</div>
            <div className="text-xl">{c.remaining > 0 ? <Money value={c.remaining} /> : <span className="text-muted">Qarz yo‘q</span>}</div>
            {c.paymentOverdue && (
              <div className="mt-1">
                <StatusTag tone="warning">To‘lov kechikdi</StatusTag>
              </div>
            )}
          </div>
        </div>

        {c.note && <div className="rounded-md bg-subtle px-4 py-3 text-sm">{c.note}</div>}
        {patient && <MedicalAlert patient={patient} />}
      </section>

      {c.overdueDays > 0 && (
        <section className="mb-4 flex flex-wrap items-center gap-4 rounded-card bg-surface p-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-danger-soft text-danger">
            <PhoneCall size={20} strokeWidth={1.5} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base text-ink">{c.daysSinceVisit} kundan beri kelmagan</span>
              <StatusTag tone="danger">Korreksiya kechikdi</StatusTag>
            </div>
            <div className="mt-1 text-sm text-muted">
              Oxirgi tashrif {formatDate(c.lastVisit)}. Har {c.visitIntervalDays} kunda kelishi kerak — muddat {formatDate(c.dueDate)} da o‘tgan.
              {c.lastContact && ` Oxirgi qo‘ng‘iroq (${formatDate(c.lastContact.at)}): ${c.lastContact.note}.`}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Can perm="ortho.manage">
              <Button icon={<PhoneCall size={18} strokeWidth={1.5} />} onClick={() => setContact(true)}>
                Qo‘ng‘iroq natijasi
              </Button>
            </Can>
            <Can perm="appointment.manage">
              <Button icon={<CalendarPlus size={18} strokeWidth={1.5} />} onClick={book}>
                Qabulga yozish
              </Button>
            </Can>
          </div>
        </section>
      )}

      <Panel
        title="Davolash bosqichlari"
        className="mb-4"
        extra={canManage && !finished ? <span className="text-xs text-muted">O‘zgartirish uchun bosqichni bosing</span> : null}
      >
        <StageSteps stage={c.stage} finished={finished} onPick={canManage && !finished ? pickStage : undefined} />
      </Panel>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title={`Korreksiyalar (${c.visits.length})`}>
            {!c.visits.length ? (
              <EmptyState
                compact
                title="Hali korreksiya yozilmagan"
                description="Har bir tashrifdan keyin «Korreksiya yozish» ni bosing: duga, ligatura, nima qilindi va rasm"
              />
            ) : (
              <>
                <ol className="m-0 list-none p-0">
                  {visits.map((v, i) => (
                    <li key={v.id} className="group relative pb-5 pl-7 last:pb-0">
                      {/* vaqt chizig'i: nuqta + vertikal chiziq */}
                      <span className="absolute left-[7px] top-5 bottom-0 w-px bg-line group-last:hidden" aria-hidden />
                      <span className={cn('absolute left-0 top-1 size-[15px] rounded-full ring-4 ring-surface', i === 0 ? 'bg-ink' : 'bg-neutral-300')} aria-hidden />
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-medium tabular-nums text-ink">{formatDate(v.date)}</span>
                        <Chip className="h-6">{ORTHO_STAGE[v.stage].label}</Chip>
                        <span className="text-xs text-muted">{v.doctorName}</span>
                        {v.appointmentId && (
                          <Button size="small" type="text" onClick={() => void openAppointment(v.appointmentId!)}>
                            Qabulni ochish
                          </Button>
                        )}
                      </div>
                      {v.work.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {v.work.map((w) => (
                            <Chip key={w} className="h-6 px-2.5">
                              {w}
                            </Chip>
                          ))}
                        </div>
                      )}
                      {v.note && <div className="mt-2 text-sm text-ink">{v.note}</div>}
                      {v.photos.length > 0 && (
                        <Image.PreviewGroup>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {v.photos.map((ph) => (
                              <div key={ph.id} className="relative overflow-hidden rounded-sm">
                                <Image src={ph.url} alt={ph.name} width={96} height={72} className="object-cover" />
                                <span className="absolute left-1 top-1 rounded-pill bg-surface px-1.5 text-xs leading-4">{PHOTO_LABEL[ph.kind]}</span>
                              </div>
                            ))}
                          </div>
                        </Image.PreviewGroup>
                      )}
                    </li>
                  ))}
                </ol>
                {c.visits.length > VISITS_PREVIEW && (
                  <Button type="text" className="mt-3" onClick={() => setAllVisits((x) => !x)}>
                    {allVisits ? 'Kamroq ko‘rsatish' : `Hammasini ko‘rsatish (${c.visits.length})`}
                  </Button>
                )}
              </>
            )}
          </Panel>

          {before && after && (
            <Panel title="Oldin / keyin">
              <Image.PreviewGroup>
                <div className="grid grid-cols-2 gap-3">
                  {[before, after].map((ph) => (
                    <figure key={ph.id} className="m-0 min-w-0">
                      <div className="overflow-hidden rounded-md">
                        <Image src={ph.url} alt={ph.name} height={200} width="100%" className="object-cover" />
                      </div>
                      <figcaption className="mt-1 text-xs text-muted">
                        {PHOTO_LABEL[ph.kind]} · {formatDate(ph.date)}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </Image.PreviewGroup>
            </Panel>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel
            title="To‘lov rejasi"
            extra={
              c.totalPrice > 0 ? (
                <Can perm="payment.receive">
                  <Button icon={<Wallet size={18} strokeWidth={1.5} />} disabled={c.remaining <= 0} onClick={() => openPayment({ patientId: c.patientId, invoiceId: c.invoiceId })}>
                    To‘lov qabul qilish
                  </Button>
                </Can>
              ) : undefined
            }
          >
            {c.totalPrice <= 0 ? (
              <EmptyState
                compact
                icon={Wallet}
                title="Narx hali kelishilmagan"
                action={
                  <Can perm="ortho.manage">
                    <Button size="small" onClick={() => setEditing(true)}>
                      Summani kiritish
                    </Button>
                  </Can>
                }
              />
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ['Umumiy', c.totalPrice],
                    ['To‘langan', c.paid],
                    ['Qolgan', c.remaining],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <div className="text-xs text-muted">{label}</div>
                      <Money value={value as number} className="block truncate text-base" />
                    </div>
                  ))}
                </div>
                <Progress percent={Math.round((c.paid / c.totalPrice) * 100)} showInfo={false} className="m-0!" />
                <ul className="m-0 flex list-none flex-col p-0">
                  <Row label="Oylik to‘lov">
                    <Money value={c.monthlyPayment} />
                  </Row>
                  {c.nextPaymentDate && (
                    <Row label={c.paymentOverdue ? 'Kechikkan to‘lov' : 'Keyingi to‘lov'}>
                      <span className="inline-flex items-center gap-2 tabular-nums">
                        {c.paymentOverdue && <StatusTag tone="warning">Kechikdi</StatusTag>}
                        {formatDate(c.nextPaymentDate)}
                      </span>
                    </Row>
                  )}
                </ul>
                <div>
                  <div className="mb-1 text-xs text-muted">Jadval</div>
                  <ul className="m-0 flex max-h-72 list-none flex-col gap-0.5 overflow-y-auto p-0 text-sm">
                    {c.schedule.map((s, i) => {
                      const late = !s.paid && dayjs(s.date).isBefore(today);
                      return (
                        <li key={s.date + i} className={cn('flex min-h-10 items-center justify-between gap-2 rounded-md px-3', late && 'bg-warning-soft')}>
                          <span className="tabular-nums">
                            {formatDate(s.date)}
                            {i === 0 && c.initialPayment > 0 && <span className="text-xs text-muted"> · boshlang‘ich</span>}
                          </span>
                          <span className="flex items-center gap-2">
                            <Money value={s.amount} />
                            {s.paid ? (
                              <Tooltip title="To‘langan">
                                <CircleCheck size={18} strokeWidth={1.5} className="text-success" aria-label="To‘langan" />
                              </Tooltip>
                            ) : late ? (
                              <span className="text-xs text-warning">kechikdi</span>
                            ) : (
                              <span className="w-[18px]" />
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Eslatish">
            <ul className="m-0 flex list-none flex-col p-0">
              <Row label="Kelish oralig‘i">Har {c.visitIntervalDays} kunda</Row>
              <Row label="Oxirgi tashrif">
                <span className="tabular-nums">{formatDate(c.lastVisit)}</span>
              </Row>
              <Row label="Kelishi kerak">
                <span className="inline-flex items-center gap-2 tabular-nums">
                  {c.overdueDays > 0 && <StatusTag tone="danger">Kechikdi</StatusTag>}
                  {formatDate(c.dueDate)}
                </span>
              </Row>
              <Row label="Yozilgan qabul">{c.nextAppointment ? formatRelativeDay(c.nextAppointment) : '—'}</Row>
            </ul>
            {c.lastContact && (
              <div className="mt-3 rounded-md bg-subtle px-4 py-3 text-sm">
                <div className="text-xs text-muted">Oxirgi qo‘ng‘iroq · {formatDate(c.lastContact.at)}</div>
                <div>{c.lastContact.note}</div>
              </div>
            )}
            {!finished && (
              <Can perm="ortho.manage">
                <Button block className="mt-4" icon={<PhoneCall size={18} strokeWidth={1.5} />} onClick={() => setContact(true)}>
                  Qo‘ng‘iroq natijasini yozish
                </Button>
              </Can>
            )}
          </Panel>
        </div>
      </div>

      <OrthoCaseFormDrawer open={editing} orthoCase={c} onClose={() => setEditing(false)} />
      <OrthoVisitModal orthoCase={c} open={visitOpen} onClose={() => setVisitOpen(false)} />
      <ContactModal c={contact ? c : null} onClose={() => setContact(false)} />
    </>
  );
};
