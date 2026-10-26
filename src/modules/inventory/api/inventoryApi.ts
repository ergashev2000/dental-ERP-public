import dayjs from '@/shared/lib/dayjs';
import { mockDb } from '@/shared/lib/mock/mockDb';
import { ApiError, assert, currentUser, matches, mockRequest, norm, paginate } from '@/shared/lib/mock/mockRequest';
import { uid } from '@/shared/lib/mock/helpers';
import { findProduct, patientName, staffName } from '@/shared/lib/mock/ops/lookup';
import { addBatch, consumeFefo, isExpired, productBatches, productRow, productStock, pushMovement } from '@/shared/lib/mock/ops/inventoryOps';
import { hasPermission, type Permission } from '@/shared/constants/roles';
import { normalizePhone } from '@/shared/utils/format';
import type {
  BatchView,
  IssueInput,
  MovementFilters,
  MovementView,
  Product,
  ProductInput,
  ReceiptInput,
  StockFilters,
  StockMovement,
  Supplier,
  SupplierInput,
} from '../types';

const need = (perm: Permission, msg = 'Bu amal uchun ruxsat yo‘q') => {
  const user = currentUser();
  if (!hasPermission(user.role, perm)) throw new ApiError(403, msg);
  return user;
};

const toMovementView = (m: StockMovement): MovementView => {
  const p = mockDb.products.find((x) => x.id === m.productId);
  let refLabel: string | undefined;
  if (m.refType === 'APPOINTMENT' && m.refId) {
    const a = mockDb.appointments.find((x) => x.id === m.refId);
    refLabel = a ? `Qabul: ${patientName(a.patientId)}, ${dayjs(a.start).format('DD.MM HH:mm')}` : 'Qabul';
  } else if (m.refType === 'RECEIPT') {
    refLabel = `Kirim № ${m.refId}`;
  }
  return { ...m, productName: p?.name ?? '—', unit: p?.unit ?? '', byName: staffName(m.byId), refLabel };
};

const toBatchView = (productId: string): BatchView[] =>
  productBatches(productId)
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
    .map((b) => ({ ...b, supplierName: mockDb.suppliers.find((s) => s.id === b.supplierId)?.name, expired: isExpired(b) }));

export const inventoryApi = {
  // GET /api/inventory/products?q=&category=&stock=
  products: (f: StockFilters = {}) =>
    mockRequest(() => {
      currentUser();
      return mockDb.products
        .filter((p) => matches(f.q, p.name, p.sku) && (!f.category || p.category === f.category))
        .map((p) => productRow(p.id))
        .filter((r) => {
          switch (f.stock) {
            case 'low':
              return r.stock > 0 && r.stock <= r.minStock;
            case 'out':
              return r.stock <= 0;
            case 'expiring':
              return r.state === 'EXPIRING' || r.state === 'EXPIRED' || (!!r.nearestExpiry && dayjs(r.nearestExpiry).diff(dayjs(), 'day') < 30);
            default:
              return true;
          }
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    }),

  // GET /api/inventory/low-stock?limit=
  lowStock: (limit = 5) =>
    mockRequest(() => {
      currentUser();
      return mockDb.products
        .map((p) => productRow(p.id))
        .filter((r) => r.stock <= r.minStock)
        .sort((a, b) => a.stock / (a.minStock || 1) - b.stock / (b.minStock || 1))
        .slice(0, limit);
    }, 250),

  // GET /api/inventory/products/:id
  product: (id: string) =>
    mockRequest(() => {
      currentUser();
      return {
        product: productRow(id),
        batches: toBatchView(id),
        movements: mockDb.movements
          .filter((m) => m.productId === id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 50)
          .map(toMovementView),
      };
    }),

  // POST /api/inventory/products | PUT /api/inventory/products/:id
  saveProduct: (input: ProductInput, id?: string) =>
    mockRequest(() => {
      need('inventory.manage');
      assert(input.name.trim(), 'Nomini kiriting');
      assert(input.minStock >= 0, 'Minimal qoldiq manfiy bo‘lmasin');
      if (input.sku) {
        const dup = mockDb.products.find((p) => p.sku && norm(p.sku) === norm(input.sku!) && p.id !== id);
        assert(!dup, `SKU "${input.sku}" band`);
      }
      if (id) {
        const p = findProduct(id);
        Object.assign(p, input);
        return productRow(p.id);
      }
      const p: Product = { ...input, id: uid('pr') };
      mockDb.products.push(p);
      return productRow(p.id);
    }),

  // POST /api/inventory/receipts — kirim: har qator yangi partiya
  receipt: (input: ReceiptInput) =>
    mockRequest(() => {
      const user = need('inventory.in', 'Kirim qilish uchun ruxsat yo‘q');
      assert(input.lines.length > 0, 'Kamida bitta qator kiriting');
      const docNo = input.docNo?.trim() || `KR-${dayjs().format('YYMMDD-HHmm')}`;
      for (const l of input.lines) {
        assert(l.qty > 0, 'Miqdor 0 dan katta bo‘lishi kerak');
        assert(l.unitCost >= 0, 'Narx manfiy bo‘lmasin');
        if (l.expiresAt) assert(dayjs(l.expiresAt).isAfter(dayjs()), 'Muddati o‘tgan mahsulotni kirim qilib bo‘lmaydi');
        findProduct(l.productId);
      }
      const at = dayjs(input.date).isSame(dayjs(), 'day') ? new Date().toISOString() : dayjs(input.date).hour(12).toISOString();
      for (const l of input.lines) {
        addBatch(
          { productId: l.productId, qty: l.qty, unitCost: l.unitCost, expiresAt: l.expiresAt, supplierId: input.supplierId, receivedAt: at, docNo },
          { type: 'IN', byId: user.staffId, refType: 'RECEIPT', refId: docNo, at },
        );
      }
      return { docNo, count: input.lines.length, total: input.lines.reduce((s, l) => s + l.qty * l.unitCost, 0) };
    }),

  // POST /api/inventory/issues — chiqim (FEFO) / hisobdan chiqarish / tuzatish
  issue: (input: IssueInput) =>
    mockRequest(() => {
      const user = currentUser();
      const perm: Permission =
        input.type === 'ADJUSTMENT' ? 'inventory.adjust' : input.type === 'WRITE_OFF' ? 'inventory.writeOff' : 'inventory.out';
      if (!hasPermission(user.role, perm)) throw new ApiError(403, 'Bu turdagi chiqim uchun ruxsat yo‘q');
      const product = findProduct(input.productId);
      if (input.type === 'WRITE_OFF' || input.type === 'ADJUSTMENT') assert(input.reason?.trim(), 'Sababni kiriting');

      if (input.type === 'ADJUSTMENT') {
        assert(input.qty >= 0, 'Haqiqiy qoldiq manfiy bo‘lmasin');
        const diff = +(input.qty - productStock(product.id)).toFixed(3);
        assert(diff !== 0, 'Qoldiq o‘zgarmadi');
        if (diff < 0) {
          consumeFefo(product.id, -diff, { type: 'ADJUSTMENT', byId: user.staffId, reason: input.reason });
        } else {
          const last = productBatches(product.id).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))[0];
          if (last) {
            last.remaining = +(last.remaining + diff).toFixed(3);
            last.qty = +(last.qty + diff).toFixed(3);
            pushMovement(product.id, last.id, diff, { type: 'ADJUSTMENT', byId: user.staffId, reason: input.reason });
          } else {
            addBatch({ productId: product.id, qty: diff, unitCost: 0, receivedAt: new Date().toISOString() }, { type: 'ADJUSTMENT', byId: user.staffId, reason: input.reason });
          }
        }
        return { warnings: [] as string[] };
      }

      assert(input.qty > 0, 'Miqdorni kiriting');
      const warnings = consumeFefo(product.id, input.qty, {
        type: input.type,
        byId: user.staffId,
        reason: input.reason?.trim() || (input.type === 'MANUAL' ? 'Qo‘lda chiqim' : undefined),
        batchId: input.batchId,
      });
      return { warnings };
    }),

  // GET /api/inventory/movements?q=&type=&page=
  movements: (f: MovementFilters) =>
    mockRequest(() => {
      currentUser();
      const rows = mockDb.movements
        .filter((m) => !f.productId || m.productId === f.productId)
        .filter((m) => !f.type || m.type === f.type)
        .map(toMovementView)
        .filter((m) => matches(f.q, m.productName, m.refId, m.refLabel))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return paginate(rows, f.page ?? 1, f.pageSize ?? 15);
    }),

  // GET /api/inventory/suppliers
  suppliers: () =>
    mockRequest(() => {
      currentUser();
      return [...mockDb.suppliers].sort((a, b) => a.name.localeCompare(b.name));
    }, 200),

  // POST /api/inventory/suppliers | PUT /api/inventory/suppliers/:id
  saveSupplier: (input: SupplierInput, id?: string) =>
    mockRequest(() => {
      need('inventory.manage');
      assert(input.name.trim(), 'Nomini kiriting');
      const clean = { ...input, phone: normalizePhone(input.phone) };
      if (id) {
        const s = mockDb.suppliers.find((x) => x.id === id);
        assert(s, 'Yetkazib beruvchi topilmadi', 404);
        Object.assign(s, clean);
        return s;
      }
      const s: Supplier = { ...clean, id: uid('sp') };
      mockDb.suppliers.push(s);
      return s;
    }),
};
