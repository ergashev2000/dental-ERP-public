import { Button, Form, Segmented, Tabs, Tooltip } from 'antd';
import { CircleCheck, ExternalLink, Presentation, Stethoscope, X } from '@/shared/icons';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { CardSkeleton, EmptyState, ErrorState, MedicalAlert, MoneyText, PageHeader, Panel, PhoneText, ServicePicker, StatusTag, UserAvatar } from '@/shared/components/ui';
import { APPOINTMENT_STATUS } from '@/shared/constants/status';
import { ROUTES } from '@/shared/constants/routes';
import { usePermission } from '@/shared/hooks/usePermission';
import { ageFrom, formatAge, formatDate, formatDateTime, formatDuration, formatTime, genderLabel } from '@/shared/utils/format';
import { ChartLegend, conditionsLabel, JawPresentationModal, ToothChart, ToothDrawer, ToothHistoryList, useChart, type Dentition } from '@/modules/dental-chart';
import { usePatient } from '@/modules/patients';
import { useInvoices } from '@/modules/billing';
import { StageBar, usePatientOrtho } from '@/modules/orthodontics';
import type { Service } from '@/modules/services';
import { useAppointment, useAppointmentParam, useAppointmentsList } from '../hooks/useAppointments';
import { AiDictation } from '../components/AiDictation';
import { CancelAppointmentModal } from '../components/CancelAppointmentModal';
import { CompletionForm, type CompletionValues } from '../components/CompletionForm';
import { StatusActions } from '../components/StatusActions';
import { useCompletionResult } from '../components/useCompletionResult';
import type { CompleteItem } from '../types';

const OPEN = ['SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_PROGRESS'];

/**
 * Qabul sahifasi — shifokor bemor bilan ishlaydigan yagona joy:
 * tish sxemasi (qaysi tishga nima qilindi / qilinadi), tarix, bugungi ish, to'lov va keyingi tashrif.
 */
export const VisitPage = () => {
  const { id = '' } = useParams();
  const [form] = Form.useForm<CompletionValues>();
  const { data: a, isLoading, isError, error, refetch } = useAppointment(id);
  const { data: patient } = usePatient(a?.patientId || null);
  const { data: records = [] } = useChart(a?.patientId ?? '');
  const { data: history } = useAppointmentsList({ patientId: a?.patientId, pageSize: 20 }, !!a?.patientId);
  const { data: invoices } = useInvoices({ patientId: a?.patientId, pageSize: 200 }, !!a?.patientId && a.status === 'COMPLETED');
  const { data: ortho } = usePatientOrtho(a?.patientId || null);
  const canEditChart = usePermission('chart.edit');
  const canComplete = usePermission('appointment.complete');
  const [, openAppointment] = useAppointmentParam();
  const [dentition, setDentition] = useState<Dentition | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [toothOpen, setToothOpen] = useState<number | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  /** 3D — bemorga muammo va rejani tushuntirish (TZ 6-bo'lim) */
  const [present, setPresent] = useState(false);
  /** Tishga qilinadigan xizmat tanlandi, tish hali tanlanmagan — sxemadagi har bosish shu xizmatni qo'shadi */
  const [armed, setArmed] = useState<Service | null>(null);
  const result = useCompletionResult();
  const watchedItems = Form.useWatch('items', form) as CompleteItem[] | undefined;

  const title = a ? `Qabul — ${a.patientName}` : 'Qabul';
  const crumbs = [{ label: 'Qabullar', to: ROUTES.appointments }, { label: a?.patientName ?? 'Qabul' }];

  if (isLoading)
    return (
      <>
        <PageHeader title={title} breadcrumb={crumbs} />
        <CardSkeleton rows={10} />
      </>
    );
  if (isError || !a)
    return (
      <>
        <PageHeader title={title} breadcrumb={crumbs} />
        <ErrorState error={error} onRetry={() => void refetch()} />
      </>
    );

  // 12 yoshdan kichik — sut tishlari
  const dent: Dentition = dentition ?? (patient?.birthDate && ageFrom(patient.birthDate) < 12 ? 'child' : 'adult');
  const isOpen = OPEN.includes(a.status);
  const single = selected.length === 1 ? selected[0]! : null;
  const pastVisits = (history?.items ?? []).filter((v) => v.id !== a.id && v.status === 'COMPLETED');
  const invoice = invoices?.items.find((i) => i.appointmentId === a.id);

  const toggleTooth = (tooth: number) => {
    if (armed) {
      const current = (form.getFieldValue('items') as CompleteItem[] | undefined) ?? [];
      const idx = current.findIndex((i) => i.serviceId === armed.id && i.tooth === tooth);
      form.setFieldValue(
        'items',
        idx >= 0 ? current.filter((_, i) => i !== idx) : [...current, { serviceId: armed.id, tooth, price: armed.price, discount: 0 }],
      );
      return;
    }
    setSelected((prev) => (prev.includes(tooth) ? prev.filter((t) => t !== tooth) : [...prev, tooth]));
  };
  const armedTeeth = armed ? (watchedItems ?? []).filter((i) => i?.serviceId === armed.id && i.tooth).map((i) => i.tooth!) : [];

  // Tanlangan tishlarga xizmat — "Bugungi ish" ro'yxatiga qo'shiladi (har tishga alohida qator)
  const addService = (s: Service) => {
    // Tishga qilinadigan xizmat, tish tanlanmagan — avval xizmat, keyin sxemadan tishlar
    if (s.perTooth && !selected.length) {
      setArmed((prev) => (prev?.id === s.id ? null : s));
      return;
    }
    setArmed(null);
    const current = (form.getFieldValue('items') as CompleteItem[] | undefined) ?? [];
    const teeth = s.perTooth && selected.length ? selected : [undefined];
    const added: CompleteItem[] = teeth.map((tooth) => ({ serviceId: s.id, tooth, price: s.price, discount: 0 }));
    form.setFieldValue('items', [...current, ...added]);
    setSelected([]);
  };

  return (
    <>
      <PageHeader title={title} breadcrumb={crumbs} />

      {/* Bemor va qabul — qisqa ma’lumot */}
      <section className="mb-6 rounded-card bg-surface p-5">
        <div className="flex flex-wrap items-start gap-4">
          <UserAvatar name={a.patientName} size={52} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="m-0 text-2xl font-normal">{a.patientName}</h2>
              <StatusTag meta={APPOINTMENT_STATUS[a.status]} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              {patient && <span className="tabular-nums">{patient.cardNo}</span>}
              {patient && <span>{[formatAge(patient.birthDate), genderLabel(patient.gender)].filter(Boolean).join(' · ')}</span>}
              <PhoneText phone={a.patientPhone} />
              <span>
                {formatDateTime(a.start)} · {formatDuration(a.durationMin)}
              </span>
              <span>
                {a.doctorName} · {a.chairName}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-muted">Umumiy qarz</span>
            {patient && patient.debt > 0 ? <MoneyText value={patient.debt} debt strong className="text-lg" /> : <StatusTag tone="success">Qarz yo‘q</StatusTag>}
          </div>
        </div>
        {patient && (
          <div className="mt-4">
            <MedicalAlert patient={patient} />
          </div>
        )}
        {ortho && ortho.status !== 'FINISHED' && (
          <Link
            to={ROUTES.orthoCase(ortho.id)}
            className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md bg-lime-soft px-4 py-3 text-ink no-underline"
          >
            <span className="text-sm">Breket bilan davolanmoqda</span>
            <div className="w-56">
              <StageBar stage={ortho.stage} />
            </div>
            <span className="ml-auto text-sm text-ink">Breket sahifasi →</span>
          </Link>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line-soft pt-4">
          {/* "Yakunlash" shu sahifaning o‘ng panelida — tugma kerak emas */}
          <StatusActions a={a} onCancel={() => setCancelId(a.id)} onComplete={() => form.scrollToField(['items'])} hideComplete />
          <Link to={ROUTES.patient(a.patientId)} className="ml-auto">
            <Button type="text" icon={<ExternalLink size={16} strokeWidth={1.5} />}>
              Bemor kartasi
            </Button>
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_480px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel
            title="Tish sxemasi"
            extra={
              <div className="flex flex-wrap items-center gap-2">
                <Segmented<Dentition>
                  size="small"
                  value={dent}
                  onChange={setDentition}
                  options={[
                    { value: 'adult', label: 'Doimiy' },
                    { value: 'child', label: 'Sut tishlar' },
                    { value: 'mixed', label: 'Aralash' },
                  ]}
                />
                <Button size="small" icon={<Presentation size={16} strokeWidth={1.5} />} onClick={() => setPresent(true)}>
                  Bemorga 3D’da ko‘rsatish
                </Button>
              </div>
            }
            bodyClassName="p-4 md:p-6"
          >
            <ToothChart records={records} dentition={dent} selected={armed ? armedTeeth : selected} onSelect={toggleTooth} />

            <div className="mt-4 rounded-md bg-subtle p-3">
              {selected.length ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">Tanlangan tish: {[...selected].sort((x, y) => x - y).join(', ')}</span>
                    {single !== null && <span className="text-muted">· hozirgi holati: {conditionsLabel(records.find((r) => r.tooth === single)?.conditions ?? [])}</span>}
                    <Button size="small" type="text" icon={<X size={14} strokeWidth={1.5} />} onClick={() => setSelected([])}>
                      Tozalash
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Tooltip title={single === null ? 'Holatni ko‘rish uchun bitta tish tanlang' : undefined}>
                      <Button icon={<Stethoscope size={16} strokeWidth={1.5} />} disabled={single === null} onClick={() => setToothOpen(single)}>
                        {canEditChart ? 'Tish holati va tarixi' : 'Tish tarixi'}
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              ) : armed ? (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{armed.name}</span> — sxemadan tish(lar)ni bosing, har biri «Bugungi ish»ga qo‘shiladi. Qayta bosish — olib tashlaydi.
                  </span>
                  <Button size="small" type="primary" onClick={() => setArmed(null)}>
                    Tayyor
                  </Button>
                </div>
              ) : (
                <p className="m-0 text-sm text-muted">
                  {isOpen && canComplete
                    ? 'Xizmatni bosing: tishsiz xizmat darhol qo‘shiladi, «tishga» xizmatdan keyin sxemadan tishlarni bosasiz. Yoki avval tish(lar)ni tanlab, keyin xizmatni bosing.'
                    : 'Tishni bosing — u tanlanadi va tarixini ko‘rish mumkin.'}
                </p>
              )}
            </div>

            {isOpen && canComplete && (
              <div className="mt-4">
                <ServicePicker onPick={addService} activeId={armed?.id} />
              </div>
            )}

            <div className="mt-4 border-t border-line-soft pt-4">
              <ChartLegend />
            </div>
          </Panel>

          <Panel bodyClassName="px-4 pb-4 md:px-6">
            <Tabs
              items={[
                {
                  key: 'visits',
                  label: `Oldingi tashriflar (${pastVisits.length})`,
                  children: !pastVisits.length ? (
                    <EmptyState compact title="Bu bemorning oldingi tashriflari yo‘q" description="Bu — birinchi tashrif" />
                  ) : (
                    <ul className="m-0 list-none divide-y divide-line-soft p-0">
                      {pastVisits.map((v) => (
                        <li key={v.id}>
                          <button
                            type="button"
                            onClick={() => void openAppointment(v.id)}
                            className="flex w-full cursor-pointer flex-col gap-1 border-0 bg-transparent py-3 text-left"
                          >
                            <span className="flex flex-wrap gap-x-3 text-sm">
                              <span className="tabular-nums">{formatDate(v.start)}</span>
                              <span className="text-muted">{v.doctorName}</span>
                            </span>
                            <span className="text-sm">{v.serviceNames.join(', ')}</span>
                            {v.doctorNote && <span className="text-xs text-muted">{v.doctorNote}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ),
                },
                {
                  key: 'teeth',
                  label: 'Tishlar tarixi',
                  children: <ToothHistoryList patientId={a.patientId} />,
                },
              ]}
            />
          </Panel>
        </div>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <Panel title="Bugungi ish">
            {isOpen && canComplete ? (
              <div className="flex flex-col gap-4">
                <AiDictation
                  items={watchedItems ?? []}
                  onApply={(text) => {
                    const prev = (form.getFieldValue('doctorNote') as string | undefined)?.trim();
                    form.setFieldValue('doctorNote', prev ? `${prev}\n${text}` : text);
                  }}
                />
                <CompletionForm appointmentId={a.id} form={form} narrow showMedical={false} onCompleted={result.show} />
              </div>
            ) : a.status === 'COMPLETED' ? (
              <EmptyState
                icon={CircleCheck}
                title="Qabul yakunlangan"
                description={
                  <>
                    {a.serviceNames.join(', ')}
                    {invoice && (
                      <div className="mt-2">
                        Jami <MoneyText value={invoice.total} strong /> · qoldiq <MoneyText value={invoice.remaining} debt strong />
                      </div>
                    )}
                    {a.doctorNote && <div className="mt-2">{a.doctorNote}</div>}
                  </>
                }
              />
            ) : (
              <EmptyState
                title={isOpen ? 'Qabulni yakunlash uchun ruxsat yo‘q' : `Qabul holati: ${APPOINTMENT_STATUS[a.status].label}`}
                description={a.cancelReason ?? `Qabul vaqti: ${formatTime(a.start)}`}
              />
            )}
          </Panel>
        </div>
      </div>

      <ToothDrawer
        patientId={a.patientId}
        tooth={toothOpen}
        record={records.find((r) => r.tooth === toothOpen)}
        readOnly={!canEditChart}
        onClose={() => setToothOpen(null)}
      />
      <CancelAppointmentModal id={cancelId} onClose={() => setCancelId(null)} />
      <JawPresentationModal
        open={present}
        onClose={() => setPresent(false)}
        patientId={a.patientId}
        dentition={dent}
        highlight={[...new Set((watchedItems ?? []).map((i) => i?.tooth).filter((t): t is number => !!t))]}
        subtitle={a.patientName}
      />
      {result.receipt}
    </>
  );
};
