import { useMutation, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS as K } from '@/shared/constants/queryKeys';
import { invalidate } from '@/shared/lib/react-query';
import { documentsApi } from '../api/documentsApi';
import type { DocumentInput } from '../types';

export const usePatientDocuments = (patientId: string) =>
  useQuery({ queryKey: [...K.documents, 'patient', patientId], queryFn: () => documentsApi.list(patientId) });

export const useDocumentContext = (patientId: string) =>
  useQuery({ queryKey: [...K.documents, 'context', patientId], queryFn: () => documentsApi.context(patientId), staleTime: 5 * 60_000 });

export const useSaveDocument = () =>
  useMutation({
    mutationFn: ({ id, input }: { id?: string; input: DocumentInput }) => documentsApi.save(input, id),
    onSuccess: () => invalidate(K.documents),
  });

export const useRemoveDraft = () =>
  useMutation({
    mutationFn: (id: string) => documentsApi.removeDraft(id),
    onSuccess: () => invalidate(K.documents),
  });
