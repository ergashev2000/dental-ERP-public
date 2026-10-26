import { mockRequest, requireRole, assert } from '@/shared/lib/mock/mockRequest';
import type { Branch, BranchInput } from '../types';

/**
 * Filiallar — mock (modul ichida saqlanadi, sahifa yangilanganda seed'ga qaytadi).
 * Backend'da har bir jadvalda branch_id bo'ladi (TZ 8-bo'lim); mock'da ma'lumotlar filial bo'yicha ajratilmaydi.
 */
const seed: Branch[] = [
  { id: 'b1', name: 'Chilonzor filiali', address: 'Toshkent, Chilonzor 9-kvartal, 12-uy', phone: '+998712000101', chairs: 4, isActive: true, stats: { revenue: 48_600_000, appointments: 312, noShowRate: 6.4, newPatients: 41 } },
  { id: 'b2', name: 'Yunusobod filiali', address: 'Toshkent, Yunusobod 4-mavze, 7-uy', phone: '+998712000202', chairs: 3, isActive: true, stats: { revenue: 36_900_000, appointments: 247, noShowRate: 9.1, newPatients: 33 } },
  { id: 'b3', name: 'Sergeli filiali', address: 'Toshkent, Sergeli 6-mavze, 21-uy', phone: '+998712000303', chairs: 2, isActive: true, stats: { revenue: 19_400_000, appointments: 138, noShowRate: 11.8, newPatients: 22 } },
];
const db: Branch[] = structuredClone(seed);

export const branchesApi = {
  // GET /api/branches
  list: () => mockRequest(() => db, 200),

  // POST/PUT /api/branches
  save: (input: BranchInput, id?: string) =>
    mockRequest(() => {
      requireRole('OWNER');
      assert(input.name.trim().length >= 2, 'Filial nomini kiriting');
      if (id) {
        const b = db.find((x) => x.id === id);
        assert(b, 'Filial topilmadi', 404);
        Object.assign(b, input);
        return b;
      }
      const b: Branch = { id: `b${db.length + 1}`, ...input, stats: { revenue: 0, appointments: 0, noShowRate: 0, newPatients: 0 } };
      db.push(b);
      return b;
    }),
};
