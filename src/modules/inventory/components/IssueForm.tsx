import { App, Button, Form, Input, Segmented, Select } from 'antd';
import type { FormListFieldData } from 'antd';
import { PackageX, Trash2 } from '@/shared/icons';
import { useMemo, useState } from 'react';
import { EmptyState, StatusTag } from '@/shared/components/ui';
import { usePermissions } from '@/shared/hooks/usePermission';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { formatDate, formatMoney, formatNumber } from '@/shared/utils/format';
import { useIssue, useProduct, useProducts } from '../hooks/useInventory';
import type { IssueInput, ProductRow } from '../types';
import { ProductSearch } from './ProductSearch';
import { QtyStepper } from './QtyStepper';

type IssueType = IssueInput['type'];

interface Line {
  productId: string;
  qty?: number;
  batchId?: string;
}

interface Values {
  type: IssueType;
  lines: Line[];
  reason?: string;
}

const TYPES = [
  {
    value: 'MANUAL' as const,
    label: 'Chiqim',
    perm: 'inventory.out' as const,
    hint: 'Qabulda ishlatilgan yoki kabinetga berilgan material. Avval muddati eng yaqin partiyadan olinadi; muddati o‘tgan partiya o‘tkazib yuboriladi.',
    submit: 'Chiqimni saqlash',
  },
  {
    value: 'WRITE_OFF' as const,
    label: 'Hisobdan chiqarish',
    perm: 'inventory.writeOff' as const,
    hint: 'Yaroqsiz, shikastlangan yoki muddati o‘tgan mahsulot. Sabab majburiy, harakat tarixda qoladi.',
    submit: 'Hisobdan chiqarish',
  },
  {
    value: 'ADJUSTMENT' as const,
    label: 'Inventarizatsiya',
    perm: 'inventory.adjust' as const,
    hint: 'Sanab chiqilgan haqiqiy qoldiqni kiriting — farq tarixga “Tuzatish” bo‘lib yoziladi. Sabab majburiy.',
    submit: 'Qoldiqni tuzatish',
  },
];

/** Miqdor chegarasi: oddiy chiqim — ishlatsa bo'ladigan qoldiq, hisobdan chiqarish — butun qoldiq */
const maxFor = (type: IssueType, p?: ProductRow) => (!p || type === 'ADJUSTMENT' ? undefined : type === 'WRITE_OFF' ? p.stock : p.usable);

const IssueLine = ({ field, product: p, type, qty, onRemove }: { field: FormListFieldData; product?: ProductRow; type: IssueType; qty?: number; onRemove: () => void }) => {
  // partiyalar faqat hisobdan chiqarishda kerak
  const { data: detail } = useProduct(type === 'WRITE_OFF' ? p?.id : null);
  const max = maxFor(type, p);
  const diff = type === 'ADJUSTMENT' && p && qty !== undefined && qty !== null ? +(qty - p.stock).toFixed(3) : null;
  const removeBtn = (cls: string) => (
    <Button type="text" shape="circle" className={cls} aria-label="Qatorni o‘chirish" icon={<Trash2 size={18} strokeWidth={1.5} />} onClick={onRemove} />
  );

  return (
    <div className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center">
      <Form.Item name={[field.name, 'productId']} hidden rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <div className="flex min-w-0 flex-1 items-start gap-2 px-1">
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-medium text-ink" title={p?.name}>
            {p?.name ?? '—'}
          </div>
          {p && (
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
              <span className="tabular-nums">
                Qoldiq {formatNumber(p.stock, 2)} {p.unit}
                {p.usable < p.stock && ` · ishlatsa bo‘ladi ${formatNumber(p.usable, 2)}`}
              </span>
              {p.usable < p.stock && type === 'MANUAL' && <StatusTag tone="warning">Muddati o‘tgan partiya bor</StatusTag>}
            </div>
          )}
        </div>
        {removeBtn('lg:hidden')}
      </div>
      <div className="grid grid-cols-2 items-center gap-2 lg:flex lg:gap-3">
        {type === 'WRITE_OFF' && (
          <Form.Item name={[field.name, 'batchId']} className="col-span-2 mb-0 lg:w-56">
            <Select
              allowClear
              placeholder="Partiya: avtomatik"
              aria-label="Partiya"
              options={(detail?.batches ?? [])
                .filter((b) => b.remaining > 0)
                .map((b) => ({ value: b.id, label: `${b.docNo ?? b.id} · ${formatNumber(b.remaining, 2)} · ${formatDate(b.expiresAt)}${b.expired ? ' (o‘tgan)' : ''}` }))}
            />
          </Form.Item>
        )}
        <Form.Item
          name={[field.name, 'qty']}
          className="mb-0 lg:w-36"
          rules={[
            { required: true, message: 'Miqdorni kiriting' },
            {
              validator: (_, v?: number) =>
                max !== undefined && v !== undefined && v !== null && v > max ? Promise.reject(new Error(`Maks. ${formatNumber(max, 2)}`)) : Promise.resolve(),
            },
          ]}
        >
          <QtyStepper min={type === 'ADJUSTMENT' ? 0 : 0.01} max={max} aria-label={type === 'ADJUSTMENT' ? 'Haqiqiy sanalgan qoldiq' : 'Miqdor'} />
        </Form.Item>
        <div className="text-right text-xs text-muted lg:w-28">
          {type === 'ADJUSTMENT'
            ? diff === null
              ? '—'
              : diff === 0
                ? 'Farq yo‘q'
                : `Farq ${diff > 0 ? '+' : ''}${formatNumber(diff, 2)} ${p?.unit ?? ''}`
            : p && <span className="tabular-nums">≈ {formatMoney((qty ?? 0) * p.avgCost)}</span>}
        </div>
      </div>
      {removeBtn('hidden lg:inline-flex')}
    </div>
  );
};

/** Chiqim: FEFO tartibida; qoldiqdan ko'p chiqim qilib bo'lmaydi. Bir nechta mahsulot — har biri alohida harakat */
export const IssueForm = () => {
  const [form] = Form.useForm<Values>();
  const can = usePermissions();
  const issue = useIssue();
  const isMobile = useIsMobile();
  const { message, modal } = App.useApp();
  const { data: products = [], isLoading } = useProducts();
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const [saving, setSaving] = useState(false);
  const type = (Form.useWatch('type', form) ?? 'MANUAL') as IssueType;
  const lines = (Form.useWatch('lines', form) ?? []) as Partial<Line>[];

  const types = TYPES.filter((t) => can(t.perm));
  const meta = TYPES.find((t) => t.value === type) ?? TYPES[0];
  const startQty = (t: IssueType, p?: ProductRow) => (t === 'ADJUSTMENT' ? Math.max(p?.stock ?? 0, 0) : 1);
  const estimate = lines.reduce((s, l) => s + (l?.qty ?? 0) * (l?.productId ? (byId.get(l.productId)?.avgCost ?? 0) : 0), 0);

  const addLine = (p: ProductRow) => {
    const cur = (form.getFieldValue('lines') ?? []) as Line[];
    const i = cur.findIndex((x) => x.productId === p.id);
    if (i >= 0) {
      if (type === 'ADJUSTMENT') message.info('Bu mahsulot allaqachon ro‘yxatda');
      else form.setFieldValue(['lines', i, 'qty'], +((cur[i].qty ?? 0) + 1).toFixed(3));
      return;
    }
    form.setFieldValue('lines', [...cur, { productId: p.id, qty: startQty(type, p) }]);
    void form.validateFields(['lines']).catch(() => undefined);
  };

  // tur almashganda miqdor ma'nosi o'zgaradi: inventarizatsiyada — haqiqiy qoldiq
  const onTypeChange = (next: IssueType) => {
    const cur = (form.getFieldValue('lines') ?? []) as Line[];
    const switched = (next === 'ADJUSTMENT') !== (type === 'ADJUSTMENT');
    form.setFieldsValue({
      type: next,
      lines: cur.map((l) => ({ ...l, batchId: next === 'WRITE_OFF' ? l.batchId : undefined, qty: switched ? startQty(next, byId.get(l.productId)) : l.qty })),
    });
  };

  const run = async (v: Values) => {
    setSaving(true);
    const done = new Set<number>();
    const warnings: string[] = [];
    for (const [i, l] of v.lines.entries()) {
      try {
        const r = await issue.mutateAsync({ type: v.type, productId: l.productId, qty: l.qty ?? 0, batchId: v.type === 'WRITE_OFF' ? l.batchId : undefined, reason: v.reason });
        warnings.push(...r.warnings);
        done.add(i);
      } catch (e) {
        message.error(`${byId.get(l.productId)?.name ?? 'Mahsulot'}: ${errorMessage(e)}`);
        break;
      }
    }
    setSaving(false);
    if (done.size) message.success(done.size === v.lines.length ? 'Chiqim saqlandi' : `${done.size} ta qator saqlandi`);
    warnings.forEach((w) => message.warning(w));
    const rest = v.lines.filter((_, i) => !done.has(i));
    form.setFieldsValue({ lines: rest, ...(rest.length ? {} : { reason: undefined }) });
  };

  const submit = (v: Values) => {
    if (v.type === 'WRITE_OFF' || v.type === 'ADJUSTMENT') {
      modal.confirm({
        title: v.type === 'WRITE_OFF' ? 'Hisobdan chiqarilsinmi?' : 'Qoldiq tuzatilsinmi?',
        content: 'Harakat tarixga yoziladi va o‘chirilmaydi.',
        okText: 'Tasdiqlash',
        cancelText: 'Bekor qilish',
        onOk: () => run(v),
      });
    } else void run(v);
  };

  return (
    <Form form={form} layout="vertical" initialValues={{ type: 'MANUAL', lines: [] }} onFinish={submit} requiredMark={false}>
      <Form.Item name="type" label="Chiqim turi" extra={meta.hint}>
        <Segmented<IssueType> vertical={isMobile} block={isMobile} options={types.map(({ value, label }) => ({ value, label }))} onChange={onTypeChange} />
      </Form.Item>

      <div className="mb-4">
        <ProductSearch products={products} loading={isLoading} onPick={addLine} />
      </div>

      <Form.List
        name="lines"
        rules={[
          {
            validator: async (_, v?: Line[]) => {
              if (!v?.length) throw new Error('Kamida bitta mahsulot qo‘shing');
            },
          },
        ]}
      >
        {(fields, { remove }, { errors }) => (
          <>
            {fields.length === 0 ? (
              <div className="rounded-md bg-panel">
                <EmptyState compact icon={PackageX} title="Mahsulot qo‘shilmagan" description="Qidiruvdan mahsulot tanlang. Bir nechta mahsulotni bir yo‘la chiqim qilish mumkin" />
              </div>
            ) : (
              <>
                <div className="hidden gap-3 px-1 pb-2 text-xs text-muted lg:flex">
                  <span className="flex-1">Mahsulot</span>
                  {type === 'WRITE_OFF' && <span className="w-56">Partiya</span>}
                  <span className="w-36">{type === 'ADJUSTMENT' ? 'Haqiqiy qoldiq' : 'Miqdor'}</span>
                  <span className="w-28 text-right">{type === 'ADJUSTMENT' ? 'Farq' : 'Taxminiy qiymat'}</span>
                  <span className="w-9" />
                </div>
                <div className="flex flex-col divide-y divide-subtle">
                  {fields.map((f) => {
                    const l = lines[f.name];
                    return <IssueLine key={f.key} field={f} type={type} qty={l?.qty} product={l?.productId ? byId.get(l.productId) : undefined} onRemove={() => remove(f.name)} />;
                  })}
                </div>
              </>
            )}
            <Form.ErrorList errors={errors} />
          </>
        )}
      </Form.List>

      <Form.Item name="reason" label="Sabab" className="mt-4" rules={[{ required: type !== 'MANUAL', whitespace: true, message: 'Sabab majburiy' }]}>
        <Input.TextArea rows={2} maxLength={200} placeholder={type === 'MANUAL' ? 'Ixtiyoriy: masalan, qabul — Karimova, plomba' : 'Masalan: muddati o‘tgan, shikastlangan'} />
      </Form.Item>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-md bg-panel px-5 py-4">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
          <div>
            <div className="text-xs text-muted">Mahsulotlar</div>
            <div className="text-xl tabular-nums text-ink">{lines.length}</div>
          </div>
          {type !== 'ADJUSTMENT' && (
            <div>
              <div className="text-xs text-muted">Taxminiy qiymat (tannarx)</div>
              <div className="text-xl tabular-nums text-ink">
                {formatMoney(estimate, false)} <span className="text-[0.55em] text-muted">so‘m</span>
              </div>
            </div>
          )}
        </div>
        <Button type="primary" htmlType="submit" loading={saving} danger={type === 'WRITE_OFF'}>
          {meta.submit}
        </Button>
      </div>
    </Form>
  );
};
