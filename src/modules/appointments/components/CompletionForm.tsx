import { Alert, App, Button, Form, Input, InputNumber, Select, Skeleton, type FormInstance } from 'antd';
import { ChevronDown, ChevronUp, Plus, Trash2 } from '@/shared/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MedicalAlert, MoneyInput, ServiceSelect } from '@/shared/components/ui';
import { usePermission } from '@/shared/hooks/usePermission';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { formatMoney, formatNumber } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';
import dayjs from '@/shared/lib/dayjs';
import { useServices } from '@/modules/services';
import { toothOptions } from '@/modules/treatments';
import { usePatient } from '@/modules/patients';
import { useCompleteAppointment, useCompletionDraft } from '../hooks/useAppointments';
import type { CompleteItem, CompleteResult } from '../types';
import { CompletionPaymentFields } from './CompletionPaymentFields';
import { paidAmount, type CompletionPaymentValues } from '../utils';
import { FollowUpFields, type FollowUpValues } from './FollowUpFields';
import { SurfacePickerButton } from './SurfacePicker';
import { confirmCompletion } from './confirmCompletion';

export interface CompletionValues {
  items: CompleteItem[];
  materials: { productId: string; qty: number }[];
  doctorNote?: string;
  payment?: CompletionPaymentValues;
  followUp: FollowUpValues;
}

/** Barqaror bo'sh massivlar (useMemo bog'liqligi har renderda o'zgarmasin) */
const NO_ITEMS: Partial<CompleteItem>[] = [];
const NO_MATERIALS: Partial<CompletionValues['materials'][number]>[] = [];

export const Step = ({ n, title, hint }: { n: number; title: string; hint?: string }) => (
  <div className="mb-3 flex items-center gap-2">
    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-lime text-xs text-on-lime">{n}</span>
    <span className="font-medium">{title}</span>
    {hint && <span className="ml-auto hidden text-xs text-muted sm:inline">{hint}</span>}
  </div>
);

interface Props {
  appointmentId: string;
  form: FormInstance<CompletionValues>;
  onCompleted: (res: CompleteResult) => void;
  onCancel?: () => void;
  /** Tor ustun (qabul sahifasining o'ng paneli) — qatorlar ikki qavatli */
  narrow?: boolean;
  /** Tibbiy ogohlantirish — sahifada tepada alohida ko'rsatilgani uchun o'chiriladi */
  showMedical?: boolean;
}

/**
 * Qabulni bitta formada yopish: bajarilgan ish → to'lov (to'liq / qisman / qarz) → keyingi tashrif.
 * Muolajalar hisob-fakturaga, materiallar ombordan (muddati yaqinidan boshlab) chiqim qilinadi.
 * Oynada ham, qabul sahifasida ham ishlatiladi.
 */
export const CompletionForm = ({ appointmentId, form, onCompleted, onCancel, narrow, showMedical = true }: Props) => {
  const { message, modal } = App.useApp();
  const { data: draft, isLoading } = useCompletionDraft(appointmentId);
  const { data: services = [] } = useServices();
  const complete = useCompleteAppointment();
  const canReceive = usePermission('payment.receive');
  const { data: patient } = usePatient(draft?.appointment.patientId || null);
  const [showMaterials, setShowMaterials] = useState(false);

  const items = (Form.useWatch('items', form) ?? NO_ITEMS) as Partial<CompleteItem>[];
  const materials = (Form.useWatch('materials', form) ?? NO_MATERIALS) as Partial<CompletionValues['materials'][number]>[];
  const serviceKey = items.map((i) => i?.serviceId ?? '').join(',');

  // Boshlang'ich qatorlar: qabul xizmatlari, mos reja qatori bo'lsa undan (tish va chegirma bilan)
  const initFor = useRef<string | null>(null);
  useEffect(() => {
    if (!draft || !services.length || initFor.current === draft.appointment.id) return;
    initFor.current = draft.appointment.id;
    const used = new Set<string>();
    // Yozishda tish bilan belgilangan ishlar bo'lsa — ular asos bo'ladi
    const planned = draft.appointment.plannedItems;
    if (planned?.length) {
      form.setFieldsValue({
        items: planned.map((it): CompleteItem => {
          const plan = draft.planItems.find((p) => p.serviceId === it.serviceId && p.tooth === it.tooth && !used.has(p.id));
          if (plan) used.add(plan.id);
          return { ...it, planItemId: plan?.id };
        }),
        doctorNote: draft.appointment.note,
        payment: { mode: 'FULL', method: 'CASH' },
        followUp: { enabled: false, durationMin: 30, serviceIds: [] },
      });
      return;
    }
    const initial = draft.appointment.serviceIds.map((sid): CompleteItem => {
      const plan = draft.planItems.find((p) => p.serviceId === sid && !used.has(p.id));
      if (plan) used.add(plan.id);
      const svc = services.find((s) => s.id === sid);
      return { planItemId: plan?.id, serviceId: sid, tooth: plan?.tooth, price: plan?.price ?? svc?.price ?? 0, discount: plan?.discount ?? 0 };
    });
    form.setFieldsValue({
      items: initial,
      doctorNote: draft.appointment.note,
      payment: { mode: 'FULL', method: 'CASH' },
      followUp: { enabled: false, durationMin: 30, serviceIds: [] },
    });
  }, [draft, services, form]);

  // Material normasi: xizmatlar o'zgarganda qayta hisoblanadi (keyin qo'lda o'zgartirish mumkin)
  useEffect(() => {
    const agg = new Map<string, number>();
    for (const it of items) {
      const svc = services.find((s) => s.id === it?.serviceId);
      for (const m of svc?.materials ?? []) agg.set(m.productId, +((agg.get(m.productId) ?? 0) + m.qty).toFixed(3));
    }
    form.setFieldValue('materials', [...agg.entries()].map(([productId, qty]) => ({ productId, qty })));
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- faqat xizmatlar ro'yxati o'zgarganda qayta hisoblanadi
  }, [serviceKey, services]);

  const products = useMemo(() => draft?.products ?? [], [draft]);
  const shortages = useMemo(
    () =>
      materials
        .map((m) => {
          const p = products.find((x) => x.id === m?.productId);
          return p && (m?.qty ?? 0) > p.usable + 1e-9 ? { ...p, need: m!.qty! } : null;
        })
        .filter((x): x is NonNullable<typeof x> => !!x),
    [materials, products],
  );
  // Rejada qolgan (bu qabulda bajarilmayotgan) xizmatlar — keyingi tashrif uchun taklif
  const suggested = useMemo(
    () => [...new Set((draft?.planItems ?? []).filter((p) => !items.some((i) => i?.planItemId === p.id)).map((p) => p.serviceId))],
    [draft, items],
  );
  const total = items.reduce((s, i) => s + Math.round((i?.price ?? 0) * (1 - (i?.discount ?? 0) / 100)), 0);
  // Omborda yetmasa — materiallar bo'limi o'zi ochiladi
  const materialsOpen = showMaterials || shortages.length > 0;
  const materialCount = materials.filter((m) => (m?.qty ?? 0) > 0).length;

  const submit = (v: CompletionValues) => {
    const fu = v.followUp;
    const followUp =
      fu?.enabled && fu.date && fu.time
        ? {
            start: dayjs(`${fu.date.format('YYYY-MM-DD')} ${fu.time}`, 'YYYY-MM-DD HH:mm').toISOString(),
            durationMin: fu.durationMin,
            serviceIds: fu.serviceIds,
            note: fu.note,
          }
        : undefined;
    const amount = canReceive ? paidAmount(v.payment, total) : 0;
    const payment = amount > 0 && v.payment ? { amount, method: v.payment.method } : undefined;
    confirmCompletion(modal, { total, paid: amount, canReceive, followUp: followUp && dayjs(followUp.start).format('DD.MM.YYYY, HH:mm') }, () =>
      complete
        .mutateAsync({ appointmentId, items: v.items, materials: (v.materials ?? []).filter((m) => m.qty > 0), doctorNote: v.doctorNote, followUp, payment })
        .then(
          (res) => {
            if (res.warnings.length) modal.warning({ title: 'Ombor ogohlantirishi', content: res.warnings.map((w) => <p key={w}>{w}</p>) });
            onCompleted(res);
          },
          (e: unknown) => message.error(errorMessage(e)),
        ),
    );
  };

  if (isLoading || !draft) return <Skeleton active paragraph={{ rows: 8 }} />;

  return (
    <Form form={form} layout="vertical" onFinish={submit} requiredMark={false} scrollToFirstError>
      {showMedical && patient && (
        <div className="mb-4">
          <MedicalAlert patient={patient} compact />
        </div>
      )}

      <Step n={1} title="Nima qilindi" hint={narrow ? undefined : 'Xizmat · tish · narx · chegirma %'} />
      <Form.List name="items">
        {(fields, { add, remove }) => (
          <div className="mb-4 flex flex-col gap-2">
            {!fields.length && <div className="rounded-md bg-subtle px-3 py-2.5 text-sm text-muted">Hali muolaja qo‘shilmagan</div>}
            {fields.map((f) => {
              const it = items[f.name];
              const svc = services.find((s) => s.id === it?.serviceId);
              return (
                <div
                  key={f.key}
                  className={cn(
                    'grid grid-cols-2 items-start gap-2 rounded-md bg-subtle p-2',
                    !narrow && 'md:grid-cols-[minmax(0,1fr)_100px_88px_140px_112px_36px] md:bg-transparent md:p-0',
                    narrow && 'grid-cols-[1fr_1fr_36px]',
                  )}
                >
                  <Form.Item
                    name={[f.name, 'serviceId']}
                    rules={[{ required: true, message: 'Xizmatni tanlang' }]}
                    className={cn('mb-0', narrow ? 'col-span-3' : 'col-span-2 md:col-span-1')}
                  >
                    <ServiceSelect
                      onChange={(_, s) => {
                        if (!s) return;
                        form.setFieldValue(['items', f.name, 'price'], s.price);
                        form.setFieldValue(['items', f.name, 'planItemId'], undefined);
                      }}
                    />
                  </Form.Item>
                  <Form.Item name={[f.name, 'tooth']} rules={[{ required: !!svc?.perTooth, message: 'Tishni tanlang' }]} className="mb-0">
                    <Select allowClear showSearch placeholder="Tish" options={toothOptions} onChange={() => form.setFieldValue(['items', f.name, 'surfaces'], undefined)} />
                  </Form.Item>
                  <Form.Item name={[f.name, 'surfaces']} className="mb-0">
                    <SurfacePickerButton tooth={it?.tooth} />
                  </Form.Item>
                  {narrow && (
                    <Button type="text" aria-label="Olib tashlash" icon={<Trash2 size={16} strokeWidth={1.5} />} onClick={() => remove(f.name)} />
                  )}
                  <Form.Item name={[f.name, 'price']} rules={[{ required: true, message: 'Narx' }]} className="mb-0">
                    <MoneyInput currency={false} />
                  </Form.Item>
                  <Form.Item name={[f.name, 'discount']} className={cn('mb-0', narrow && 'col-span-2')}>
                    <InputNumber min={0} max={100} prefix={narrow ? 'Chegirma' : undefined} suffix="%" className="w-full" aria-label="Chegirma" />
                  </Form.Item>
                  {!narrow && (
                    <Button
                      type="text"
                      aria-label="Olib tashlash"
                      icon={<Trash2 size={16} strokeWidth={1.5} />}
                      onClick={() => remove(f.name)}
                      disabled={fields.length === 1}
                    />
                  )}
                  <Form.Item name={[f.name, 'planItemId']} hidden>
                    <Input />
                  </Form.Item>
                </div>
              );
            })}
            <div className="flex flex-wrap gap-2">
              <Button type="dashed" icon={<Plus size={16} strokeWidth={1.5} />} onClick={() => add({ discount: 0 })}>
                Muolaja qo‘shish
              </Button>
              {draft.planItems
                .filter((p) => !items.some((i) => i?.planItemId === p.id))
                .slice(0, 4)
                .map((p) => (
                  <Button key={p.id} onClick={() => add({ planItemId: p.id, serviceId: p.serviceId, tooth: p.tooth, price: p.price, discount: p.discount })}>
                    Rejadan: {p.tooth ? `${p.tooth} · ` : ''}
                    {p.serviceName}
                  </Button>
                ))}
            </div>
          </div>
        )}
      </Form.List>

      <button
        type="button"
        onClick={() => setShowMaterials((x) => !x)}
        className="mb-3 flex w-full cursor-pointer flex-wrap items-center gap-x-2 gap-y-1 rounded-md border-0 bg-subtle px-3 py-2 text-left text-sm"
      >
        {materialsOpen ? <ChevronUp size={16} strokeWidth={1.5} /> : <ChevronDown size={16} strokeWidth={1.5} />}
        <span className="font-medium">Ishlatilgan materiallar</span>
        <span className="text-muted">· {materialCount ? `${materialCount} ta, xizmat bo‘yicha avtomatik` : 'yo‘q'}</span>
        <span className="ml-auto text-xs text-ink">{materialsOpen ? 'Yashirish' : 'Ko‘rish / o‘zgartirish'}</span>
      </button>
      {shortages.length > 0 && (
        <Alert
          type="warning"
          showIcon
          className="mb-3"
          message="Omborda yetarli emas"
          description={shortages.map((s) => `${s.name}: kerak ${formatNumber(s.need, 2)} ${s.unit}, mavjud ${formatNumber(s.usable, 2)} ${s.unit}`).join('; ')}
          action={
            <Button
              size="small"
              onClick={() =>
                form.setFieldValue(
                  'materials',
                  materials.map((m) => {
                    const p = products.find((x) => x.id === m?.productId);
                    return { productId: m?.productId, qty: p ? Math.min(m?.qty ?? 0, p.usable) : m?.qty };
                  }),
                )
              }
            >
              Qoldiqqa moslash
            </Button>
          }
        />
      )}
      {/* Yopiq bo‘lsa ham qiymatlar formada qoladi */}
      <div className={materialsOpen ? undefined : 'hidden'}>
        <Form.List name="materials">
          {(fields, { add, remove }) => (
            <div className="mb-4 flex flex-col gap-2">
              {fields.map((f) => {
                const p = products.find((x) => x.id === materials[f.name]?.productId);
                return (
                  <div key={f.key} className={cn('grid grid-cols-[1fr_110px_36px] items-center gap-2', !narrow && 'md:grid-cols-[1fr_140px_150px_36px]')}>
                    <Form.Item name={[f.name, 'productId']} className="mb-0" rules={[{ required: true, message: 'Materialni tanlang' }]}>
                      <Select showSearch optionFilterProp="label" options={products.map((x) => ({ value: x.id, label: `${x.name} (${x.unit})` }))} />
                    </Form.Item>
                    <Form.Item name={[f.name, 'qty']} className="mb-0" rules={[{ required: true, message: 'Miqdor' }]}>
                      <InputNumber min={0} step={0.1} className="w-full" suffix={p?.unit} />
                    </Form.Item>
                    {!narrow && <span className="hidden text-xs text-muted md:block">Qoldiq: {p ? `${formatNumber(p.usable, 2)} ${p.unit}` : '—'}</span>}
                    <Button type="text" aria-label="Olib tashlash" icon={<Trash2 size={16} strokeWidth={1.5} />} onClick={() => remove(f.name)} />
                  </div>
                );
              })}
              <Button type="dashed" className="self-start" icon={<Plus size={16} strokeWidth={1.5} />} onClick={() => add({ qty: 1 })}>
                Material qo‘shish
              </Button>
            </div>
          )}
        </Form.List>
      </div>
      <div className="mb-6" />

      {canReceive && (
        <>
          <Step n={2} title="To‘lov" />
          <CompletionPaymentFields total={total} previousDebt={patient?.debt ?? 0} />
        </>
      )}

      <Step n={canReceive ? 3 : 2} title="Keyingi tashrif" />
      <FollowUpFields doctorId={draft.appointment.doctorId} suggestedServiceIds={suggested} fallbackServiceId={services.find((x) => x.code === 'D001')?.id} />

      <Form.Item name="doctorNote" label="Izoh">
        <Input.TextArea rows={2} maxLength={500} placeholder="Masalan: 36-tishga vaqtinchalik plomba qo‘yildi" />
      </Form.Item>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4">
        <span className="text-base">
          Jami: <span className="font-medium tabular-nums">{formatMoney(total)}</span>
        </span>
        <div className="flex gap-2">
          {onCancel && <Button onClick={onCancel}>Bekor qilish</Button>}
          <Button type="primary" loading={complete.isPending} disabled={shortages.length > 0 || !items.length} onClick={() => form.submit()}>
            Qabulni yakunlash
          </Button>
        </div>
      </div>
    </Form>
  );
};
