import { mockDb } from '@/shared/lib/mock/mockDb';
import { assert, currentUser, mockRequest, requireRole } from '@/shared/lib/mock/mockRequest';
import { findStaff } from '@/shared/lib/mock/ops/lookup';
import { uid } from '@/shared/lib/mock/helpers';
import { hasPermission } from '@/shared/constants/roles';
import { normalizePhone } from '@/shared/utils/format';
import type { Staff, StaffInput, TimeOff, WorkDay } from '../types';

export const staffApi = {
  // GET /api/staff  (shifokor faqat o'zini ko'radi)
  list: () =>
    mockRequest(() => {
      const user = currentUser();
      const all = hasPermission(user.role, 'staff.viewAll');
      return mockDb.staff.filter((s) => all || s.id === user.staffId);
    }),

  // GET /api/staff/doctors — kalendar va formalar uchun (hamma rollar)
  doctors: () =>
    mockRequest(() => {
      currentUser();
      return mockDb.staff.filter((s) => s.position === 'DOCTOR');
    }, 200),

  // GET /api/staff/:id
  get: (id: string) => mockRequest(() => findStaff(id)),

  // POST /api/staff
  create: (input: StaffInput) =>
    mockRequest(() => {
      requireRole('OWNER', 'ADMIN');
      const s: Staff = { ...input, phone: normalizePhone(input.phone), id: uid('s'), schedule: [], timeOff: [] };
      mockDb.staff.push(s);
      return s;
    }),

  // PUT /api/staff/:id
  update: (id: string, input: StaffInput) =>
    mockRequest(() => {
      requireRole('OWNER', 'ADMIN');
      const s = findStaff(id);
      Object.assign(s, input, { phone: normalizePhone(input.phone) });
      return s;
    }),

  // PUT /api/staff/:id/schedule
  updateSchedule: (id: string, schedule: WorkDay[]) =>
    mockRequest(() => {
      requireRole('OWNER', 'ADMIN');
      for (const d of schedule) {
        assert(d.start < d.end, 'Ish boshlanish vaqti tugash vaqtidan oldin bo‘lishi kerak');
        if (d.breakStart || d.breakEnd) {
          assert(d.breakStart && d.breakEnd && d.breakStart < d.breakEnd, 'Tushlik vaqti noto‘g‘ri');
          assert(d.breakStart >= d.start && d.breakEnd <= d.end, 'Tushlik ish vaqti ichida bo‘lishi kerak');
        }
      }
      const s = findStaff(id);
      s.schedule = schedule;
      return s;
    }),

  // POST /api/staff/:id/time-off
  addTimeOff: (id: string, t: TimeOff) =>
    mockRequest(() => {
      requireRole('OWNER', 'ADMIN');
      assert(t.from <= t.to, 'Sana oralig‘i noto‘g‘ri');
      const s = findStaff(id);
      s.timeOff.push(t);
      s.timeOff.sort((a, b) => a.from.localeCompare(b.from));
      return s;
    }),

  // DELETE /api/staff/:id/time-off/:index
  removeTimeOff: (id: string, index: number) =>
    mockRequest(() => {
      requireRole('OWNER', 'ADMIN');
      const s = findStaff(id);
      s.timeOff.splice(index, 1);
      return s;
    }),
};
