import { useMutation, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS as K } from '@/shared/constants/queryKeys';
import { invalidate } from '@/shared/lib/react-query';
import { treatmentsApi } from '../api/treatmentsApi';
import type { PlanItemInput, PlanItemStatus } from '../types';

export const useTreatmentPlan = (patientId: string) =>
  useQuery({ queryKey: [...K.treatments, patientId], queryFn: () => treatmentsApi.list(patientId) });

export const useAddPlanItem = () =>
  useMutation({ mutationFn: (input: PlanItemInput) => treatmentsApi.add(input), onSuccess: () => invalidate(K.treatments) });

export const useSetPlanStatus = () =>
  useMutation({
    mutationFn: ({ id, status }: { id: string; status: PlanItemStatus }) => treatmentsApi.setStatus(id, status),
    onSuccess: () => invalidate(K.treatments),
  });
