import { mockDb } from '@/shared/lib/mock/mockDb';
import { ApiError, currentUser, mockRequest, norm, tokenFor } from '@/shared/lib/mock/mockRequest';
import { normalizePhone } from '@/shared/utils/format';
import type { LoginPayload, Session } from '../types';

const toSession = (userId: string): Session => {
  const u = mockDb.users.find((x) => x.id === userId)!;
  const { password: _password, ...user } = u;
  return {
    token: tokenFor(u.id),
    user,
    staffName: mockDb.staff.find((s) => s.id === u.staffId)?.fullName ?? u.username,
  };
};

export const authApi = {
  // POST /api/auth/login
  login: (payload: LoginPayload) =>
    mockRequest(() => {
      const login = norm(payload.login);
      const phone = normalizePhone(payload.login);
      const user = mockDb.users.find((u) => {
        if (norm(u.username) === login) return true;
        const staff = mockDb.staff.find((s) => s.id === u.staffId);
        return !!phone && staff?.phone === phone;
      });
      if (!user || user.password !== payload.password) throw new ApiError(401, 'Login yoki parol noto‘g‘ri');
      if (!user.isActive) throw new ApiError(403, 'Foydalanuvchi bloklangan. Administratorga murojaat qiling.');
      return toSession(user.id);
    }, 500),

  // GET /api/auth/me
  me: () => mockRequest(() => toSession(currentUser().id), 150),
};
