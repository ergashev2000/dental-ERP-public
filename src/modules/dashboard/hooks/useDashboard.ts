import { useMutation, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS as K } from '@/shared/constants/queryKeys';
import { invalidate } from '@/shared/lib/react-query';
import { dashboardApi } from '../api/dashboardApi';

export const useDashboardSummary = () =>
  useQuery({ queryKey: [...K.dashboard, 'summary'], queryFn: dashboardApi.summary, refetchInterval: 30_000 });

/** Bugungi kun: tibbiy ogohlantirishlar, yakunlanmagan tashriflar, kreslolar holati */
export const useDashboardDay = () =>
  useQuery({ queryKey: [...K.dashboard, 'day'], queryFn: dashboardApi.day, refetchInterval: 15_000 });

export const useNotifications = () =>
  useQuery({ queryKey: [...K.notifications], queryFn: dashboardApi.notifications, refetchInterval: 30_000 });

export const useDismissNotification = () =>
  useMutation({ mutationFn: (id: string) => dashboardApi.dismiss(id), onSuccess: () => invalidate(K.notifications) });
