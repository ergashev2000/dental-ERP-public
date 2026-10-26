import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsIsoDate,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from 'nuqs';
import { QUERY_KEYS as K } from '@/shared/constants/queryKeys';
import { invalidate } from '@/shared/lib/react-query';
import { appointmentsApi } from '../api/appointmentsApi';
import type { AppointmentFilters, AppointmentInput, AppointmentStatus, CompleteInput, MoveInput, SlotQuery } from '../types';

export const CALENDAR_VIEWS = ['day', 'week', 'list'] as const;
export type CalendarView = (typeof CALENDAR_VIEWS)[number];
export const APPOINTMENT_STATUSES = [
  'SCHEDULED',
  'CONFIRMED',
  'ARRIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const satisfies readonly AppointmentStatus[];

export const useAppointmentsParams = () =>
  useQueryStates(
    {
      view: parseAsStringLiteral(CALENDAR_VIEWS).withDefault('day'),
      date: parseAsIsoDate,
      doctor: parseAsString,
      status: parseAsStringLiteral(APPOINTMENT_STATUSES),
      q: parseAsString.withOptions({ throttleMs: 300 }),
      page: parseAsInteger.withDefault(1),
      resource: parseAsStringLiteral(['doctors', 'chairs'] as const).withDefault('doctors'),
      cancelled: parseAsBoolean.withDefault(false),
    },
    { history: 'replace' },
  );

/** Ochiq qabul drawer'i — istalgan sahifada ishlaydi (?appointment=ID) */
export const useAppointmentParam = () => useQueryState('appointment', parseAsString);

const REFRESH = 15_000;

export const useAppointmentsRange = (from: string, to: string, opts: { doctor?: string | null; includeCancelled?: boolean } = {}) =>
  useQuery({
    queryKey: [...K.appointments, 'range', from, to, opts],
    queryFn: () => appointmentsApi.range(from, to, opts),
    refetchInterval: REFRESH,
    placeholderData: keepPreviousData,
  });

export const useAppointmentsList = (f: AppointmentFilters, enabled = true) =>
  useQuery({
    queryKey: [...K.appointments, 'list', f],
    queryFn: () => appointmentsApi.list(f),
    placeholderData: keepPreviousData,
    refetchInterval: REFRESH,
    enabled,
  });

export const useAppointment = (id?: string | null) =>
  useQuery({
    queryKey: [...K.appointments, 'one', id],
    queryFn: () => appointmentsApi.get(id!),
    enabled: !!id,
    refetchInterval: REFRESH,
  });

export const useSlots = (q: Partial<SlotQuery>) =>
  useQuery({
    queryKey: [...K.appointments, 'slots', q],
    queryFn: () => appointmentsApi.slots(q as SlotQuery),
    enabled: !!(q.doctorId && q.date && q.durationMin),
  });

export const useSlotCheck = (c: { doctorId?: string; chairId?: string; start?: string; durationMin?: number; excludeId?: string; allowPast?: boolean }) =>
  useQuery({
    queryKey: [...K.appointments, 'check', c],
    queryFn: () => appointmentsApi.check(c as Required<Pick<typeof c, 'doctorId' | 'start' | 'durationMin'>> & typeof c),
    enabled: !!(c.doctorId && c.start && c.durationMin),
  });

export const useCompletionDraft = (id?: string | null) =>
  useQuery({ queryKey: [...K.appointments, 'draft', id], queryFn: () => appointmentsApi.completionDraft(id!), enabled: !!id, staleTime: 0 });

const afterChange = () => invalidate(K.appointments, K.dashboard, K.reminders, K.notifications, K.patients, K.ortho);

export const useCreateAppointment = () =>
  useMutation({ mutationFn: (input: AppointmentInput) => appointmentsApi.create(input), onSuccess: afterChange });

export const useMoveAppointment = () =>
  useMutation({ mutationFn: (input: MoveInput) => appointmentsApi.move(input), onSuccess: afterChange });

export const useSetAppointmentStatus = () =>
  useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) => appointmentsApi.setStatus(id, status),
    onSuccess: afterChange,
  });

export const useCancelAppointment = () =>
  useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => appointmentsApi.cancel(id, reason),
    onSuccess: afterChange,
  });

export const useCompleteAppointment = () =>
  useMutation({
    mutationFn: (input: CompleteInput) => appointmentsApi.complete(input),
    onSuccess: () => invalidate(K.appointments, K.dashboard, K.reminders, K.patients, K.billing, K.inventory, K.chart, K.treatments, K.notifications, K.ortho),
  });
