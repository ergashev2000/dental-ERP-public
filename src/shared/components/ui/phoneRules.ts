import type { Rule } from 'antd/es/form';
import { isValidUzPhone } from '@/shared/utils/format';

/** Telefon maydoni qoidalari: majburiylik va to'liq raqam (+998 va 9 raqam) */
export const phoneRules = (required = true): Rule[] => [
  ...(required ? [{ required: true, message: 'Telefon raqamni kiriting' }] : []),
  {
    validator: (_: unknown, v?: string) =>
      !v || isValidUzPhone(v) ? Promise.resolve() : Promise.reject(new Error('To‘liq raqam kiriting: 90 123 45 67')),
  },
];
