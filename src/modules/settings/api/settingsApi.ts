import { mockDb } from '@/shared/lib/mock/mockDb';
import { ApiError, assert, currentUser, mockRequest, norm, requireRole } from '@/shared/lib/mock/mockRequest';
import { staffName } from '@/shared/lib/mock/ops/lookup';
import { uid } from '@/shared/lib/mock/helpers';
import { usePermissionMatrix, type PermissionMatrix } from '@/shared/constants/roles';
import type { Chair, ClinicSettings, UserInput, UserView } from '../types';

const toUserView = (id: string): UserView => {
  const u = mockDb.users.find((x) => x.id === id);
  if (!u) throw new ApiError(404, 'Foydalanuvchi topilmadi');
  return { id: u.id, username: u.username, role: u.role, staffId: u.staffId, staffName: staffName(u.staffId), isActive: u.isActive };
};

export const settingsApi = {
  // GET /api/settings/clinic (hamma rollar o'qiydi: ish vaqti, nomi)
  getClinic: () =>
    mockRequest(() => {
      currentUser();
      return mockDb.clinic;
    }, 150),

  // PUT /api/settings/clinic
  updateClinic: (patch: Partial<ClinicSettings>) =>
    mockRequest(() => {
      requireRole('OWNER', 'ADMIN');
      const next = { ...mockDb.clinic, ...patch };
      assert(next.workStart < next.workEnd, 'Ish vaqti noto‘g‘ri');
      assert(next.workDays.length > 0, 'Kamida bitta ish kuni tanlang');
      assert(Object.values(next.paymentMethods).some(Boolean), 'Kamida bitta to‘lov turi yoqilgan bo‘lishi kerak');
      mockDb.clinic = next;
      return mockDb.clinic;
    }),

  // GET /api/chairs
  chairs: () =>
    mockRequest(() => {
      currentUser();
      return mockDb.chairs;
    }, 150),

  // POST /api/chairs
  saveChair: (chair: Omit<Chair, 'id'> & { id?: string }) =>
    mockRequest(() => {
      requireRole('OWNER', 'ADMIN');
      assert(chair.name.trim(), 'Nomini kiriting');
      if (chair.id) {
        const c = mockDb.chairs.find((x) => x.id === chair.id);
        assert(c, 'Kabinet topilmadi', 404);
        Object.assign(c, chair);
        return c;
      }
      const c: Chair = { ...chair, id: uid('c') };
      mockDb.chairs.push(c);
      return c;
    }),

  // GET /api/roles/permissions
  rolePermissions: () =>
    mockRequest(() => {
      requireRole('OWNER', 'ADMIN');
      return usePermissionMatrix.getState().matrix;
    }, 150),

  // PUT /api/roles/permissions
  saveRolePermissions: (matrix: PermissionMatrix) =>
    mockRequest(() => {
      requireRole('OWNER', 'ADMIN');
      // Boshqaruvchi o'zini qulflab qo'ymasin
      assert(matrix['settings.manage'].includes('ADMIN'), 'Boshqaruvchidan sozlamalar ruxsatini olib bo‘lmaydi');
      usePermissionMatrix.setState({ matrix });
      return matrix;
    }),

  // GET /api/users
  users: () =>
    mockRequest(() => {
      requireRole('OWNER', 'ADMIN');
      return mockDb.users.map((u) => toUserView(u.id));
    }),

  // POST /api/users | PUT /api/users/:id
  saveUser: (input: UserInput, id?: string) =>
    mockRequest(() => {
      requireRole('OWNER', 'ADMIN');
      const dup = mockDb.users.find((u) => norm(u.username) === norm(input.username) && u.id !== id);
      assert(!dup, 'Bu login band');
      if (id) {
        const u = mockDb.users.find((x) => x.id === id);
        assert(u, 'Foydalanuvchi topilmadi', 404);
        const me = currentUser();
        assert(!(u.id === me.id && !input.isActive), 'O‘zingizni nofaol qila olmaysiz');
        Object.assign(u, { username: input.username, role: input.role, staffId: input.staffId, isActive: input.isActive });
        return toUserView(u.id);
      }
      assert(input.password && input.password.length >= 6, 'Parol kamida 6 ta belgidan iborat bo‘lsin');
      const newId = uid('u');
      mockDb.users.push({
        id: newId,
        username: input.username,
        role: input.role,
        staffId: input.staffId,
        isActive: input.isActive,
        password: input.password,
      });
      return toUserView(newId);
    }),

  // POST /api/users/:id/reset-password
  resetPassword: (id: string) =>
    mockRequest(() => {
      requireRole('OWNER', 'ADMIN');
      const u = mockDb.users.find((x) => x.id === id);
      assert(u, 'Foydalanuvchi topilmadi', 404);
      const temp = String(Math.floor(100000 + Math.random() * 900000));
      u.password = temp;
      return { tempPassword: temp };
    }),
};
