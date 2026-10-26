import { useMutation, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS as K } from '@/shared/constants/queryKeys';
import { invalidate, queryClient } from '@/shared/lib/react-query';
import { settingsApi } from '../api/settingsApi';
import type { PermissionMatrix } from '@/shared/constants/roles';
import type { Chair, ClinicSettings, UserInput } from '../types';

export const useClinic = () =>
  useQuery({ queryKey: [...K.settings, 'clinic'], queryFn: settingsApi.getClinic, staleTime: 5 * 60_000 });

export const useChairs = () =>
  useQuery({ queryKey: [...K.settings, 'chairs'], queryFn: settingsApi.chairs, staleTime: 5 * 60_000 });

export const useUsers = (enabled = true) =>
  useQuery({ queryKey: [...K.settings, 'users'], queryFn: settingsApi.users, enabled });

export const useUpdateClinic = () =>
  useMutation({
    mutationFn: (patch: Partial<ClinicSettings>) => settingsApi.updateClinic(patch),
    onSuccess: () => invalidate(K.settings, K.appointments),
  });

export const useSaveChair = () =>
  useMutation({
    mutationFn: (chair: Omit<Chair, 'id'> & { id?: string }) => settingsApi.saveChair(chair),
    onSuccess: () => invalidate(K.settings),
  });

export const useSaveUser = () =>
  useMutation({
    mutationFn: ({ id, input }: { id?: string; input: UserInput }) => settingsApi.saveUser(input, id),
    onSuccess: () => invalidate(K.settings, K.staff),
  });

export const useResetPassword = () => useMutation({ mutationFn: (id: string) => settingsApi.resetPassword(id) });

export const useRolePermissions = () => useQuery({ queryKey: [...K.settings, 'roles'], queryFn: settingsApi.rolePermissions });

export const useSaveRolePermissions = () =>
  useMutation({
    mutationFn: (matrix: PermissionMatrix) => settingsApi.saveRolePermissions(matrix),
    // Ruxsatlar o'zgardi — hamma ma'lumot qayta so'raladi
    onSuccess: () => queryClient.invalidateQueries(),
  });
