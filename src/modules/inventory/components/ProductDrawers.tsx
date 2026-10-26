import { App, Button, Drawer, Form, Input, InputNumber, Select, Skeleton, Table, Tabs } from 'antd';
import { MapPin, PackagePlus, Pencil } from '@/shared/icons';
import { useEffect } from 'react';
import { Can, MoneyText, StatusTag } from '@/shared/components/ui';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '@/shared/constants/options';
import { MOVEMENT_TYPE, STOCK_STATE } from '@/shared/constants/status';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { formatDate, formatDateTime, formatMoney, formatNumber } from '@/shared/utils/format';
import { useProduct, useSaveProduct } from '../hooks/useInventory';
import type { BatchView, MovementView, Product, ProductInput, ProductRow } from '../types';
import { needsReorder, suggestReorder } from '../utils/reorder';

export const ProductFormDrawer = ({ open, product, onClose }: { open: boolean; product?: Product | null; onClose: () => void }) => {
  const [form] = Form.useForm<ProductInput>();
  const save = useSaveProduct();
  const { message } = App.useApp();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (open) form.setFieldsValue(product ?? { name: '', category: 'Materiallar', unit: 'dona', minStock: 0 });
  }, [open, product, form]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={isMobile ? '100%' : 460}
      title={product ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Bekor qilish</Button>
          <Button type="primary" loading={save.isPending} onClick={() => form.submit()}>
            Saqlash
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={(input) =>
          save.mutate(
            { id: product?.id, input },
            {
              onSuccess: () => {
                message.success('Saqlandi');
                onClose();
              },
              onError: (e) => message.error(errorMessage(e)),
            },
          )
        }
      >
        <Form.Item name="name" label="Nomi" rules={[{ required: true, message: 'Nomini kiriting' }]}>
          <Input maxLength={100} placeholder="Masalan, Kompozit A2" />
        </Form.Item>
        <Form.Item name="sku" label="SKU yoki shtrix-kod">
          <Input maxLength={40} />
        </Form.Item>
        <div className="grid grid-cols-2 gap-3">
          <Form.Item name="category" label="Kategoriya" rules={[{ required: true, message: 'Tanlang' }]}>
            <Select options={PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          </Form.Item>
          <Form.Item name="unit" label="O‘lchov birligi" rules={[{ required: true, message: 'Tanlang' }]}>
            <Select options={PRODUCT_UNITS.map((u) => ({ value: u, label: u }))} />
          </Form.Item>
        </div>
        <Form.Item
          name="minStock"
          label="Minimal qoldiq"
          extra="Qoldiq shundan kam bo‘lsa — “Kam qoldi” deb belgilanadi va buyurtma ro‘yxatiga tushadi"
          rules={[{ required: true, message: 'Kiriting' }]}
        >
          <InputNumber min={0} className="w-full" />
        </Form.Item>
        <Form.Item name="location" label="Joylashuv (shkaf / polka)">
          <Input maxLength={60} />
        </Form.Item>
        <Form.Item name="note" label="Izoh" className="mb-0">
          <Input.TextArea rows={2} maxLength={200} />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

/** Harakat miqdori: ishora va birlik bilan; rang emas — yonidagi tur chipi ma'noni beradi */
export const MovementQty = ({ m }: { m: Pick<MovementView, 'qty' | 'unit'> }) => (
  <span className="whitespace-nowrap font-medium tabular-nums text-ink">
    {m.qty > 0 ? '+' : ''}
    {formatNumber(m.qty, 2)} <span className="text-xs font-normal text-muted">{m.unit}</span>
  </span>
);

const Tile = ({ label, value, unit }: { label: string; value: string; unit?: string }) => (
  <div className="rounded-md bg-panel px-4 py-3">
    <div className="text-xs text-muted">{label}</div>
    <div className="mt-1 text-xl tabular-nums text-ink">
      {value} {unit && <span className="text-[0.55em] text-muted">{unit}</span>}
    </div>
  </div>
);

/** Mahsulot: qoldiq, partiyalar va harakatlar tarixi */
export const ProductDrawer = ({
  id,
  onClose,
  onEdit,
  onReorder,
}: {
  id: string | null;
  onClose: () => void;
  onEdit: (p: Product) => void;
  /** Buyurtma taklifini kirim formasiga qo'shish */
  onReorder?: (p: ProductRow) => void;
}) => {
  const { data, isLoading } = useProduct(id);
  const isMobile = useIsMobile();
  const p = data?.product;

  return (
    <Drawer open={!!id} onClose={onClose} width={isMobile ? '100%' : 640} title={p?.name ?? 'Mahsulot'} destroyOnHidden>
      {isLoading || !data || !p ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag meta={STOCK_STATE[p.state]} />
            <span className="inline-flex h-7.5 items-center rounded-pill bg-subtle px-3 text-xs text-ink">{p.category}</span>
            {p.sku && <span className="inline-flex h-7.5 items-center rounded-pill bg-subtle px-3 text-xs tabular-nums text-ink">{p.sku}</span>}
            {p.location && (
              <span className="inline-flex h-7.5 items-center gap-1.5 rounded-pill bg-subtle px-3 text-xs text-ink">
                <MapPin size={14} strokeWidth={1.5} />
                {p.location}
              </span>
            )}
            <Can perm="inventory.manage">
              <Button className="ml-auto" icon={<Pencil size={16} strokeWidth={1.5} />} onClick={() => onEdit(p)}>
                Tahrirlash
              </Button>
            </Can>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            <Tile label="Qoldiq" value={formatNumber(p.stock, 2)} unit={p.unit} />
            <Tile label="Ishlatsa bo‘ladi" value={formatNumber(p.usable, 2)} unit={p.unit} />
            <Tile label="Minimal" value={formatNumber(p.minStock)} unit={p.unit} />
            <Tile label="O‘rt. tannarx" value={formatMoney(Math.round(p.avgCost), false)} unit="so‘m" />
          </div>

          {needsReorder(p) && (
            <div className="flex flex-wrap items-center gap-3 rounded-md bg-warning-soft px-4 py-3">
              <div className="min-w-0 flex-1 text-sm text-ink">
                Buyurtma taklifi: <span className="font-medium tabular-nums">{formatNumber(suggestReorder(p))} {p.unit}</span>
                <div className="text-xs text-muted">Minimal qoldiqning ikki barobarigacha to‘ldirish uchun</div>
              </div>
              {onReorder && (
                <Can perm="inventory.in">
                  <Button className="bg-surface" icon={<PackagePlus size={16} strokeWidth={1.5} />} onClick={() => onReorder(p)}>
                    Kirimga qo‘shish
                  </Button>
                </Can>
              )}
            </div>
          )}

          {p.note && <p className="m-0 text-sm text-muted">{p.note}</p>}

          <Tabs
            items={[
              {
                key: 'b',
                label: `Partiyalar (${data.batches.length})`,
                children: (
                  <Table<BatchView>
                    rowKey="id"
                    size="small"
                    pagination={false}
                    dataSource={data.batches}
                    scroll={{ x: 560 }}
                    rowClassName={(b) => (b.remaining <= 0 ? 'opacity-50' : '')}
                    columns={[
                      { title: 'Kirim', dataIndex: 'receivedAt', render: (v: string) => <span className="tabular-nums">{formatDate(v)}</span> },
                      { title: 'Miqdor', dataIndex: 'qty', align: 'right', render: (v: number) => <span className="tabular-nums">{formatNumber(v, 2)}</span> },
                      { title: 'Qoldiq', dataIndex: 'remaining', align: 'right', render: (v: number) => <span className="font-medium tabular-nums">{formatNumber(v, 2)}</span> },
                      { title: 'Tannarx', dataIndex: 'unitCost', align: 'right', render: (v: number) => <MoneyText value={v} /> },
                      {
                        title: 'Yaroqlilik',
                        dataIndex: 'expiresAt',
                        render: (v: string | undefined, b) =>
                          !v ? (
                            '—'
                          ) : b.expired && b.remaining > 0 ? (
                            <StatusTag tone="danger">{formatDate(v)} · o‘tgan</StatusTag>
                          ) : (
                            <span className="tabular-nums">{formatDate(v)}</span>
                          ),
                      },
                      { title: 'Yetkazib beruvchi', dataIndex: 'supplierName', responsive: ['md'], render: (v?: string) => v ?? '—' },
                    ]}
                  />
                ),
              },
              {
                key: 'm',
                label: 'Harakatlar',
                children: (
                  <Table<MovementView>
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 10, hideOnSinglePage: true }}
                    dataSource={data.movements}
                    scroll={{ x: 560 }}
                    columns={[
                      { title: 'Sana', dataIndex: 'createdAt', render: (v: string) => <span className="tabular-nums">{formatDateTime(v)}</span> },
                      { title: 'Tur', dataIndex: 'type', render: (t: MovementView['type']) => <StatusTag meta={MOVEMENT_TYPE[t]} dot={false} /> },
                      { title: 'Miqdor', key: 'q', align: 'right', render: (_, m) => <MovementQty m={m} /> },
                      { title: 'Qoldiq', dataIndex: 'balanceAfter', align: 'right', render: (v: number) => <span className="tabular-nums">{formatNumber(v, 2)}</span> },
                      { title: 'Kim', dataIndex: 'byName', responsive: ['md'] },
                    ]}
                  />
                ),
              },
            ]}
          />
        </div>
      )}
    </Drawer>
  );
};
