import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsIsoDate, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { QUERY_KEYS as K } from '@/shared/constants/queryKeys';
import { invalidate } from '@/shared/lib/react-query';
import { remindersApi } from '../api/remindersApi';
import type { CallLogFilters, RulesPayload, TemplateLang } from '../types';

export const REMINDER_TABS = ['queue', 'history', 'rules', 'template'] as const;
export const CALL_RESULTS = [
  'PENDING',
  'CALLING',
  'CONFIRMED',
  'CANCELLED_BY_PATIENT',
  'OPERATOR_REQUESTED',
  'NO_ANSWER',
  'BUSY',
  'FAILED',
  'SKIPPED',
] as const;

/** Navbat ko'rinishi: hammasi / qo'lda qo'ng'iroq kerak / navbatda / yakunlangan */
export const QUEUE_VIEWS = ['all', 'call', 'pending', 'done'] as const;

export const useRemindersParams = () =>
  useQueryStates(
    {
      tab: parseAsStringLiteral(REMINDER_TABS).withDefault('queue'),
      show: parseAsStringLiteral(QUEUE_VIEWS).withDefault('all'),
      from: parseAsIsoDate,
      to: parseAsIsoDate,
      result: parseAsStringLiteral(CALL_RESULTS),
      q: parseAsString.withOptions({ throttleMs: 300 }),
      page: parseAsInteger.withDefault(1),
    },
    { history: 'replace' },
  );

const REFRESH = 15_000;

export const useQueue = (q?: string | null) =>
  useQuery({ queryKey: [...K.reminders, 'queue', q], queryFn: () => remindersApi.queue(q), refetchInterval: REFRESH, placeholderData: keepPreviousData });

export const useReminderSummary = () =>
  useQuery({ queryKey: [...K.reminders, 'summary'], queryFn: remindersApi.summary, refetchInterval: REFRESH });

export const useCallLogs = (f: CallLogFilters, enabled = true) =>
  useQuery({ queryKey: [...K.reminders, 'calls', f], queryFn: () => remindersApi.calls(f), placeholderData: keepPreviousData, enabled });

export const useAppointmentJobs = (appointmentId?: string | null) =>
  useQuery({
    queryKey: [...K.reminders, 'appointment', appointmentId],
    queryFn: () => remindersApi.appointmentJobs(appointmentId!),
    enabled: !!appointmentId,
    refetchInterval: 5_000,
  });

export const useReminderRules = () => useQuery({ queryKey: [...K.reminders, 'rules'], queryFn: remindersApi.rules });

export const useTemplates = () => useQuery({ queryKey: [...K.reminders, 'templates'], queryFn: remindersApi.templates });

const refresh = () => invalidate(K.reminders, K.appointments, K.dashboard, K.notifications);

export const useCallNow = () => useMutation({ mutationFn: (jobId: string) => remindersApi.callNow(jobId), onSuccess: refresh });

export const useCallForAppointment = () =>
  useMutation({ mutationFn: (appointmentId: string) => remindersApi.callForAppointment(appointmentId), onSuccess: refresh });

export const useSkipJob = () => useMutation({ mutationFn: (jobId: string) => remindersApi.skip(jobId), onSuccess: refresh });

export const useConfirmJob = () => useMutation({ mutationFn: (jobId: string) => remindersApi.confirmManually(jobId), onSuccess: refresh });

export const useSaveRules = () => useMutation({ mutationFn: (p: RulesPayload) => remindersApi.saveRules(p), onSuccess: refresh });

export const useSaveTemplate = () =>
  useMutation({
    mutationFn: ({ lang, text }: { lang: TemplateLang; text: string }) => remindersApi.saveTemplate(lang, text),
    onSuccess: () => invalidate(K.reminders),
  });

export const useTestCall = () =>
  useMutation({ mutationFn: ({ phone, lang }: { phone: string; lang: TemplateLang }) => remindersApi.testCall(phone, lang) });
