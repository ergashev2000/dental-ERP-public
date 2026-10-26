import { useMutation, useQuery } from '@tanstack/react-query';
import { parseAsString, useQueryStates } from 'nuqs';
import { QUERY_KEYS as K } from '@/shared/constants/queryKeys';
import { invalidate } from '@/shared/lib/react-query';
import { servicesApi, type ServiceFilters } from '../api/servicesApi';
import type { ServiceInput } from '../types';

export const useServicesParams = () =>
  useQueryStates(
    {
      category: parseAsString,
      q: parseAsString.withOptions({ throttleMs: 300 }),
    },
    { history: 'replace' },
  );

export const useServices = (f: ServiceFilters = {}) =>
  useQuery({ queryKey: [...K.services, f], queryFn: () => servicesApi.list(f), staleTime: 60_000 });

export const usePopularServiceIds = () =>
  useQuery({ queryKey: [...K.services, 'popular'], queryFn: () => servicesApi.popular(), staleTime: 5 * 60_000 });

export const useSaveService = () =>
  useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ServiceInput }) => servicesApi.save(input, id),
    onSuccess: () => invalidate(K.services),
  });

export const useToggleService = () =>
  useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => servicesApi.toggleActive(id, isActive),
    onSuccess: () => invalidate(K.services),
  });
