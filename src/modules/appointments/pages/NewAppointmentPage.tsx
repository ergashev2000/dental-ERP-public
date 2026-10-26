import { Alert, App, Button, Checkbox, DatePicker, Form, Input, InputNumber, Segmented, Select, Switch, type FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';
import { CalendarClock, CalendarPlus, DoorOpen, Trash2, UserPlus, Wallet, X } from '@/shared/icons';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import dayjs from '@/shared/lib/dayjs';
import {
  Can,
  DoctorSelect,
  EmptyState,
  MedicalAlert,
  MoneyInput,
  MoneyText,
  PageHeader,
  Panel,
  PatientSelect,
  PhoneText,
  ServicePicker,
  ServiceSelect,
  StatusTag,
  UserAvatar,
} from '@/shared/components/ui';
import { APPOINTMENT_SOURCES, DURATIONS } from '@/shared/constants/options';
import { APPOINTMENT_STATUS, PAYMENT_METHOD } from '@/shared/constants/status';
import { ROUTES } from '@/shared/constants/routes';
import { useCurrentUser, usePermission } from '@/shared/hooks/usePermission';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { ageFrom, formatAge, formatDate, formatDuration, formatMoney, formatRelativeDay, genderLabel } from '@/shared/utils/format';
import { toothOptions } from '@/modules/treatments';
import { usePatient, useSavePatient, type Gender } from '@/modules/patients';
import { useServices, type Service } from '@/modules/services';
import { useChairs } from '@/modules/settings';
import { useDoctors } from '@/modules/staff';
import { usePaymentModal } from '@/modules/billing';
import { ChartLegend, conditionsLabel, ToothChart, useChart, type Dentition, type SurfaceMap, type ToothRecord } from '@/modules/dental-chart';
import { StageBar, usePatientOrtho } from '@/modules/orthodontics';
import { useAppointmentsList, useCompleteAppointment, useCreateAppointment, useSlotCheck, useSlots } from '../hooks/useAppointments';
import { NewPatientFields } from '../components/NewPatientFields';
import { SlotPicker } from '../components/SlotPicker';
import { CompletionPaymentFields } from '../components/CompletionPaymentFields';
import { paidAmount, surfaceSummary, type CompletionPaymentValues } from '../utils';
import { FollowUpFields, type FollowUpValues } from '../components/FollowUpFields';
import { Step } from '../components/CompletionForm';
import { SurfaceEditor, SurfacePickerButton } from '../components/SurfacePicker';
import { useCompletionResult } from '../components/useCompletionResult';
import { confirmCompletion } from '../components/confirmCompletion';
import type { PlannedItem } from '../types';

type Mode = 'BOOK' | 'NOW';

interface Values {
  patientId?: string;
  newPatient?: { lastName: string; firstName: string; phone: string; birthDate?: Dayjs; gender?: Gender; region?: string; district?: string; address?: string };
  items: PlannedItem[];
  doctorId: string;
  date: Dayjs;
  time: string;
  durationMin: number;
  chairId: string;
  note?: string;
  source: string;
  reminderEnabled: boolean;
  /** Orqaga sana bilan yozish (faqat boshqaruvchi) */
  allowPast?: boolean;
  payment?: CompletionPaymentValues;
  followUp: FollowUpValues;
}

const PAY_MODE_LABEL = { FULL: 'To‘liq to‘ladi', PARTIAL: 'Qisman to‘ladi', DEBT: 'Keyin to‘laydi (qarz)' } as const;

/** Barqaror bo'sh massiv (useMemo bog'liqligi har renderda o'zgarmasin) */
const NO_ITEMS: Partial<PlannedItem>[] = [];

const roundUp = (min: number) => DURATIONS.find((d) => d >= min) ?? 120;
const lineSum = (i: Partial<PlannedItem>) => Math.round((i.price ?? 0) * (1 - (i.discount ?? 0) / 100));

/** Qidiruv matnidan yangi bemor maydonlari: raqam bo'lsa — telefon, aks holda — familiya va ism */
const prefillFromSearch = (text: string) => {
  const digits = text.replace(/\D/g, '');
  if (digits.length >= 5 && /^[\d\s()+-]+$/.test(text)) {
    return { phone: `+998${(digits.startsWith('998') && digits.length > 9 ? digits.slice(3) : digits).slice(0, 9)}` };
  }
  const [lastName = '', ...rest] = text.split(/\s+/).filter(Boolean);
  return { lastName, firstName: rest.join(' ') || undefined };
};

/** Ishlar ro'yxati: xizmat · tish · yuza · narx · chegirma */
const ItemsList = ({ form, services }: { form: FormInstance<Values>; services: Service[] }) => {
  const items = (Form.useWatch('items', form) ?? NO_ITEMS) as Partial<PlannedItem>[];
  return (
    <Form.List
      name="items"
      rules={[{ validator: async (_, v?: unknown[]) => (v?.length ? undefined : Promise.reject(new Error('Kamida bitta ish (xizmat) tanlang'))) }]}
    >
      {(fields, { remove }, { errors }) =>
        !fields.length ? (
          <div>
            <div className="rounded-md bg-subtle px-3 py-2.5 text-sm text-muted">Hali ish tanlanmagan — tishni bosing va xizmatni tanlang (yoki tishsiz xizmat qo‘shing)</div>
            <Form.ErrorList errors={errors} />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="hidden gap-2 px-1 text-xs font-medium text-muted md:grid md:grid-cols-[minmax(0,1fr)_88px_88px_130px_100px_36px]">
              <span>Xizmat</span>
              <span>Tish</span>
              <span>Yuza</span>
              <span>Narx</span>
              <span>Chegirma</span>
            </div>
            {fields.map((f) => {
              const it = items[f.name];
              const svc = services.find((s) => s.id === it?.serviceId);
              return (
                <div
                  key={f.key}
                  className="grid grid-cols-3 items-start gap-2 rounded-md bg-subtle p-2 md:grid-cols-[minmax(0,1fr)_88px_88px_130px_100px_36px] md:bg-transparent md:p-0"
                >
                  <Form.Item name={[f.name, 'serviceId']} rules={[{ required: true, message: 'Xizmatni tanlang' }]} className="col-span-3 mb-0 md:col-span-1">
                    <ServiceSelect onChange={(_, s) => s && form.setFieldValue(['items', f.name, 'price'], s.price)} />
                  </Form.Item>
                  <Form.Item name={[f.name, 'tooth']} rules={[{ required: !!svc?.perTooth, message: 'Tish' }]} className="mb-0">
                    <Select allowClear showSearch placeholder="Tish" options={toothOptions} onChange={() => form.setFieldValue(['items', f.name, 'surfaces'], undefined)} />
                  </Form.Item>
                  <Form.Item name={[f.name, 'surfaces']} className="mb-0">
                    <SurfacePickerButton tooth={it?.tooth} />
                  </Form.Item>
                  <Form.Item name={[f.name, 'price']} className="mb-0">
                    <MoneyInput currency={false} />
                  </Form.Item>
                  <Form.Item name={[f.name, 'discount']} className="col-span-2 mb-0 md:col-span-1">
                    <InputNumber min={0} max={100} suffix="%" className="w-full" aria-label="Chegirma" />
                  </Form.Item>
                  <Button type="text" aria-label="Olib tashlash" icon={<Trash2 size={16} strokeWidth={1.5} />} onClick={() => remove(f.name)} />
                </div>
              );
            })}
          </div>
        )
      }
    </Form.List>
  );
};

/**
 * Yangi qabul — to'liq sahifa. Chapda bitta oqim: bemor → tish sxemasi va ishlar → vaqt → to'lov.
 * O'ngda qisqa xulosa: nima qilinadi/qilindi, narxlar, to'lov shakli va jami.
 */
const NewAppointmentForm = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<Values>();
  const user = useCurrentUser();
  const manageAll = usePermission('appointment.manageAll');
  const canReceive = usePermission('payment.receive');
  const canComplete = usePermission('appointment.complete');
  const canBackdate = usePermission('appointment.backdate');
  const isMobile = useIsMobile();
  const { data: services = [] } = useServices();
  const { data: chairs = [] } = useChairs();
  const { data: doctors = [] } = useDoctors();
  const create = useCreateAppointment();
  const complete = useCompleteAppointment();
  const savePatient = useSavePatient();
  const openPayment = usePaymentModal((s) => s.show);
  const result = useCompletionResult(() => navigate(ROUTES.appointments));

  const [mode, setMode] = useState<Mode>('BOOK');
  const [newPatient, setNewPatient] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [pendingSurfaces, setPendingSurfaces] = useState<SurfaceMap>({});
  const [dentition, setDentition] = useState<Dentition | null>(null);
  /** Tishga qilinadigan xizmat tanlandi, tish hali tanlanmagan — sxemadagi har bosish shu xizmatni qo'shadi */
  const [armed, setArmed] = useState<Service | null>(null);
  const isNow = mode === 'NOW';

  const patientId = Form.useWatch('patientId', form) as string | undefined;
  const doctorId = Form.useWatch('doctorId', form) as string | undefined;
  const chairId = Form.useWatch('chairId', form) as string | undefined;
  const date = Form.useWatch('date', form) as Dayjs | undefined;
  const time = Form.useWatch('time', form) as string | undefined;
  const durationMin = Form.useWatch('durationMin', form) as number | undefined;
  const items = (Form.useWatch('items', form) ?? NO_ITEMS) as Partial<PlannedItem>[];
  const payment = Form.useWatch('payment', form) as Partial<CompletionPaymentValues> | undefined;
  const fuEnabled = Form.useWatch(['followUp', 'enabled'], form) as boolean | undefined;
  const fuDate = Form.useWatch(['followUp', 'date'], form) as Dayjs | undefined;
  const fuTime = Form.useWatch(['followUp', 'time'], form) as string | undefined;
  const allowPastRaw = Form.useWatch('allowPast', form) as boolean | undefined;
  const np = Form.useWatch('newPatient', form) as Partial<NonNullable<Values['newPatient']>> | undefined;

  const pid = newPatient ? undefined : patientId;
  const { data: patient } = usePatient(pid);
  const { data: records = [] } = useChart(pid ?? '');
  const { data: history } = useAppointmentsList({ patientId: pid, pageSize: 5 }, !!pid);
  const { data: ortho } = usePatientOrtho(pid);

  const dateStr = (isNow ? dayjs() : date)?.format('YYYY-MM-DD');
  const allowPast = !isNow && !!allowPastRaw && canBackdate;
  const { data: slots = [], isFetching: slotsLoading } = useSlots({ doctorId, date: dateStr, durationMin, allowPast });
  const start = dateStr && time ? dayjs(`${dateStr} ${time}`, 'YYYY-MM-DD HH:mm').toISOString() : undefined;
  const { data: check } = useSlotCheck({ doctorId, chairId, start, durationMin, allowPast });
  const conflict = check?.error ?? null;

  const total = items.reduce((s, i) => s + lineSum(i ?? {}), 0);
  const serviceKey = items.map((i) => i?.serviceId ?? '').join(',');

  // URL'dan boshlang'ich qiymatlar (kalendar slotidan, bemor kartasidan va h.k.)
  useEffect(() => {
    const at = params.get('start');
    form.setFieldsValue({
      patientId: params.get('patient') ?? undefined,
      doctorId: params.get('doctor') ?? (user?.role === 'DOCTOR' ? user.staffId : undefined),
      chairId: params.get('chair') ?? undefined,
      date: at ? dayjs(at) : params.get('date') ? dayjs(params.get('date')) : dayjs(),
      time: at ? dayjs(at).format('HH:mm') : undefined,
      durationMin: 30,
      items: [],
      source: 'PHONE',
      reminderEnabled: true,
      payment: { mode: 'FULL', method: 'CASH' },
      followUp: { enabled: false, durationMin: 30, serviceIds: [] },
    });
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- faqat sahifa ochilganda
  }, []);

  // Kabinet: birinchi faol kabinet (URL'da berilmagan bo'lsa)
  useEffect(() => {
    if (!form.getFieldValue('chairId') && chairs.length) form.setFieldValue('chairId', chairs.find((c) => c.isActive)?.id);
  }, [chairs, form]);

  // Davomiylik — tanlangan xizmatlar bo'yicha
  useEffect(() => {
    const ids = [...new Set(items.map((i) => i?.serviceId).filter(Boolean))];
    const sum = ids.reduce((s, id) => s + (services.find((x) => x.id === id)?.durationMin ?? 0), 0);
    if (sum) form.setFieldValue('durationMin', roundUp(sum));
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- faqat xizmatlar ro'yxati o'zgarganda qayta hisoblanadi
  }, [serviceKey, services]);

  // "Hozir" rejimida — bugungi eng yaqin bo'sh vaqt
  useEffect(() => {
    if (isNow && slots.length && (!time || !slots.includes(time))) form.setFieldValue('time', slots[0]);
  }, [isNow, slots, time, form]);

  // Rozilik bo'lmasa eslatma o'chiriladi
  useEffect(() => {
    if (patient && !patient.callConsent) form.setFieldValue('reminderEnabled', false);
  }, [patient, form]);

  // Belgilangan yuzalar sxemada darhol ko'rinsin (hali saqlanmagan ishlar — oldindan ko'rish)
  const previewRecords = useMemo(() => {
    const map = new Map<number, ToothRecord>(records.map((r) => [r.tooth, r]));
    for (const it of items) {
      if (!it?.tooth || !it.surfaces || !Object.keys(it.surfaces).length) continue;
      const prev = map.get(it.tooth);
      map.set(it.tooth, {
        patientId: pid ?? '',
        tooth: it.tooth,
        conditions: prev?.conditions ?? ['HEALTHY'],
        surfaces: { ...(prev?.surfaces ?? {}), ...it.surfaces },
        note: prev?.note,
        updatedAt: prev?.updatedAt ?? '',
      });
    }
    return [...map.values()];
  }, [records, items, pid]);

  const startNewPatient = (text = '') => {
    setNewPatient(true);
    setSelected([]);
    form.setFieldValue('patientId', undefined);
    form.setFieldValue('newPatient', prefillFromSearch(text));
  };
  const pickExisting = (id: string) => {
    setNewPatient(false);
    form.setFieldsValue({ patientId: id, newPatient: undefined });
  };

  const toggleTooth = (t: number) => {
    if (armed) {
      const current = (form.getFieldValue('items') as PlannedItem[] | undefined) ?? [];
      const idx = current.findIndex((i) => i.serviceId === armed.id && i.tooth === t);
      form.setFieldValue(
        'items',
        idx >= 0 ? current.filter((_, i) => i !== idx) : [...current, { serviceId: armed.id, tooth: t, price: armed.price, discount: 0 }],
      );
      return;
    }
    setSelected((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };
  const clearSelection = () => {
    setSelected([]);
    setPendingSurfaces({});
  };
  const addService = (s: Service) => {
    // Tishga qilinadigan xizmat, tish tanlanmagan — avval xizmat, keyin sxemadan tishlar
    if (s.perTooth && !selected.length) {
      setArmed((prev) => (prev?.id === s.id ? null : s));
      return;
    }
    setArmed(null);
    const current = (form.getFieldValue('items') as PlannedItem[] | undefined) ?? [];
    const teeth = s.perTooth && selected.length ? [...selected].sort((a, b) => a - b) : [undefined];
    const surfaces = Object.keys(pendingSurfaces).length ? pendingSurfaces : undefined;
    form.setFieldValue('items', [...current, ...teeth.map((tooth) => ({ serviceId: s.id, tooth, surfaces: tooth ? surfaces : undefined, price: s.price, discount: 0 }))]);
    clearSelection();
  };

  const submit = async (v: Values) => {
    if (conflict || !v.items?.length) return;
    let apptId: string | undefined;
    try {
      let id = v.patientId;
      if (newPatient && v.newPatient) {
        const n = v.newPatient;
        const created = await savePatient.mutateAsync({
          input: { ...n, birthDate: n.birthDate?.format('YYYY-MM-DD'), tags: [], allergies: [], conditions: [], medications: [], callConsent: true },
        });
        id = created.id;
      }
      const lines = v.items.map((i) => ({ serviceId: i.serviceId, tooth: i.tooth, surfaces: i.surfaces, price: i.price ?? 0, discount: i.discount ?? 0 }));
      const res = await create.mutateAsync({
        patientId: id!,
        doctorId: v.doctorId,
        chairId: v.chairId,
        start: dayjs(`${dateStr} ${v.time}`, 'YYYY-MM-DD HH:mm').toISOString(),
        durationMin: v.durationMin,
        serviceIds: [...new Set(v.items.map((i) => i.serviceId))],
        note: v.note,
        source: v.source,
        reminderEnabled: !isNow && v.reminderEnabled,
        allowPast,
        arrived: isNow,
        plannedItems: lines,
      });
      apptId = res.appointment.id;

      if (!isNow) {
        message.success(res.reminders ? `Qabul yaratildi · ${res.reminders} ta eslatma navbatga qo‘shildi` : 'Qabul yaratildi');
        navigate(`${ROUTES.appointments}?date=${dateStr}&appointment=${apptId}`);
        return;
      }

      // Hozir qabul: shu yerning o'zida yakunlash (materiallar — xizmat normasi bo'yicha)
      const materials = new Map<string, number>();
      for (const it of v.items) for (const m of services.find((s) => s.id === it.serviceId)?.materials ?? []) materials.set(m.productId, (materials.get(m.productId) ?? 0) + m.qty);
      const fu = v.followUp;
      const amount = canReceive ? paidAmount(v.payment, total) : 0;
      const done = await complete.mutateAsync({
        appointmentId: apptId,
        items: lines,
        materials: [...materials.entries()].map(([productId, qty]) => ({ productId, qty: +qty.toFixed(3) })),
        doctorNote: v.note,
        followUp:
          fu?.enabled && fu.date && fu.time
            ? { start: dayjs(`${fu.date.format('YYYY-MM-DD')} ${fu.time}`, 'YYYY-MM-DD HH:mm').toISOString(), durationMin: fu.durationMin, serviceIds: fu.serviceIds, note: fu.note }
            : undefined,
        payment: amount > 0 && v.payment ? { amount, method: v.payment.method } : undefined,
      });
      if (done.warnings.length) message.warning(done.warnings.join('; '));
      result.show(done);
    } catch (e) {
      message.error(errorMessage(e));
      // Qabul yaratilgan, lekin yakunlashda muammo — qabul sahifasida davom ettiriladi
      if (apptId && isNow) navigate(ROUTES.visit(apptId));
    }
  };

  const dent: Dentition = dentition ?? (patient?.birthDate && ageFrom(patient.birthDate) < 12 ? 'child' : 'adult');
  const pastVisits = useMemo(() => (history?.items ?? []).filter((a) => a.status === 'COMPLETED').slice(0, 3), [history]);
  const busy = create.isPending || complete.isPending || savePatient.isPending;
  const sortedSel = [...selected].sort((a, b) => a - b);
  const single = selected.length === 1 ? selected[0]! : null;
  const hasPatient = newPatient || !!patientId;
  const doctor = doctors.find((d) => d.id === doctorId);
  const paidNow = paidAmount(payment, total);
  const patientLabel = newPatient ? [np?.lastName, np?.firstName].filter(Boolean).join(' ') || 'Yangi bemor' : patient ? `${patient.lastName} ${patient.firstName}` : null;

  return (
    <>
      <PageHeader title="Yangi qabul" breadcrumb={[{ label: 'Qabullar', to: ROUTES.appointments }, { label: 'Yangi qabul' }]} />

      <div className="mb-6">
        <Segmented<Mode>
          block
          size="large"
          value={mode}
          onChange={setMode}
          options={[
            {
              value: 'BOOK',
              label: (
                <span className="flex items-center justify-center gap-2 py-1">
                  <CalendarPlus size={18} strokeWidth={1.5} /> {isMobile ? 'Yozish' : 'Qabulga yozish (keyinroq keladi)'}
                </span>
              ),
            },
            ...(canComplete
              ? [
                  {
                    value: 'NOW' as const,
                    label: (
                      <span className="flex items-center justify-center gap-2 py-1">
                        <DoorOpen size={18} strokeWidth={1.5} /> {isMobile ? 'Hozir qabul' : 'Hozir qabul (bemor shu yerda)'}
                      </span>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={(x) =>
          isNow
            ? confirmCompletion(
                modal,
                { total, paid: canReceive ? paidAmount(x.payment, total) : 0, canReceive, followUp: fuEnabled && fuDate && fuTime ? `${fuDate.format('DD.MM.YYYY')}, ${fuTime}` : undefined },
                () => submit(x),
              )
            : void submit(x)
        }
        requiredMark={false}
        scrollToFirstError
      >
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-6">
            {/* 1. Bemor */}
            <Panel title={<Step n={1} title="Bemor" />} bodyClassName="p-4 md:p-6">
              <div className="flex items-end gap-2">
                {!newPatient && (
                  <Form.Item name="patientId" label="Mavjud bemorni qidiring" rules={[{ required: true, message: 'Bemorni tanlang yoki yangisini qo‘shing' }]} className="flex-1">
                    <PatientSelect autoFocus onCreate={startNewPatient} placeholder="Ism, familiya, telefon yoki karta №" />
                  </Form.Item>
                )}
                <Button
                  className="mb-6"
                  type={newPatient ? 'default' : 'dashed'}
                  icon={newPatient ? <X size={16} strokeWidth={1.5} /> : <UserPlus size={16} strokeWidth={1.5} />}
                  onClick={() => (newPatient ? setNewPatient(false) : startNewPatient())}
                >
                  {newPatient ? 'Mavjud bemorni tanlash' : 'Yangi bemor'}
                </Button>
              </div>
              {newPatient && <NewPatientFields onPickExisting={pickExisting} />}

              {patient && !newPatient && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start gap-4 rounded-md bg-subtle p-4">
                    <UserAvatar name={`${patient.lastName} ${patient.firstName}`} size={48} />
                    <div className="min-w-0 flex-1">
                      <Link to={ROUTES.patient(patient.id)} className="text-base font-medium text-ink">
                        {patient.lastName} {patient.firstName}
                      </Link>
                      <div className="flex flex-wrap gap-x-3 text-sm text-muted">
                        <span className="tabular-nums">{patient.cardNo}</span>
                        <span>{[formatAge(patient.birthDate), genderLabel(patient.gender)].filter(Boolean).join(' · ')}</span>
                        <PhoneText phone={patient.phone} />
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 text-sm">
                        <span>
                          <span className="text-muted">Oxirgi tashrif:</span> {formatDate(patient.lastVisit)}
                        </span>
                        {patient.nextAppointment && (
                          <span className="text-warning">
                            <CalendarClock size={14} strokeWidth={1.5} className="mr-1 inline align-[-2px]" />
                            Allaqachon yozilgan: {formatRelativeDay(patient.nextAppointment)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted">Qarzdorlik</span>
                      {patient.debt > 0 ? <MoneyText value={patient.debt} debt strong className="text-lg" /> : <span className="font-medium text-success">Qarz yo‘q</span>}
                      {patient.debt > 0 && (
                        <Can perm="payment.receive">
                          <Button size="small" icon={<Wallet size={14} strokeWidth={1.5} />} onClick={() => openPayment({ patientId: patient.id })}>
                            Qarzni to‘lash
                          </Button>
                        </Can>
                      )}
                    </div>
                  </div>
                  <MedicalAlert patient={patient} />
                  {ortho && ortho.status !== 'FINISHED' && (
                    <Link to={ROUTES.orthoCase(ortho.id)} className="flex flex-wrap items-center gap-4 rounded-md bg-lime-soft px-4 py-3 text-ink no-underline">
                      <span className="text-sm font-medium">Breket bilan davolanmoqda</span>
                      <div className="w-56">
                        <StageBar stage={ortho.stage} />
                      </div>
                    </Link>
                  )}
                  {pastVisits.length > 0 && (
                    <div>
                      <div className="mb-1 text-xs text-muted">Oxirgi tashriflar</div>
                      <ul className="m-0 list-none divide-y divide-line-soft p-0 text-sm">
                        {pastVisits.map((a) => (
                          <li key={a.id} className="flex flex-wrap gap-x-3 py-2">
                            <span className="font-medium tabular-nums">{formatDate(a.start)}</span>
                            <span className="text-muted">{a.doctorName}</span>
                            <span className="min-w-0 flex-1">{a.serviceNames.join(', ')}</span>
                            <StatusTag meta={APPOINTMENT_STATUS[a.status]} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </Panel>

            {/* 2. Tish sxemasi va ishlar */}
            <Panel
              title={<Step n={2} title={isNow ? 'Tish sxemasi — nima qilindi' : 'Tish sxemasi — nima qilinadi'} />}
              extra={
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
              }
              bodyClassName="p-4 md:p-6"
            >
              {!hasPatient ? (
                <EmptyState compact title="Avval bemorni tanlang" description="Mavjud bemorning tish sxemasi shu yerda ochiladi" />
              ) : (
                <>
                  <ToothChart
                    records={previewRecords}
                    dentition={dent}
                    selected={armed ? items.filter((i) => i?.serviceId === armed.id && i.tooth).map((i) => i.tooth!) : selected}
                    onSelect={toggleTooth}
                  />

                  {armed && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md bg-lime-soft px-4 py-3 text-sm">
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{armed.name}</span> — sxemadan tish(lar)ni bosing, har biri ro‘yxatga qo‘shiladi. Qayta bosish — olib tashlaydi.
                      </span>
                      <Button size="small" type="primary" onClick={() => setArmed(null)}>
                        Tayyor
                      </Button>
                    </div>
                  )}

                  {selected.length ? (
                    <div className="mt-4 grid gap-4 rounded-md bg-lime-soft p-4 md:grid-cols-[auto_minmax(0,1fr)]">
                      <SurfaceEditor tooth={sortedSel[0]!} value={pendingSurfaces} onChange={setPendingSurfaces} />
                      <div className="flex min-w-0 flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-medium">Tanlangan tish: {sortedSel.join(', ')}</span>
                          <Button size="small" type="text" icon={<X size={14} strokeWidth={1.5} />} onClick={clearSelection}>
                            Bekor qilish
                          </Button>
                        </div>
                        {single !== null && (
                          <div className="text-sm text-muted">Hozirgi holati: {conditionsLabel(records.find((r) => r.tooth === single)?.conditions ?? [])}</div>
                        )}
                        <ol className="m-0 flex flex-col gap-1 pl-4 text-sm text-muted">
                          <li>Chapdagi sxemada tishning qaysi yuzasi davolanganini bosing (ixtiyoriy).</li>
                          <li>Quyidan xizmatni bosing — u tanlangan tish(lar)ga qo‘shiladi.</li>
                        </ol>
                      </div>
                    </div>
                  ) : (
                    !armed && (
                      <p className="m-0 mt-4 text-sm text-muted">
                        Xizmatni bosing: tishsiz xizmat (ko‘rik, gigiyena) darhol qo‘shiladi, «tishga» xizmatdan keyin sxemadan tishlarni bosasiz. Yoki avval tish(lar)ni tanlang.
                      </p>
                    )
                  )}

                  <div className="mt-4">
                    <ServicePicker onPick={addService} activeId={armed?.id} />
                  </div>

                  <div className="mt-4">
                    <ItemsList form={form} services={services} />
                  </div>
                  <div className="mt-4 border-t border-line-soft pt-4">
                    <ChartLegend />
                  </div>
                </>
              )}
            </Panel>

            {/* 3. Shifokor va vaqt */}
            <Panel title={<Step n={3} title={isNow ? 'Shifokor va kabinet' : 'Shifokor va vaqt'} />} bodyClassName="p-4 md:p-6">
              <div className="grid gap-x-3 md:grid-cols-2 xl:grid-cols-4">
                <Form.Item name="doctorId" label="Shifokor" rules={[{ required: true, message: 'Shifokorni tanlang' }]}>
                  <DoctorSelect date={dateStr} only={manageAll ? undefined : user ? [user.staffId] : []} />
                </Form.Item>
                {!isNow && (
                  <Form.Item name="date" label="Sana" rules={[{ required: true, message: 'Sanani tanlang' }]}>
                    <DatePicker
                      format="DD.MM.YYYY"
                      className="w-full"
                      allowClear={false}
                      disabledDate={(d) => !allowPast && d.isBefore(dayjs().startOf('day'))}
                      onChange={() => form.setFieldValue('time', undefined)}
                    />
                  </Form.Item>
                )}
                <Form.Item name="durationMin" label="Davomiylik" rules={[{ required: true }]}>
                  <Select options={DURATIONS.map((d) => ({ value: d, label: formatDuration(d) }))} />
                </Form.Item>
                <Form.Item name="chairId" label="Kabinet" rules={[{ required: true, message: 'Kabinetni tanlang' }]}>
                  <Select options={chairs.filter((c) => c.isActive).map((c) => ({ value: c.id, label: c.name }))} />
                </Form.Item>
              </div>
              <Form.Item name="time" label={isNow ? 'Boshlanish vaqti (bugun, eng yaqin bo‘sh)' : 'Vaqt (faqat bo‘sh slotlar)'} rules={[{ required: true, message: 'Vaqtni tanlang' }]}>
                <SlotPicker
                  slots={slots}
                  loading={slotsLoading && !slots.length}
                  disabled={!doctorId || !dateStr}
                  emptyText={isNow ? 'Shifokorning bugun bo‘sh vaqti yo‘q — boshqa shifokorni tanlang' : 'Bo‘sh vaqt yo‘q — boshqa sanani tanlang'}
                />
              </Form.Item>
              {conflict && <Alert type="error" showIcon className="mb-4" message={conflict} />}
              {!isNow && canBackdate && (
                <Form.Item name="allowPast" valuePropName="checked" className="-mt-2">
                  <Checkbox onChange={() => form.setFieldValue('time', undefined)}>Orqaga sana bilan yozish (faqat boshqaruvchi)</Checkbox>
                </Form.Item>
              )}
              <div className="grid gap-x-3 md:grid-cols-[minmax(0,1fr)_200px_200px]">
                <Form.Item name="note" label="Izoh" className={isNow ? 'mb-0 md:col-span-3' : 'mb-0'}>
                  <Input.TextArea rows={2} maxLength={300} placeholder={isNow ? 'Masalan: 36-tishga vaqtinchalik plomba' : 'Masalan: tish og‘riyapti, tezroq'} />
                </Form.Item>
                {!isNow && (
                  <>
                    <Form.Item name="source" label="Manba" className="mb-0">
                      <Select options={APPOINTMENT_SOURCES.map((s) => ({ value: s.value, label: s.label }))} />
                    </Form.Item>
                    <Form.Item
                      name="reminderEnabled"
                      label="Qo‘ng‘iroq bilan eslatish"
                      valuePropName="checked"
                      className="mb-0"
                      extra={patient && !patient.callConsent ? <span className="text-danger">Bemor rozilik bermagan</span> : undefined}
                    >
                      <Switch disabled={!!patient && !patient.callConsent} />
                    </Form.Item>
                  </>
                )}
              </div>
            </Panel>

            {/* 4. To‘lov va keyingi tashrif */}
            {isNow && (
              <Panel title={<Step n={4} title="To‘lov va keyingi tashrif" />} bodyClassName="p-4 md:p-6">
                <div className="grid gap-x-6 lg:grid-cols-2">
                  <div>
                    {canReceive ? (
                      <CompletionPaymentFields total={total} previousDebt={patient?.debt ?? 0} />
                    ) : (
                      <div className="mb-4 rounded-md bg-subtle px-4 py-3 text-sm text-muted">To‘lovni registratura qabul qiladi.</div>
                    )}
                  </div>
                  <div>
                    {doctorId ? (
                      <FollowUpFields doctorId={doctorId} suggestedServiceIds={[]} fallbackServiceId={services.find((x) => x.code === 'D001')?.id} />
                    ) : (
                      <div className="rounded-md bg-subtle px-4 py-3 text-sm text-muted">Keyingi tashrif uchun avval shifokorni tanlang</div>
                    )}
                  </div>
                </div>
              </Panel>
            )}
          </div>

          {/* O‘ng panel — qisqa xulosa */}
          <aside className="xl:sticky xl:top-24 xl:self-start">
            <Panel title="Xulosa" bodyClassName="p-4 md:p-5">
              <dl className="m-0 flex flex-col gap-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Bemor</dt>
                  <dd className="m-0 text-right font-medium">{patientLabel ?? <span className="font-normal text-muted">tanlanmagan</span>}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Shifokor</dt>
                  <dd className="m-0 text-right">{doctor?.fullName ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{isNow ? 'Boshlanishi' : 'Vaqt'}</dt>
                  <dd className="m-0 text-right tabular-nums">{dateStr && time ? `${dayjs(dateStr).format('DD.MM.YYYY')}, ${time}` : '—'}</dd>
                </div>
              </dl>

              <div className="my-4 border-t border-line-soft pt-3">
                <div className="mb-2 text-xs text-muted">{isNow ? 'Nima qilindi' : 'Nima qilinadi'}</div>
                {!items.length ? (
                  <div className="text-sm text-muted">Hali ish tanlanmagan</div>
                ) : (
                  <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
                    {items.map((it, i) => {
                      const svc = services.find((s) => s.id === it?.serviceId);
                      const surf = surfaceSummary(it?.tooth, it?.surfaces);
                      return (
                        <li key={i} className="flex justify-between gap-3">
                          <span className="min-w-0">
                            {it?.tooth && <span className="font-medium mr-1 tabular-nums">{it.tooth}</span>}
                            {svc?.name ?? '—'}
                            {surf && <span className="block text-xs text-muted">{surf}</span>}
                            {!!it?.discount && <span className="block text-xs text-muted">chegirma {it.discount}%</span>}
                          </span>
                          <MoneyText value={lineSum(it ?? {})} className="shrink-0" />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-line-soft pt-3 text-base">
                <span className="font-medium">Jami</span>
                <span className="font-medium text-lg tabular-nums">{formatMoney(total)}</span>
              </div>

              {isNow && canReceive && (
                <dl className="m-0 mt-3 flex flex-col gap-1.5 rounded-md bg-subtle px-3 py-2.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">To‘lov</dt>
                    <dd className="m-0 text-right">{PAY_MODE_LABEL[payment?.mode ?? 'FULL']}</dd>
                  </div>
                  {payment?.mode !== 'DEBT' && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">To‘lov turi</dt>
                      <dd className="m-0 text-right">{payment?.method ? PAYMENT_METHOD[payment.method] : '—'}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Hozir to‘lanadi</dt>
                    <dd className="m-0">
                      <MoneyText value={paidNow} strong />
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Qarz qoladi</dt>
                    <dd className="m-0">{total - paidNow > 0 ? <MoneyText value={total - paidNow} debt strong /> : <span className="font-medium text-success">yo‘q</span>}</dd>
                  </div>
                </dl>
              )}
              {isNow && (
                <div className="mt-2 text-sm">
                  <span className="text-muted">Keyingi tashrif: </span>
                  {fuEnabled && fuDate && fuTime ? `${fuDate.format('DD.MM.YYYY')}, ${fuTime}` : 'belgilanmagan'}
                </div>
              )}

              <Button type="primary" size="large" block className="mt-4" loading={busy} disabled={!!conflict} onClick={() => form.submit()}>
                {isNow ? 'Saqlash va qabulni yakunlash' : 'Qabulga yozish'}
              </Button>
              <Button block type="text" className="mt-2" onClick={() => navigate(-1)}>
                Bekor qilish
              </Button>
            </Panel>
          </aside>
        </div>
      </Form>
      {result.receipt}
    </>
  );
};

/** Har safar "Yangi qabul" bosilganda forma toza holatda ochiladi */
export const NewAppointmentPage = () => {
  const location = useLocation();
  return <NewAppointmentForm key={location.key} />;
};
