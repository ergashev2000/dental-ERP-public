import type { Paginated } from '@/shared/types/common';
import type { Role } from '@/shared/constants/roles';
import type { UserRecord } from '@/modules/auth/types';
import { mockDb } from './mockDb';

export class ApiError extends Error {
  status: number;
  /** Qo'shimcha ma'lumot (masalan, takroriy telefon uchun mavjud bemor ID) */
  data?: Record<string, string>;
  constructor(status: number, message: string, data?: Record<string, string>) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

/** Xatodan foydalanuvchiga ko'rsatiladigan matn */
export const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : 'Kutilmagan xatolik yuz berdi. Qayta urinib ko‘ring.';

/**
 * Backend chaqiruvini simulyatsiya qiladi: kechikish + natijani klonlash
 * (komponent mock bazani tasodifan o'zgartirib qo'ymasligi uchun).
 */
export const mockRequest = <T>(fn: () => T, delay = 350): Promise<T> =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(structuredClone(fn()));
      } catch (e) {
        reject(e instanceof ApiError ? e : new ApiError(500, errorMessage(e)));
      }
    }, delay);
  });

/* ---------- Mock sessiya (Authorization header o'rnida) ---------- */

let tokenGetter: () => string | null | undefined = () => null;

/** authStore ilova ishga tushganda token manbasini ulaydi */
export const setMockTokenGetter = (getter: () => string | null | undefined) => {
  tokenGetter = getter;
};

export const tokenFor = (userId: string) => `mock.${userId}.${Date.now().toString(36)}`;

/** Joriy foydalanuvchi (backend'da token orqali aniqlanadi) */
export const currentUser = (): UserRecord => {
  const token = tokenGetter();
  const userId = token?.split('.')[1];
  const user = mockDb.users.find((u) => u.id === userId && u.isActive);
  if (!user) throw new ApiError(401, 'Sessiya tugagan. Qayta kiring.');
  return user;
};

export const requireRole = (...roles: Role[]) => {
  const user = currentUser();
  if (!roles.includes(user.role)) throw new ApiError(403, 'Bu amal uchun ruxsat yo‘q');
  return user;
};

export const assert: (cond: unknown, message: string, status?: number) => asserts cond = (cond, message, status = 422) => {
  if (!cond) throw new ApiError(status, message);
};

export const paginate = <T>(items: T[], page = 1, pageSize = 10): Paginated<T> => ({
  items: items.slice((page - 1) * pageSize, page * pageSize),
  total: items.length,
  page,
  pageSize,
});

/** Katta-kichik harf va apostrof farqisiz qidiruv */
export const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[ʻʼ‘’`']/g, "'")
    .trim();

export const matches = (q: string | null | undefined, ...fields: (string | undefined)[]) => {
  if (!q) return true;
  const n = norm(q);
  const digits = q.replace(/\D/g, '');
  return fields.some((f) => {
    if (!f) return false;
    if (norm(f).includes(n)) return true;
    // telefon: "+998"siz yozilsa ham topiladi
    return digits.length >= 3 && f.replace(/\D/g, '').includes(digits);
  });
};
