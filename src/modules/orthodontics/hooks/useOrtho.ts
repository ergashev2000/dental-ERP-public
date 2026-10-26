import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { parseAsBoolean, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { QUERY_KEYS as K } from '@/shared/constants/queryKeys';
import { invalidate } from '@/shared/lib/react-query';
import { orthoApi } from '../api/orthoApi';
import { ORTHO_STAGES, type OrthoCaseInput, type OrthoFilters, type OrthoStage, type OrthoVisitInput } from '../types';

export const ORTHO_STATUS_FILTERS = ['ACTIVE', 'PAUSED', 'FINISHED', 'ALL'] as const;

export const useOrthoParams = () =>
  useQueryStates(
    {
      q: parseAsString.withOptions({ throttleMs: 300 }),
      stage: parseAsStringLiteral(ORTHO_STAGES),
      doctor: parseAsString,
      status: parseAsStringLiteral(ORTHO_STATUS_FILTERS).withDefault('ACTIVE'),
      overdue: parseAsBoolean,
      debt: parseAsBoolean,
    },
    { history: 'replace' },
  );

export const useOrthoCases = (f: OrthoFilters) =>
  useQuery({ queryKey: [...K.ortho, 'list', f], queryFn: () => orthoApi.list(f), placeholderData: keepPreviousData });

export const useOrthoStats = () => useQuery({ queryKey: [...K.ortho, 'stats'], queryFn: orthoApi.stats });

export const useOrthoCase = (id?: string | null) =>
  useQuery({ queryKey: [...K.ortho, 'one', id], queryFn: () => orthoApi.get(id!), enabled: !!id });

export const usePatientOrtho = (patientId?: string | null) =>
  useQuery({ queryKey: [...K.ortho, 'patient', patientId], queryFn: () => orthoApi.byPatient(patientId!), enabled: !!patientId });

const refresh = () => invalidate(K.ortho, K.patients, K.billing, K.dashboard, K.notifications);

export const useSaveOrthoCase = () =>
  useMutation({
    mutationFn: ({ id, input }: { id?: string; input: OrthoCaseInput }) => (id ? orthoApi.update(id, input) : orthoApi.create(input)),
    onSuccess: refresh,
  });

export const useSetOrthoStage = () =>
  useMutation({ mutationFn: ({ id, stage }: { id: string; stage: OrthoStage }) => orthoApi.setStage(id, stage), onSuccess: refresh });

export const useLogOrthoContact = () =>
  useMutation({ mutationFn: ({ id, note }: { id: string; note: string }) => orthoApi.logContact(id, note), onSuccess: refresh });

export const useOrthoAutoCall = () => useMutation({ mutationFn: (ids: string[]) => orthoApi.autoCall(ids), onSuccess: refresh });

export const useAddOrthoVisit = () =>
  useMutation({ mutationFn: (input: OrthoVisitInput) => orthoApi.addVisit(input), onSuccess: refresh });
