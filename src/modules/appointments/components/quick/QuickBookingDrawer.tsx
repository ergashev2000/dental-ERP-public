import { App, Button, DatePicker, Drawer, Input, Segmented, Select, Skeleton, Switch } from 'antd';
import type { Dayjs } from 'dayjs';
import { Check, CircleCheck, Hourglass, Plus, Search, UserPlus } from '@/shared/icons';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { InputRef } from 'antd';
import { useNavigate } from 'react-router';
import { DoctorSelect, MedicalAlert, MoneyText, PhoneInput, ServiceSelect, StatusTag, UserAvatar } from '@/shared/components/ui';
import { APPOINTMENT_SOURCES } from '@/shared/constants/options';
import { ROUTES } from '@/shared/constants/routes';
import dayjs from '@/shared/lib/dayjs';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { useCurrentUser, usePermission } from '@/shared/hooks/usePermission';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { formatDuration, formatMoney, formatRelativeDay, isValidUzPhone } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import { usePatient, usePatientSearch, usePhoneOwner, useSavePatient, type PatientRow } from '@/modules/patients';
import { usePopularServiceIds, useServices } from '@/modules/services';
import { useChairs } from '@/modules/settings';
import { useCreateAppointment, useSlotCheck, useSlots } from '../../hooks/useAppointments';
import { useAddWaitlist, useResolveOnline, useResolveWaitlist, useSuggestSlots } from '../../hooks/useBooking';
import { useNewAppointment, type AppointmentPrefill } from '../../store/appointmentModalStore';
import type { SlotSuggestion } from '../../types';
import { SlotPicker } from '../SlotPicker';

/**
 * Tezkor qabul (TZ 4-bo'lim): 3 qadam — bemor → xizmat → vaqt.
 * Davomiylik, shifokor, kreslo va eng yaqin bo'sh vaqtlar tizim tomonidan taklif qilinadi; xodim faqat tasdiqlaydi.
 * Tish sxemasi va muolajalar bilan to'liq shakl — "To'liq shakl" havolasi (Hozir qabul ham o'sha yerda).
 */

/** Qidiruv matnidan yangi bemor: raqam bo'lsa — telefon, aks holda — familiya va ism */
const fromSearch = (text: string) => {
  const digits = text.replace(/\D/g, '');
  if (digits.length >= 5 && /^[\d\s()+-]+$/.test(text)) {
    return { lastName: '', firstName: '', phone: `+998${(digits.startsWith('998') && digits.length > 9 ? digits.slice(3) : digits).slice(0, 9)}` };
  }
  const [lastName = '', ...rest] = text.split(/\s+/).filter(Boolean);
  return { lastName, firstName: rest.join(' '), phone: '' };
};

const Step = ({ n, title, done, disabled, aside, children }: { n: number; title: string; done?: boolean; disabled?: boolean; aside?: ReactNode; children: ReactNode }) => (
  <section className={cn('flex flex-col gap-3', disabled && 'pointer-events-none opacity-40')} aria-disabled={disabled}>
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'grid size-7 shrink-0 place-items-center rounded-full text-xs tabular-nums',
          done ? 'bg-ink text-on-ink' : disabled ? 'bg-subtle text-muted' : 'bg-lime text-on-lime',
        )}
        aria-hidden
      >
        {done ? <Check size={14} strokeWidth={2} /> : n}
      </span>
      <h3 className="m-0 flex-1 text-base font-normal">{title}</h3>
      {aside}
    </div>
    <div className="pl-10">{children}</div>
  </section>
);

/* ---------- 1. Bemor ---------- */

const PatientStep = ({ prefill, patient, onPick }: { prefill: AppointmentPrefill; patient: PatientRow | null; onPick: (p: PatientRow | null) => void }) => {
  const { message } = App.useApp();
  const [q, setQ] = useState(prefill.search ?? '');
  const [creating, setCreating] = useState(false);
  const [np, setNp] = useState({ lastName: '', firstName: '', phone: '' });
  const search = usePatientSearch(q.trim(), q.trim().length >= 2 && !patient);
  const inputRef = useRef<InputRef>(null);
  const [pendingEnter, setPendingEnter] = useState(false);
  // Drawer ochilish animatsiyasidan keyin qidiruvga fokus
  useEffect(() => {
    if (patient || creating) return;
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, [patient, creating]);
  const owner = usePhoneOwner(creating ? np.phone : undefined);
  const save = useSavePatient();
  // Eski so'rov natijasi (placeholder) Enter bilan tanlanib ketmasin
  const fresh = !search.isPlaceholderData && !search.isFetching;
  // Familiya/ism boshidan mos kelganlar birinchi (otasining ismi bo'yicha moslar keyin)
  const results = useMemo(() => {
    const n = q.trim().toLowerCase();
    const score = (p: PatientRow) => (p.lastName.toLowerCase().startsWith(n) ? 0 : p.firstName.toLowerCase().startsWith(n) ? 1 : 2);
    return [...(search.data ?? [])].sort((a, b) => score(a) - score(b)).slice(0, 6);
  }, [search.data, q]);

  const enter = () => {
    setPendingEnter(false);
    if (results.length) onPick(results.at(0)!);
    else if (q.trim()) startCreate();
  };
  // Onlayn so'rovdan: telefon bazada bo'lmasa — yangi bemor formasi ism va telefon bilan darhol ochiladi
  const autoCreated = useRef(false);
  useEffect(() => {
    if (autoCreated.current || !prefill.newPatientName || patient || !fresh || !search.data || results.length) return;
    autoCreated.current = true;
    startCreate();
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- bir marta, qidiruv natijasi kelganda
  }, [fresh, search.data]);

  // Qidiruv tugamasdan Enter bosilgan bo'lsa — natija kelgach tanlanadi
  useEffect(() => {
    if (pendingEnter && fresh) enter();
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- natija kelganda bir marta
  }, [pendingEnter, fresh]);

  const startCreate = () => {
    const base = fromSearch(q.trim());
    if (prefill.newPatientName) {
      const [lastName = '', ...rest] = prefill.newPatientName.split(/\s+/);
      base.lastName = lastName;
      base.firstName = rest.join(' ');
    }
    setNp(base);
    setCreating(true);
  };

  const saveNew = async () => {
    try {
      const created = await save.mutateAsync({
        input: { lastName: np.lastName.trim(), firstName: np.firstName.trim(), phone: np.phone, tags: [], allergies: [], conditions: [], medications: [], callConsent: true },
      });
      message.success('Bemor qo‘shildi');
      setCreating(false);
      onPick(created);
    } catch (e) {
      message.error(errorMessage(e));
    }
  };

  if (patient) {
    return (
      <div className="flex flex-col gap-2 rounded-md bg-subtle p-3">
        <div className="flex items-center gap-3">
          <UserAvatar name={`${patient.lastName} ${patient.firstName}`} size={40} />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate font-medium">
              {patient.lastName} {patient.firstName}
            </div>
            <div className="text-xs text-muted tabular-nums">
              {patient.cardNo} · {patient.phone}
            </div>
          </div>
          {patient.debt > 0 && (
            <span className="text-right text-xs text-muted">
              Qarz
              <br />
              <MoneyText value={patient.debt} debt />
            </span>
          )}
          <Button type="text" size="small" onClick={() => onPick(null)}>
            O‘zgartirish
          </Button>
        </div>
        <MedicalAlert patient={patient} compact />
      </div>
    );
  }

  if (creating) {
    const valid = np.lastName.trim().length >= 2 && np.firstName.trim().length >= 2 && isValidUzPhone(np.phone);
    return (
      <div className="flex flex-col gap-3 rounded-md bg-subtle p-3">
        <div className="text-xs text-muted">Yangi bemor — ism va telefon yetarli, qolganini keyin kartada to‘ldirasiz</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input className="bg-surface" placeholder="Familiya" value={np.lastName} onChange={(e) => setNp({ ...np, lastName: e.target.value })} autoFocus={!np.lastName} />
          <Input className="bg-surface" placeholder="Ism" value={np.firstName} onChange={(e) => setNp({ ...np, firstName: e.target.value })} />
        </div>
        <PhoneInput className="bg-surface" value={np.phone} onChange={(v: string) => setNp({ ...np, phone: v })} />
        {owner.data && (
          <div className="flex items-center justify-between gap-2 rounded-md bg-warning-soft px-3 py-2 text-sm text-warning">
            <span>
              Bu raqam {owner.data.name} ({owner.data.cardNo}) ga tegishli
            </span>
            <Button
              size="small"
              onClick={() => {
                setQ(owner.data!.cardNo);
                setCreating(false);
              }}
            >
              Topish
            </Button>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button type="text" onClick={() => setCreating(false)}>
            Orqaga
          </Button>
          <Button type="primary" disabled={!valid || !!owner.data} loading={save.isPending} onClick={() => void saveNew()}>
            Qo‘shish va davom etish
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        ref={inputRef}
        size="large"
        allowClear
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onPressEnter={() => (fresh ? enter() : setPendingEnter(true))}
        prefix={<Search size={18} strokeWidth={1.5} className="text-muted" />}
        placeholder="Ism, telefon yoki karta №"
        aria-label="Bemorni qidirish"
      />
      {q.trim().length >= 2 && (
        <ul className="m-0 flex list-none flex-col gap-1 p-0" aria-label="Topilgan bemorlar">
          {search.isFetching && !results.length && <Skeleton active paragraph={{ rows: 2 }} title={false} />}
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onPick(p)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-md bg-transparent px-2 py-2 text-left transition-colors duration-150 hover:bg-subtle"
              >
                <UserAvatar name={`${p.lastName} ${p.firstName}`} size={32} />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-sm text-ink">
                    {p.lastName} {p.firstName}
                  </span>
                  <span className="block text-xs text-muted tabular-nums">
                    {p.cardNo} · {p.phone}
                  </span>
                </span>
                {p.debt > 0 && <StatusTag tone="danger">Qarz</StatusTag>}
              </button>
            </li>
          ))}
          {!search.isFetching && !results.length && <li className="px-2 py-1 text-sm text-muted">Bunday bemor topilmadi</li>}
        </ul>
      )}
      <Button className="self-start" icon={<UserPlus size={18} strokeWidth={1.5} />} onClick={startCreate}>
        {q.trim() && !results.length ? `Yangi bemor: ${q.trim()}` : 'Yangi bemor'}
      </Button>
    </div>
  );
};

/* ---------- 2. Xizmat ---------- */

const ServiceStep = ({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) => {
  const { data: services = [] } = useServices({ activeOnly: true });
  const { data: popular = [] } = usePopularServiceIds();
  const chips = useMemo(() => {
    const ids = popular.length ? popular : services.map((s) => s.id);
    return ids
      .map((id) => services.find((s) => s.id === id))
      .filter((s) => !!s)
      .slice(0, 8);
  }, [popular, services]);
  const chipIds = useMemo(() => new Set(chips.map((s) => s.id)), [chips]);
  const chosen = services.filter((s) => value.includes(s.id));
  const duration = chosen.reduce((m, s) => m + s.durationMin, 0);
  const price = chosen.reduce((m, s) => m + s.price, 0);
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Ko‘p tanlanadigan xizmatlar">
        {chips.map((s) => {
          const on = value.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(s.id)}
              className={cn(
                'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-pill px-3.5 text-sm transition-colors duration-150',
                on ? 'bg-ink text-on-ink' : 'bg-subtle text-ink hover:bg-subtle-strong',
              )}
            >
              {on && <Check size={14} strokeWidth={2} />}
              {s.name}
            </button>
          );
        })}
      </div>
      <ServiceSelect
        mode="multiple"
        value={value.filter((id) => !chipIds.has(id))}
        onChange={(ids) => onChange([...value.filter((id) => chipIds.has(id)), ...ids])}
        filter={(s) => !chipIds.has(s.id)}
        placeholder="Boshqa xizmat qidirish"
      />
      {chosen.length > 0 && (
        <div className="text-xs text-muted">
          {formatDuration(duration)} · taxminan {formatMoney(price)}
        </div>
      )}
    </div>
  );
};

/* ---------- 3. Vaqt ---------- */

interface Picked {
  doctorId: string;
  chairId: string;
  start: string;
  durationMin: number;
  label: string;
}

const SuggestionButton = ({ s, selected, onClick }: { s: SlotSuggestion; selected: boolean; onClick: () => void }) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onClick}
    className={cn(
      'flex cursor-pointer flex-col gap-0.5 rounded-md px-3 py-2.5 text-left transition-colors duration-150',
      selected ? 'bg-lime-soft ring-2 ring-inset ring-ink' : 'bg-subtle hover:bg-subtle-strong',
    )}
  >
    <span className="text-base tabular-nums text-ink">{formatRelativeDay(s.start)}</span>
    <span className="truncate text-xs text-muted">
      {s.doctorName} · {s.chairName}
    </span>
    {s.usualDoctor && <span className="text-xs text-ink">Odatdagi shifokori</span>}
  </button>
);

const TimeStep = ({
  prefill,
  patient,
  serviceIds,
  durationMin,
  picked,
  onPick,
  onWaitlist,
}: {
  prefill: AppointmentPrefill;
  patient: PatientRow | null;
  serviceIds: string[];
  durationMin: number;
  picked: Picked | null;
  onPick: (p: Picked | null) => void;
  onWaitlist: (doctorId?: string) => void;
}) => {
  const user = useCurrentUser();
  const manageAll = usePermission('appointment.manageAll');
  const { data: chairs = [] } = useChairs();
  const [doctorId, setDoctorId] = useState<string | undefined>(prefill.doctorId);
  const [manual, setManual] = useState(false);
  const [date, setDate] = useState<Dayjs>(dayjs(prefill.date ?? prefill.start ?? undefined));
  const [time, setTime] = useState<string | undefined>();
  const [chairId, setChairId] = useState<string | undefined>(prefill.chairId);
  const only = manageAll ? undefined : user ? [user.staffId] : [];

  const suggest = useSuggestSlots({ serviceIds, durationMin, doctorId, patientId: patient?.id, from: prefill.date }, !manual);
  const dateStr = date.format('YYYY-MM-DD');
  const slots = useSlots({ doctorId: manual ? doctorId : undefined, date: dateStr, durationMin });
  const manualStart = time ? dayjs(`${dateStr} ${time}`, 'YYYY-MM-DD HH:mm').toISOString() : undefined;
  const activeChair = chairId ?? chairs.find((c) => c.isActive)?.id;
  const check = useSlotCheck({ doctorId: manual ? doctorId : undefined, chairId: activeChair, start: manualStart, durationMin });

  // Kalendardagi bo'sh katakdan ochilgan bo'lsa — o'sha vaqt oldindan tanlanadi
  const fromCalendar = prefill.start && prefill.doctorId ? prefill : null;
  const calendarCheck = useSlotCheck({
    doctorId: fromCalendar?.doctorId,
    chairId: fromCalendar?.chairId ?? chairs.find((c) => c.isActive)?.id,
    start: fromCalendar?.start,
    durationMin,
  });
  useEffect(() => {
    if (!fromCalendar || picked || calendarCheck.data?.error !== null || !calendarCheck.data) return;
    onPick({
      doctorId: fromCalendar.doctorId!,
      chairId: fromCalendar.chairId ?? chairs.find((c) => c.isActive)?.id ?? '',
      start: fromCalendar.start!,
      durationMin,
      label: formatRelativeDay(fromCalendar.start),
    });
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- faqat tekshiruv natijasi kelganda
  }, [calendarCheck.data]);

  // Manual tanlov to'liq va konfliktsiz bo'lsa — tanlangan hisoblanadi
  useEffect(() => {
    if (!manual) return;
    if (doctorId && manualStart && activeChair && check.data && !check.data.error) {
      onPick({ doctorId, chairId: activeChair, start: manualStart, durationMin, label: formatRelativeDay(manualStart) });
    } else onPick(null);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- tanlov o'zgarganda
  }, [manual, doctorId, manualStart, activeChair, check.data]);

  const list = suggest.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <DoctorSelect allowClear value={doctorId} onChange={(id) => setDoctorId(id)} placeholder="Istalgan shifokor" className="min-w-52 flex-1" only={only} />
        <Segmented
          value={manual ? 'manual' : 'auto'}
          onChange={(v) => {
            setManual(v === 'manual');
            onPick(null);
          }}
          options={[
            { value: 'auto', label: 'Eng yaqin' },
            { value: 'manual', label: 'Sana tanlash' },
          ]}
        />
      </div>

      {!manual && (
        <>
          {suggest.isLoading ? (
            <Skeleton active paragraph={{ rows: 3 }} title={false} />
          ) : list.length ? (
            <div className="grid grid-cols-2 gap-1.5" role="listbox" aria-label="Taklif qilingan vaqtlar">
              {list.map((s) => (
                <SuggestionButton
                  key={`${s.doctorId}-${s.start}`}
                  s={s}
                  selected={picked?.start === s.start && picked.doctorId === s.doctorId}
                  onClick={() => onPick({ doctorId: s.doctorId, chairId: s.chairId, start: s.start, durationMin: s.durationMin, label: formatRelativeDay(s.start) })}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-md bg-warning-soft px-3 py-2.5 text-sm text-warning">Yaqin 3 haftada mos bo‘sh vaqt topilmadi</div>
          )}
        </>
      )}

      {manual && (
        <div className="flex flex-col gap-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <DatePicker value={date} onChange={(d) => d && setDate(d)} format="DD.MM.YYYY" allowClear={false} disabledDate={(d) => d.isBefore(dayjs().startOf('day'))} />
            <Select
              value={activeChair}
              onChange={setChairId}
              options={chairs.filter((c) => c.isActive).map((c) => ({ value: c.id, label: c.name }))}
              aria-label="Kabinet"
            />
          </div>
          <SlotPicker value={time} onChange={setTime} slots={slots.data ?? []} loading={slots.isFetching && !slots.data} disabled={!doctorId} />
          {check.data?.error && <div className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{check.data.error}</div>}
        </div>
      )}

      {patient && (
        <Button type="link" className="self-start !px-0" icon={<Hourglass size={16} strokeWidth={1.5} />} onClick={() => onWaitlist(doctorId)}>
          Mos vaqt yo‘q — kutish ro‘yxatiga qo‘shish
        </Button>
      )}
    </div>
  );
};

/* ---------- Oyna ---------- */

const Body = ({ prefill, onClose }: { prefill: AppointmentPrefill; onClose: () => void }) => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { data: preset } = usePatient(prefill.patientId);
  const { data: services = [] } = useServices({ activeOnly: true });
  const create = useCreateAppointment();
  const addWaitlist = useAddWaitlist();
  const resolveOnline = useResolveOnline();
  const resolveWaitlist = useResolveWaitlist();

  const [patient, setPatient] = useState<PatientRow | null>(null);
  const [serviceIds, setServiceIds] = useState<string[]>(prefill.serviceIds ?? []);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [more, setMore] = useState(!!prefill.note);
  const [note, setNote] = useState(prefill.note ?? '');
  const [source, setSource] = useState(prefill.source ?? 'PHONE');
  const [reminder, setReminder] = useState(true);
  const [done, setDone] = useState<{ id: string; reminders: number; label: string } | null>(null);

  useEffect(() => {
    if (preset && !patient) setPatient(preset);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- faqat oldindan berilgan bemor yuklanganda
  }, [preset]);

  const durationMin = Math.max(15, services.filter((s) => serviceIds.includes(s.id)).reduce((m, s) => m + s.durationMin, 0));
  const ready = !!patient && serviceIds.length > 0 && !!picked;

  const submit = async () => {
    if (!ready || !patient || !picked) return;
    try {
      const res = await create.mutateAsync({
        patientId: patient.id,
        doctorId: picked.doctorId,
        chairId: picked.chairId,
        start: picked.start,
        durationMin: picked.durationMin,
        serviceIds,
        note: note.trim() || undefined,
        source,
        reminderEnabled: reminder,
      });
      if (prefill.onlineRequestId) await resolveOnline.mutateAsync({ id: prefill.onlineRequestId, status: 'APPROVED' });
      if (prefill.waitlistId) await resolveWaitlist.mutateAsync({ id: prefill.waitlistId, status: 'BOOKED' });
      setDone({ id: res.appointment.id, reminders: res.reminders, label: `${picked.label} · ${res.appointment.doctorName}` });
    } catch (e) {
      message.error(errorMessage(e));
    }
  };

  const toWaitlist = async (doctorId?: string) => {
    if (!patient || !serviceIds.length) {
      message.warning('Avval bemor va xizmatni tanlang');
      return;
    }
    try {
      await addWaitlist.mutateAsync({
        patientId: patient.id,
        serviceIds,
        doctorId,
        from: dayjs().format('YYYY-MM-DD'),
        to: dayjs().add(14, 'day').format('YYYY-MM-DD'),
        note: note.trim() || undefined,
      });
      message.success('Kutish ro‘yxatiga qo‘shildi — vaqt bo‘shasa taklif qilinadi');
      onClose();
    } catch (e) {
      message.error(errorMessage(e));
    }
  };

  const openFull = () => {
    const q = new URLSearchParams();
    if (patient) q.set('patient', patient.id);
    if (picked) {
      q.set('doctor', picked.doctorId);
      q.set('chair', picked.chairId);
      q.set('start', picked.start);
    }
    onClose();
    navigate(`${ROUTES.newAppointment}${q.size ? `?${q.toString()}` : ''}`);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-lime text-on-lime" aria-hidden>
          <CircleCheck size={28} strokeWidth={1.5} />
        </span>
        <div>
          <h3 className="m-0 text-xl font-normal">Qabul yozildi</h3>
          <p className="m-0 mt-1 text-sm text-muted">
            {patient?.lastName} {patient?.firstName} · {done.label}
          </p>
          {done.reminders > 0 && <p className="m-0 mt-1 text-xs text-muted">{done.reminders} ta eslatma navbatga qo‘shildi</p>}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              onClose();
              navigate(`${ROUTES.appointments}?date=${dayjs(picked?.start).format('YYYY-MM-DD')}&appointment=${done.id}`);
            }}
          >
            Kalendarda ko‘rish
          </Button>
          <Button
            type="primary"
            icon={<Plus size={18} strokeWidth={1.5} />}
            onClick={() => {
              setDone(null);
              setPatient(null);
              setServiceIds([]);
              setPicked(null);
              setNote('');
            }}
          >
            Yana qabul
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void submit();
      }}
    >
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
      <Step n={1} title="Bemor" done={!!patient}>
        <PatientStep prefill={prefill} patient={patient} onPick={setPatient} />
      </Step>
      <Step n={2} title="Nima qilinadi" done={serviceIds.length > 0} disabled={!patient}>
        <ServiceStep
          value={serviceIds}
          onChange={(ids) => {
            setServiceIds(ids);
            setPicked(null);
          }}
        />
      </Step>
      <Step n={3} title="Qachon" done={!!picked} disabled={!patient || !serviceIds.length}>
        {patient && serviceIds.length > 0 && (
          <TimeStep prefill={prefill} patient={patient} serviceIds={serviceIds} durationMin={durationMin} picked={picked} onPick={setPicked} onWaitlist={(d) => void toWaitlist(d)} />
        )}
      </Step>

      <div className="flex flex-col gap-3 border-t border-line-soft pt-4">
        <button type="button" className="cursor-pointer self-start bg-transparent p-0 text-sm text-muted hover:text-ink" onClick={() => setMore(!more)} aria-expanded={more}>
          {more ? 'Qo‘shimchani yashirish' : 'Izoh, manba, eslatma'}
        </button>
        {more && (
          <div className="flex flex-col gap-3">
            <Input.TextArea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Izoh (masalan, og‘riq bor, ertalab qulay)" maxLength={300} />
            <Select value={source} onChange={setSource} options={APPOINTMENT_SOURCES.map((s) => ({ value: s.value, label: s.label }))} aria-label="Manba" />
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>
                Qo‘ng‘iroq bilan eslatish
                {patient && !patient.callConsent && <span className="block text-xs text-muted">Bemor qo‘ng‘iroqqa rozilik bermagan</span>}
              </span>
              <Switch checked={reminder && (patient?.callConsent ?? true)} onChange={setReminder} disabled={!!patient && !patient.callConsent} />
            </label>
          </div>
        )}
      </div>

      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line-soft bg-surface px-6 py-4">
        <div className="min-w-0 flex-1 text-sm">
          {picked ? (
            <span className="text-ink">{picked.label}</span>
          ) : (
            <span className="text-muted">{!patient ? 'Bemorni tanlang' : !serviceIds.length ? 'Xizmatni tanlang' : 'Vaqtni tanlang'}</span>
          )}
          <button type="button" className="block cursor-pointer bg-transparent p-0 text-xs text-muted hover:text-ink" onClick={openFull}>
            To‘liq shakl (tish sxemasi bilan)
          </button>
        </div>
        <Button onClick={onClose}>Bekor qilish</Button>
        <Button type="primary" disabled={!ready} loading={create.isPending} onClick={() => void submit()}>
          Qabulga yozish
        </Button>
      </div>
    </div>
  );
};

/** Global tezkor qabul oynasi — useNewAppointment().show() bilan ochiladi */
export const QuickBookingDrawer = () => {
  const { open, mode, prefill, close } = useNewAppointment();
  const isMobile = useIsMobile();
  const isOpen = open && mode === 'create' && !prefill.full;
  return (
    <Drawer
      open={isOpen}
      onClose={close}
      width={isMobile ? '100%' : 520}
      title="Yangi qabul"
      destroyOnHidden
      styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
    >
      {isOpen && <Body prefill={prefill} onClose={close} />}
    </Drawer>
  );
};
