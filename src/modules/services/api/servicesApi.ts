import { mockDb } from '@/shared/lib/mock/mockDb';
import { assert, currentUser, matches, mockRequest, norm, requireRole } from '@/shared/lib/mock/mockRequest';
import { findService } from '@/shared/lib/mock/ops/lookup';
import { uid } from '@/shared/lib/mock/helpers';
import type { Service, ServiceInput } from '../types';

export interface ServiceFilters {
  q?: string | null;
  category?: string | null;
  activeOnly?: boolean;
}

const validate = (input: ServiceInput, id?: string) => {
  assert(input.price >= 0, 'Narx manfiy bo‘lishi mumkin emas');
  assert(input.durationMin > 0, 'Davomiylikni kiriting');
  const dup = mockDb.services.find((s) => norm(s.code) === norm(input.code) && s.id !== id);
  assert(!dup, `"${input.code}" kodi band`);
  const ids = input.materials.map((m) => m.productId);
  assert(new Set(ids).size === ids.length, 'Material normasida bir mahsulot ikki marta kiritilgan');
  assert(input.materials.every((m) => m.qty > 0), 'Material miqdori 0 dan katta bo‘lishi kerak');
};

export const servicesApi = {
  // GET /api/services?category=&q=
  list: (f: ServiceFilters = {}) =>
    mockRequest(() => {
      currentUser();
      return mockDb.services
        .filter((s) => (!f.activeOnly || s.isActive) && (!f.category || s.category === f.category) && matches(f.q, s.name, s.code))
        .sort((a, b) => a.code.localeCompare(b.code));
    }, 200),

  // GET /api/services/popular — eng ko'p bajarilgan xizmatlar ID'lari (kamayish tartibida)
  popular: () =>
    mockRequest(() => {
      currentUser();
      const count = new Map<string, number>();
      for (const inv of mockDb.invoices) for (const l of inv.lines) count.set(l.serviceId, (count.get(l.serviceId) ?? 0) + (l.qty || 1));
      return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
    }, 150),

  // GET /api/services/:id
  get: (id: string) => mockRequest(() => findService(id)),

  // POST /api/services | PUT /api/services/:id
  save: (input: ServiceInput, id?: string) =>
    mockRequest(() => {
      requireRole('OWNER', 'ADMIN');
      validate(input, id);
      if (id) {
        const s = findService(id);
        Object.assign(s, input);
        return s;
      }
      const s: Service = { ...input, id: uid('sv') };
      mockDb.services.push(s);
      return s;
    }),

  // PATCH /api/services/:id/active
  toggleActive: (id: string, isActive: boolean) =>
    mockRequest(() => {
      requireRole('OWNER', 'ADMIN');
      const s = findService(id);
      s.isActive = isActive;
      return s;
    }),
};
