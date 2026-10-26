import { ArrowRightLeft, CreditCard, Wallet, type AppIcon } from '@/shared/icons';
import type { PaymentMethod } from '../types';

/** To'lov turlari: ikonka va qisqa nom (tugma va kartalar uchun; to'liq nom — PAYMENT_METHOD) */
export const METHOD_ICON: Record<PaymentMethod, AppIcon> = { CASH: Wallet, CARD: CreditCard, TRANSFER: ArrowRightLeft };
export const METHOD_SHORT: Record<PaymentMethod, string> = { CASH: 'Naqd', CARD: 'Karta', TRANSFER: 'O‘tkazma' };
