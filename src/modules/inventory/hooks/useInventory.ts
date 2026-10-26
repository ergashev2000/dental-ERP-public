import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { QUERY_KEYS as K } from '@/shared/constants/queryKeys';
import { invalidate } from '@/shared/lib/react-query';
import { inventoryApi } from '../api/inventoryApi';
import type { IssueInput, MovementFilters, ProductInput, ReceiptInput, StockFilters, SupplierInput } from '../types';

export const INVENTORY_TABS = ['products', 'receipt', 'issue', 'movements', 'suppliers'] as const;
export const STOCK_FILTERS = ['all', 'low', 'out', 'expiring'] as const;
export const MOVEMENT_TYPES = ['IN', 'USAGE', 'MANUAL', 'WRITE_OFF', 'ADJUSTMENT'] as const;

export const useInventoryParams = () =>
  useQueryStates(
    {
      tab: parseAsStringLiteral(INVENTORY_TABS).withDefault('products'),
      q: parseAsString.withOptions({ throttleMs: 300 }),
      category: parseAsString,
      stock: parseAsStringLiteral(STOCK_FILTERS).withDefault('all'),
      type: parseAsStringLiteral(MOVEMENT_TYPES),
      page: parseAsInteger.withDefault(1),
      product: parseAsString,
    },
    { history: 'replace' },
  );

export const useProducts = (f: StockFilters = {}) =>
  useQuery({ queryKey: [...K.inventory, 'products', f], queryFn: () => inventoryApi.products(f), placeholderData: keepPreviousData });

export const useLowStock = (limit = 5) =>
  useQuery({ queryKey: [...K.inventory, 'low', limit], queryFn: () => inventoryApi.lowStock(limit) });

export const useProduct = (id?: string | null) =>
  useQuery({ queryKey: [...K.inventory, 'product', id], queryFn: () => inventoryApi.product(id!), enabled: !!id });

export const useMovements = (f: MovementFilters) =>
  useQuery({ queryKey: [...K.inventory, 'movements', f], queryFn: () => inventoryApi.movements(f), placeholderData: keepPreviousData });

export const useSuppliers = () => useQuery({ queryKey: [...K.inventory, 'suppliers'], queryFn: inventoryApi.suppliers });

const refresh = () => invalidate(K.inventory, K.notifications, K.dashboard);

export const useSaveProduct = () =>
  useMutation({ mutationFn: ({ id, input }: { id?: string; input: ProductInput }) => inventoryApi.saveProduct(input, id), onSuccess: refresh });

export const useReceipt = () => useMutation({ mutationFn: (input: ReceiptInput) => inventoryApi.receipt(input), onSuccess: refresh });

export const useIssue = () => useMutation({ mutationFn: (input: IssueInput) => inventoryApi.issue(input), onSuccess: refresh });

export const useSaveSupplier = () =>
  useMutation({ mutationFn: ({ id, input }: { id?: string; input: SupplierInput }) => inventoryApi.saveSupplier(input, id), onSuccess: refresh });
