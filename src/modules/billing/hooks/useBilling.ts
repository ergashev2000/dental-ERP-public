import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsIsoDate, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { QUERY_KEYS as K } from '@/shared/constants/queryKeys';
import { invalidate } from '@/shared/lib/react-query';
import { billingApi } from '../api/billingApi';
import type { DiscountInput, InvoiceFilters, PaymentFilters, PaymentInput } from '../types';

export const BILLING_TABS = ['invoices', 'payments', 'debtors', 'cashbox'] as const;
export const INVOICE_STATUSES = ['UNPAID', 'PARTIAL', 'PAID', 'CANCELLED'] as const;
export const PAYMENT_METHODS = ['CASH', 'TRANSFER', 'CARD'] as const;

export const useBillingParams = () =>
  useQueryStates(
    {
      tab: parseAsStringLiteral(BILLING_TABS).withDefault('invoices'),
      q: parseAsString.withOptions({ throttleMs: 300 }),
      status: parseAsStringLiteral(INVOICE_STATUSES),
      method: parseAsStringLiteral(PAYMENT_METHODS),
      from: parseAsIsoDate,
      to: parseAsIsoDate,
      date: parseAsIsoDate,
      page: parseAsInteger.withDefault(1),
      invoice: parseAsString,
    },
    { history: 'replace' },
  );

export const useInvoices = (f: InvoiceFilters, enabled = true) =>
  useQuery({ queryKey: [...K.billing, 'invoices', f], queryFn: () => billingApi.invoices(f), placeholderData: keepPreviousData, enabled });

export const useInvoice = (id?: string | null) =>
  useQuery({ queryKey: [...K.billing, 'invoice', id], queryFn: () => billingApi.invoice(id!), enabled: !!id });

export const useOpenInvoices = (patientId?: string | null) =>
  useQuery({ queryKey: [...K.billing, 'open', patientId], queryFn: () => billingApi.openInvoices(patientId!), enabled: !!patientId });

export const usePayments = (f: PaymentFilters, enabled = true) =>
  useQuery({ queryKey: [...K.billing, 'payments', f], queryFn: () => billingApi.payments(f), placeholderData: keepPreviousData, enabled });

export const usePaymentReceipt = (id?: string | null) =>
  useQuery({ queryKey: [...K.billing, 'payment', id], queryFn: () => billingApi.payment(id!), enabled: !!id });

export const useDebtors = (q?: string | null) =>
  useQuery({ queryKey: [...K.billing, 'debtors', q], queryFn: () => billingApi.debtors(q) });

export const useCashbox = (date: string) =>
  useQuery({ queryKey: [...K.billing, 'cashbox', date], queryFn: () => billingApi.cashbox(date) });

const refresh = () => invalidate(K.billing, K.patients, K.dashboard, K.reports, K.ortho);

export const useReceivePayment = () =>
  useMutation({ mutationFn: (input: PaymentInput) => billingApi.receive(input), onSuccess: refresh });

export const useRefund = () =>
  useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => billingApi.refund(id, reason),
    onSuccess: refresh,
  });

export const useDiscount = () =>
  useMutation({ mutationFn: (input: DiscountInput) => billingApi.discount(input), onSuccess: refresh });
