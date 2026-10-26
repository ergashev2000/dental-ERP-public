import { App, Button, DatePicker, Form, Input, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import { PackagePlus, Trash2 } from '@/shared/icons';
import { useEffect, useMemo, useRef } from 'react';
import dayjs from '@/shared/lib/dayjs';
import { EmptyState, MoneyInput } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { formatMoney, formatNumber } from '@/shared/utils/format';
import { useProducts, useReceipt, useSuppliers } from '../hooks/useInventory';
import type { ProductRow } from '../types';
import { ProductSearch } from './ProductSearch';
import { QtyStepper } from './QtyStepper';

interface Line {
  productId: string;
  qty: number;
  unitCost: number;
  expiresAt?: Dayjs;
}

interface Values {
  date: Dayjs;
  supplierId?: string;
  docNo?: string;
  lines: Line[];
}

export interface ReceiptDraftLine {
  productId: string;
  qty: number;
  unitCost: number;
}

/** Tashqaridan (masalan, "Buyurtma kerak" ro'yxatidan) kirimga qo'shiladigan qatorlar; id har safar yangi */
export interface ReceiptDraft {
  id: number;
  lines: ReceiptDraftLine[];
}

const lineCost = (p: ProductRow) => Math.round(p.avgCost);

/** Kirim: har qator yangi partiya yaratadi */
export const ReceiptForm = ({ draft }: { draft?: ReceiptDraft | null }) => {
  const [form] = Form.useForm<Values>();
  const { data: products = [], isLoading } = useProducts();
  const { data: suppliers = [] } = useSuppliers();
  const receipt = useReceipt();
  const { message } = App.useApp();
  const lines = (Form.useWatch('lines', form) ?? []) as Partial<Line>[];
  const total = lines.reduce((s, l) => s + (l?.qty ?? 0) * (l?.unitCost ?? 0), 0);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const addLine = (l: ReceiptDraftLine) => {
    const cur = (form.getFieldValue('lines') ?? []) as Line[];
    const i = cur.findIndex((x) => x.productId === l.productId);
    if (i >= 0) form.setFieldValue(['lines', i, 'qty'], +((cur[i].qty ?? 0) + l.qty).toFixed(3));
    else form.setFieldValue('lines', [...cur, l]);
    void form.validateFields(['lines']).catch(() => undefined);
  };

  // "Kirimga qo'shish" bosilganda qatorlarni bir marta qo'shish
  const seen = useRef(0);
  useEffect(() => {
    if (!draft || draft.id === seen.current) return;
    seen.current = draft.id;
    draft.lines.forEach(addLine);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- faqat yangi draft kelganda
  }, [draft]);

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      initialValues={{ date: dayjs(), lines: [] }}
      onFinish={(v) =>
        receipt.mutate(
          {
            date: v.date.format('YYYY-MM-DD'),
            supplierId: v.supplierId,
            docNo: v.docNo,
            lines: v.lines.map((l) => ({ ...l, expiresAt: l.expiresAt?.format('YYYY-MM-DD') })),
          },
          {
            onSuccess: (r) => {
              message.success(`Kirim saqlandi: ${r.docNo}, ${r.count} ta partiya`);
              form.resetFields();
            },
            onError: (e) => message.error(errorMessage(e)),
          },
        )
      }
    >
      <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-[180px_minmax(0,1fr)_200px]">
        <Form.Item name="date" label="Sana" rules={[{ required: true, message: 'Sanani tanlang' }]}>
          <DatePicker format="DD.MM.YYYY" className="w-full" allowClear={false} disabledDate={(d) => d.isAfter(dayjs())} />
        </Form.Item>
        <Form.Item name="supplierId" label="Yetkazib beruvchi">
          <Select allowClear showSearch optionFilterProp="label" placeholder="Tanlang (ixtiyoriy)" options={suppliers.map((s) => ({ value: s.id, label: s.name }))} />
        </Form.Item>
        <Form.Item name="docNo" label="Hujjat №" className="sm:col-span-2 lg:col-span-1">
          <Input placeholder="Bo‘sh qolsa — avtomatik" maxLength={30} />
        </Form.Item>
      </div>

      <div className="mb-4">
        <ProductSearch products={products} loading={isLoading} onPick={(p) => addLine({ productId: p.id, qty: 1, unitCost: lineCost(p) })} />
        <div className="mt-1.5 text-xs text-muted">Narx oxirgi o‘rtacha tannarxdan olinadi — kerak bo‘lsa o‘zgartiring</div>
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
                <EmptyState compact icon={PackagePlus} title="Mahsulot qo‘shilmagan" description="Yuqoridagi qidiruvdan mahsulot tanlang — qator avtomatik qo‘shiladi" />
              </div>
            ) : (
              <>
                <div className="hidden gap-3 px-1 pb-2 text-xs text-muted lg:flex">
                  <span className="flex-1">Mahsulot</span>
                  <span className="w-36">Miqdor</span>
                  <span className="w-40">Birlik narxi</span>
                  <span className="w-40">Yaroqlilik muddati</span>
                  <span className="w-32 text-right">Jami</span>
                  <span className="w-9" />
                </div>
                <div className="flex flex-col divide-y divide-subtle">
                  {fields.map((f) => {
                    const l = lines[f.name];
                    const p = l?.productId ? byId.get(l.productId) : undefined;
                    const removeBtn = (cls: string) => (
                      <Button type="text" shape="circle" className={cls} aria-label="Qatorni o‘chirish" icon={<Trash2 size={18} strokeWidth={1.5} />} onClick={() => remove(f.name)} />
                    );
                    return (
                      <div key={f.key} className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center">
                        <Form.Item name={[f.name, 'productId']} hidden rules={[{ required: true }]}>
                          <Input />
                        </Form.Item>
                        <div className="flex min-w-0 flex-1 items-start gap-2 px-1">
                          <div className="min-w-0 flex-1 leading-tight">
                            <div className="truncate text-sm font-medium text-ink" title={p?.name}>
                              {p?.name ?? '—'}
                            </div>
                            {p && (
                              <div className="mt-0.5 text-xs text-muted">
                                Hozir {formatNumber(p.stock, 2)} {p.unit}
                                {p.sku ? ` · ${p.sku}` : ''}
                              </div>
                            )}
                          </div>
                          {removeBtn('lg:hidden')}
                        </div>
                        <div className="grid grid-cols-2 items-center gap-2 lg:flex lg:gap-3">
                          <Form.Item name={[f.name, 'qty']} rules={[{ required: true, message: 'Miqdor' }]} className="mb-0 lg:w-36">
                            <QtyStepper min={0.01} aria-label={`${p?.name ?? 'Mahsulot'} miqdori`} />
                          </Form.Item>
                          <Form.Item name={[f.name, 'unitCost']} rules={[{ required: true, message: 'Narx' }]} className="mb-0 lg:w-40">
                            <MoneyInput aria-label="Birlik narxi" />
                          </Form.Item>
                          <Form.Item name={[f.name, 'expiresAt']} className="mb-0 lg:w-40">
                            <DatePicker format="DD.MM.YYYY" className="w-full" placeholder="Yaroqlilik" disabledDate={(d) => d.isBefore(dayjs())} />
                          </Form.Item>
                          <div className="text-right text-sm tabular-nums text-ink lg:w-32">
                            <span className="text-xs text-muted lg:hidden">Jami </span>
                            {formatMoney((l?.qty ?? 0) * (l?.unitCost ?? 0))}
                          </div>
                        </div>
                        {removeBtn('hidden lg:inline-flex')}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            <Form.ErrorList errors={errors} />
          </>
        )}
      </Form.List>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-md bg-panel px-5 py-4">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
          <div>
            <div className="text-xs text-muted">Qatorlar</div>
            <div className="text-xl tabular-nums text-ink">{lines.length}</div>
          </div>
          <div>
            <div className="text-xs text-muted">Umumiy summa</div>
            <div className="text-xl tabular-nums text-ink">
              {formatMoney(total, false)} <span className="text-[0.55em] text-muted">so‘m</span>
            </div>
          </div>
        </div>
        <Button type="primary" htmlType="submit" loading={receipt.isPending}>
          Kirimni saqlash
        </Button>
      </div>
    </Form>
  );
};
