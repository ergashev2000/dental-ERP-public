import { useMutation, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS as K } from '@/shared/constants/queryKeys';
import { invalidate } from '@/shared/lib/react-query';
import { branchesApi } from '../api/branchesApi';
import type { BranchInput } from '../types';

export const useBranches = () => useQuery({ queryKey: K.branches, queryFn: branchesApi.list, staleTime: 5 * 60_000 });

export const useSaveBranch = () =>
  useMutation({
    mutationFn: ({ id, input }: { id?: string; input: BranchInput }) => branchesApi.save(input, id),
    onSuccess: () => invalidate(K.branches),
  });
