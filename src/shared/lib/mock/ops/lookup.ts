import dayjs from '@/shared/lib/dayjs';
import { fullName, shortName } from '@/shared/utils/format';
import { mockDb } from '../mockDb';
import { ApiError } from '../mockRequest';

export const findPatient = (id: string) => {
  const p = mockDb.patients.find((x) => x.id === id);
  if (!p) throw new ApiError(404, 'Bemor topilmadi');
  return p;
};

export const findAppointment = (id: string) => {
  const a = mockDb.appointments.find((x) => x.id === id);
  if (!a) throw new ApiError(404, 'Qabul topilmadi');
  return a;
};

export const findStaff = (id: string) => {
  const s = mockDb.staff.find((x) => x.id === id);
  if (!s) throw new ApiError(404, 'Xodim topilmadi');
  return s;
};

export const findService = (id: string) => {
  const s = mockDb.services.find((x) => x.id === id);
  if (!s) throw new ApiError(404, 'Xizmat topilmadi');
  return s;
};

export const findProduct = (id: string) => {
  const p = mockDb.products.find((x) => x.id === id);
  if (!p) throw new ApiError(404, 'Mahsulot topilmadi');
  return p;
};

export const findInvoice = (id: string) => {
  const i = mockDb.invoices.find((x) => x.id === id);
  if (!i) throw new ApiError(404, 'Hisob-faktura topilmadi');
  return i;
};

export const patientName = (id: string) => shortName(mockDb.patients.find((p) => p.id === id));
export const patientFullName = (id: string) => fullName(mockDb.patients.find((p) => p.id === id));
export const staffName = (id?: string) => mockDb.staff.find((s) => s.id === id)?.fullName ?? '—';
export const serviceName = (id: string) => mockDb.services.find((s) => s.id === id)?.name ?? '—';
export const chairName = (id: string) => mockDb.chairs.find((c) => c.id === id)?.name ?? '—';

export const invoiceRemaining = (inv: { total: number; paid: number; status: string }) =>
  inv.status === 'CANCELLED' ? 0 : Math.max(0, inv.total - inv.paid);

export const patientDebt = (patientId: string) =>
  mockDb.invoices.filter((i) => i.patientId === patientId).reduce((s, i) => s + invoiceRemaining(i), 0);

export const lastVisit = (patientId: string) =>
  mockDb.appointments
    .filter((a) => a.patientId === patientId && a.status === 'COMPLETED')
    .map((a) => a.start)
    .sort()
    .at(-1);

export const nextAppointment = (patientId: string) =>
  mockDb.appointments
    .filter(
      (a) =>
        a.patientId === patientId &&
        ['SCHEDULED', 'CONFIRMED'].includes(a.status) &&
        dayjs(a.start).isAfter(dayjs()),
    )
    .map((a) => a.start)
    .sort()
    .at(0);
