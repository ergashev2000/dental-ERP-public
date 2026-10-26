import { App, Button, Descriptions, Drawer, Skeleton } from 'antd';
import { ExternalLink, PhoneCall, Repeat, TriangleAlert, Wallet } from '@/shared/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Can, ErrorState, MedicalAlert, MoneyText, PhoneText, StatusTag, UserAvatar } from '@/shared/components/ui';
import { APPOINTMENT_STATUS, CALL_RESULT } from '@/shared/constants/status';
import { sourceLabel } from '@/shared/constants/options';
import { ROUTES } from '@/shared/constants/routes';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { formatAge, formatDateTime, formatDuration, formatTime } from '@/shared/utils/format';
import { usePatient } from '@/modules/patients';
import { useInvoices, usePaymentModal } from '@/modules/billing';
import { useAppointmentJobs, useCallForAppointment, useCallLogs } from '@/modules/reminders';
import type { CallResult } from '@/modules/reminders/types';
import { useAppointment, useAppointmentParam } from '../hooks/useAppointments';
import { useNewAppointment } from '../store/appointmentModalStore';
import dayjs from '@/shared/lib/dayjs';
import { CancelAppointmentModal } from './CancelAppointmentModal';
import { CompleteAppointmentModal } from './CompleteAppointmentModal';
import { StatusActions } from './StatusActions';

/** Qabul tafsilotlari — istalgan sahifada ?appointment=ID bilan ochiladi */
export const AppointmentDrawer = () => {
  const [id, setId] = useAppointmentParam();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { message } = App.useApp();
  const { data: a, isLoading, isError, error } = useAppointment(id);
  const { data: patient } = usePatient(a?.patientId || null);
  const { data: jobs = [] } = useAppointmentJobs(a && !a.masked ? a.id : null);
  const { data: logs } = useCallLogs({ appointmentId: a?.id, pageSize: 20 }, !!a && !a.masked);
  const { data: invoices } = useInvoices({ patientId: a?.patientId, pageSize: 200 }, !!a?.patientId && a.status === 'COMPLETED');
  const call = useCallForAppointment();
  const openPayment = usePaymentModal((s) => s.show);
  const book = useNewAppointment((s) => s.show);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [completeId, setCompleteId] = useState<string | null>(null);

  const close = () => void setId(null);
  const invoice = invoices?.items.find((i) => i.appointmentId === a?.id);
  const calling = jobs.some((j) => j.status === 'CALLING');

  return (
    <>
      <Drawer open={!!id} onClose={close} width={isMobile ? '100%' : 480} title="Qabul" destroyOnHidden>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : isError || !a ? (
          <ErrorState error={error} />
        ) : (
          <div className="flex flex-col gap-5">
            {/* Bemor qisqa kartasi */}
            <section className="rounded-md bg-subtle p-4">
              <div className="flex items-start gap-3">
                <UserAvatar name={a.patientName} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="text-base font-medium">{a.patientName}</div>
                  <div className="flex flex-wrap gap-x-3 text-sm text-muted">
                    {patient && <span>{formatAge(patient.birthDate)}</span>}
                    <PhoneText phone={a.patientPhone} />
                  </div>
                </div>
                {patient && patient.debt > 0 && (
                  <div className="text-right">
                    <div className="text-xs text-muted">Qarz</div>
                    <MoneyText value={patient.debt} debt strong />
                  </div>
                )}
              </div>
              {patient && (
                <div className="mt-3">
                  <MedicalAlert patient={patient} compact />
                </div>
              )}
              <Button
                type="link"
                className="mt-2 !px-0"
                icon={<ExternalLink size={14} strokeWidth={1.5} />}
                onClick={() => {
                  close();
                  navigate(ROUTES.patient(a.patientId));
                }}
              >
                Bemor kartasini ochish
              </Button>
            </section>

            <div className="flex flex-wrap items-center gap-2">
              <StatusTag meta={APPOINTMENT_STATUS[a.status]} />
              {a.noShowRisk && (
                <StatusTag tone={a.noShowRisk === 'HIGH' ? 'danger' : 'warning'} dot={false}>
                  <TriangleAlert size={14} strokeWidth={1.5} />
                  {a.noShowRisk === 'HIGH' ? 'Kelmay qolish xavfi yuqori' : 'Avval bir marta kelmagan'}
                </StatusTag>
              )}
              <span className="ml-auto text-sm text-muted">{formatDateTime(a.start)}</span>
            </div>

            <Descriptions
              column={1}
              size="small"
              styles={{ label: { color: 'var(--color-muted)', width: 120 } }}
              items={[
                { key: 'd', label: 'Shifokor', children: a.doctorName },
                { key: 't', label: 'Vaqt', children: `${formatTime(a.start)} · ${formatDuration(a.durationMin)}` },
                { key: 'c', label: 'Kabinet', children: a.chairName },
                { key: 's', label: 'Xizmatlar', children: a.serviceNames.join(', ') || '—' },
                { key: 'src', label: 'Manba', children: sourceLabel(a.source) },
                ...(a.note ? [{ key: 'n', label: 'Izoh', children: a.note }] : []),
                ...(a.doctorNote ? [{ key: 'dn', label: 'Shifokor izohi', children: a.doctorNote }] : []),
                ...(a.cancelReason ? [{ key: 'cr', label: 'Bekor sababi', children: <span className="text-danger">{a.cancelReason}</span> }] : []),
              ]}
            />

            <StatusActions a={a} onCancel={() => setCancelId(a.id)} onComplete={() => setCompleteId(a.id)} />

            {/* Takroriy qabul: bitta bosishda keyingi tashrif (TZ 4-bo'lim) */}
            {!a.masked && a.status !== 'CANCELLED' && (
              <Can perm="appointment.manage">
                <section className="flex flex-col gap-2">
                  <h4 className="m-0 flex items-center gap-2 text-base font-normal">
                    <Repeat size={18} strokeWidth={1.5} className="text-muted" />
                    Keyingi qabul
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '1 haftadan', days: 7 },
                      { label: '2 haftadan', days: 14 },
                      { label: '1 oydan', days: 30 },
                    ].map((o) => (
                      <Button
                        key={o.days}
                        size="small"
                        onClick={() => {
                          close();
                          book({
                            patientId: a.patientId,
                            doctorId: a.doctorId,
                            serviceIds: a.serviceIds,
                            date: dayjs(a.start).add(o.days, 'day').format('YYYY-MM-DD'),
                          });
                        }}
                      >
                        {o.label}
                      </Button>
                    ))}
                  </div>
                </section>
              </Can>
            )}

            {a.status === 'COMPLETED' && invoice && (
              <div className="flex items-center justify-between rounded-md bg-subtle px-4 py-3">
                <div>
                  <div className="text-xs text-muted">{invoice.number}</div>
                  <div className="text-sm">
                    Jami <MoneyText value={invoice.total} strong /> · qoldiq <MoneyText value={invoice.remaining} debt strong />
                  </div>
                </div>
                {invoice.remaining > 0 && (
                  <Can perm="payment.receive">
                    <Button type="primary" icon={<Wallet size={16} strokeWidth={1.5} />} onClick={() => openPayment({ patientId: a.patientId, invoiceId: invoice.id })}>
                      To‘lov
                    </Button>
                  </Can>
                )}
              </div>
            )}

            {/* Eslatmalar tarixi */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="m-0 text-base font-normal">Eslatmalar</h4>
                {['SCHEDULED', 'CONFIRMED'].includes(a.status) && (
                  <Can perm="reminder.view">
                    <Button
                      size="small"
                      icon={<PhoneCall size={14} strokeWidth={1.5} />}
                      loading={call.isPending || calling}
                      disabled={patient ? !patient.callConsent : false}
                      onClick={() =>
                        call.mutate(a.id, {
                          onSuccess: () => message.info('Qo‘ng‘iroq boshlandi — natija bir necha soniyada chiqadi'),
                          onError: (e) => message.error(errorMessage(e)),
                        })
                      }
                    >
                      {calling ? 'Qo‘ng‘iroq ketmoqda' : 'Hozir qo‘ng‘iroq qilish'}
                    </Button>
                  </Can>
                )}
              </div>
              {patient && !patient.callConsent && <div className="mb-2 text-sm text-danger">Bemor qo‘ng‘iroq orqali eslatishga rozilik bermagan</div>}
              {!jobs.length && !logs?.items.length ? (
                <div className="text-sm text-muted">Eslatma yo‘q</div>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {jobs
                    .filter((j) => j.status === 'PENDING' || j.status === 'CALLING')
                    .map((j) => (
                      <li key={j.id} className="flex items-center justify-between gap-2 text-sm">
                        <span>
                          {j.ruleName} · {formatDateTime(j.scheduledAt)}
                        </span>
                        <StatusTag meta={CALL_RESULT[j.status]} pulse={j.status === 'CALLING'} />
                      </li>
                    ))}
                  {logs?.items.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-muted">
                        {formatDateTime(l.startedAt)} · {l.attempt}-urinish · {l.durationSec} s{l.keyPressed && ` · “${l.keyPressed}”`}
                      </span>
                      <StatusTag meta={CALL_RESULT[l.result as CallResult]} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </Drawer>
      <CancelAppointmentModal id={cancelId} onClose={() => setCancelId(null)} />
      <CompleteAppointmentModal id={completeId} onClose={() => setCompleteId(null)} />
    </>
  );
};
