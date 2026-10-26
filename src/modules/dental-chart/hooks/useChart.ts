import { useMutation, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS as K } from '@/shared/constants/queryKeys';
import { invalidate } from '@/shared/lib/react-query';
import { chartApi } from '../api/chartApi';
import type { ToothCondition, ToothPatch } from '../types';

export const useChart = (patientId: string) =>
  useQuery({ queryKey: [...K.chart, patientId], queryFn: () => chartApi.get(patientId), enabled: !!patientId });

/** tooth berilmasa — bemorning butun sxema tarixi */
export const useToothHistory = (patientId: string, tooth?: number) =>
  useQuery({
    queryKey: [...K.chart, patientId, 'history', tooth ?? 'all'],
    queryFn: () => chartApi.history(patientId, tooth),
  });

export const useUpdateTooth = (patientId: string) =>
  useMutation({
    mutationFn: ({ tooth, patch }: { tooth: number; patch: ToothPatch }) => chartApi.updateTooth(patientId, tooth, patch),
    onSuccess: () => invalidate(K.chart),
  });

export const useBulkCondition = (patientId: string) =>
  useMutation({
    mutationFn: ({ teeth, condition }: { teeth: number[]; condition: ToothCondition }) =>
      chartApi.bulkAdd(patientId, teeth, condition),
    onSuccess: () => invalidate(K.chart),
  });
