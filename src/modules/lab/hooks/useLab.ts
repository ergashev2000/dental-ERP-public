import { useMutation, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS as K } from '@/shared/constants/queryKeys';
import { invalidate } from '@/shared/lib/react-query';
import { labApi } from '../api/labApi';
import type { LabOrderInput, LabStatus } from '../types';

export const useLabs = () => useQuery({ queryKey: [...K.lab, 'labs'], queryFn: labApi.labs, staleTime: 10 * 60_000 });

/** patientId berilsa — faqat shu bemorning buyurtmalari */
export const useLabOrders = (patientId?: string) =>
  useQuery({ queryKey: [...K.lab, 'orders', patientId ?? 'all'], queryFn: () => labApi.list(patientId) });

export const useSaveLabOrder = () =>
  useMutation({
    mutationFn: ({ id, input }: { id?: string; input: LabOrderInput }) => labApi.save(input, id),
    onSuccess: () => invalidate(K.lab),
  });

export const useSetLabStatus = () =>
  useMutation({
    mutationFn: ({ id, status, note, dueDate }: { id: string; status: LabStatus; note?: string; dueDate?: string }) =>
      labApi.setStatus(id, status, { note, dueDate }),
    onSuccess: () => invalidate(K.lab),
  });
