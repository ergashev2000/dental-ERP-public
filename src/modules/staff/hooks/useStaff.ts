import { useMutation, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS as K } from '@/shared/constants/queryKeys';
import { invalidate } from '@/shared/lib/react-query';
import { staffApi } from '../api/staffApi';
import type { StaffInput, TimeOff, WorkDay } from '../types';

export const useStaffList = () => useQuery({ queryKey: [...K.staff, 'list'], queryFn: staffApi.list });

export const useDoctors = () =>
  useQuery({ queryKey: [...K.staff, 'doctors'], queryFn: staffApi.doctors, staleTime: 60_000 });

const refresh = () => invalidate(K.staff, K.appointments, K.dashboard);

export const useSaveStaff = () =>
  useMutation({
    mutationFn: ({ id, input }: { id?: string; input: StaffInput }) => (id ? staffApi.update(id, input) : staffApi.create(input)),
    onSuccess: refresh,
  });

export const useSaveSchedule = () =>
  useMutation({
    mutationFn: ({ id, schedule }: { id: string; schedule: WorkDay[] }) => staffApi.updateSchedule(id, schedule),
    onSuccess: refresh,
  });

export const useAddTimeOff = () =>
  useMutation({
    mutationFn: ({ id, timeOff }: { id: string; timeOff: TimeOff }) => staffApi.addTimeOff(id, timeOff),
    onSuccess: refresh,
  });

export const useRemoveTimeOff = () =>
  useMutation({
    mutationFn: ({ id, index }: { id: string; index: number }) => staffApi.removeTimeOff(id, index),
    onSuccess: refresh,
  });
