import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from 'nuqs';
import { QUERY_KEYS as K } from '@/shared/constants/queryKeys';
import { invalidate } from '@/shared/lib/react-query';
import { isValidUzPhone } from '@/shared/utils/format';
import { patientsApi } from '../api/patientsApi';
import type { PatientFilters, PatientInput } from '../types';

export const PATIENT_SORTS = ['-createdAt', 'name', '-lastVisit', '-debt'] as const;
export const PATIENT_TABS = ['overview', 'chart', 'plan', 'visits', 'payments', 'files', 'documents', 'lab', 'ortho', 'reminders'] as const;
export type PatientTab = (typeof PATIENT_TABS)[number];

export const usePatientsParams = () =>
  useQueryStates(
    {
      q: parseAsString.withOptions({ throttleMs: 300 }),
      tag: parseAsString,
      hasDebt: parseAsBoolean,
      doctor: parseAsString,
      sort: parseAsStringLiteral(PATIENT_SORTS).withDefault('-createdAt'),
      page: parseAsInteger.withDefault(1),
    },
    { history: 'replace' },
  );

export const usePatientTab = () =>
  useQueryState('tab', parseAsStringLiteral(PATIENT_TABS).withDefault('overview').withOptions({ history: 'replace' }));

export const usePatients = (f: PatientFilters) =>
  useQuery({
    queryKey: [...K.patients, 'list', f],
    queryFn: () => patientsApi.list(f),
    placeholderData: keepPreviousData,
  });

export const usePatient = (id?: string | null) =>
  useQuery({ queryKey: [...K.patients, 'one', id], queryFn: () => patientsApi.get(id!), enabled: !!id });

export const usePatientSearch = (q: string, enabled = true) =>
  useQuery({
    queryKey: [...K.patients, 'search', q],
    queryFn: () => patientsApi.search(q),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });

export const useSavePatient = () =>
  useMutation({
    mutationFn: ({ id, input }: { id?: string; input: PatientInput }) =>
      id ? patientsApi.update(id, input) : patientsApi.create(input),
    onSuccess: () => invalidate(K.patients, K.appointments),
  });

export const usePatientFiles = (patientId: string) =>
  useQuery({ queryKey: [...K.patients, 'files', patientId], queryFn: () => patientsApi.files(patientId) });

export const useUploadFile = () =>
  useMutation({
    mutationFn: ({ patientId, file, note }: { patientId: string; file: File; note?: string }) =>
      patientsApi.uploadFile(patientId, file, note),
    onSuccess: () => invalidate(K.patients),
  });

export const useUpdateFileNote = () =>
  useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => patientsApi.updateFileNote(id, note),
    onSuccess: () => invalidate(K.patients),
  });

export const useDeleteFile = () =>
  useMutation({ mutationFn: (id: string) => patientsApi.deleteFile(id), onSuccess: () => invalidate(K.patients) });

/** Telefon raqam boshqa bemorga tegishlimi — takroriy bemor yaratilmasligi uchun */
export const usePhoneOwner = (phone?: string, excludeId?: string) =>
  useQuery({
    queryKey: [...K.patients, 'phone-owner', phone, excludeId],
    queryFn: () => patientsApi.checkPhone(phone!, excludeId),
    enabled: !!phone && isValidUzPhone(phone),
  });
