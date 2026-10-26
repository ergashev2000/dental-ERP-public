import dayjs from '@/shared/lib/dayjs';
import { useAppointmentsRange } from '@/modules/appointments';

/** Bugungi qabullar bo'yicha tezkor hisoblagichlar (navbat ro'yxati bilan bir xil so'rov) */
export const useTodayCounts = (doctorId?: string) => {
  const today = dayjs().format('YYYY-MM-DD');
  const { data, isLoading } = useAppointmentsRange(today, today, { doctor: doctorId, includeCancelled: true });
  const now = dayjs();
  const list = (data ?? []).filter((a) => !a.masked && a.status !== 'CANCELLED');
  const count = (...s: string[]) => list.filter((a) => s.includes(a.status)).length;
  const upcoming = list.filter((a) => ['SCHEDULED', 'CONFIRMED'].includes(a.status) && dayjs(a.start).add(a.durationMin, 'minute').isAfter(now));
  return {
    isLoading,
    total: list.length,
    arrived: count('ARRIVED'),
    inChair: count('IN_PROGRESS'),
    done: count('COMPLETED'),
    noShow: count('NO_SHOW'),
    remaining: upcoming.length,
    unconfirmed: upcoming.filter((a) => a.status === 'SCHEDULED').length,
  };
};
