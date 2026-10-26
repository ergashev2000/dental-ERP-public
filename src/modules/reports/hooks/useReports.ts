import { useQuery } from '@tanstack/react-query';
import { parseAsIsoDate, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { QUERY_KEYS as K } from '@/shared/constants/queryKeys';
import { reportsApi } from '../api/reportsApi';
import type { ReportQuery, ReportType } from '../types';

export const REPORT_TYPES = ['revenue', 'doctors', 'services', 'appointments', 'reminders', 'inventory'] as const satisfies readonly ReportType[];

export const useReportsParams = () =>
  useQueryStates(
    {
      type: parseAsStringLiteral(REPORT_TYPES),
      from: parseAsIsoDate,
      to: parseAsIsoDate,
      doctor: parseAsString,
    },
    { history: 'replace' },
  );

export const useReport = <T,>(type: ReportType, q: ReportQuery, fn: (q: ReportQuery) => Promise<T>, enabled = true) =>
  useQuery({ queryKey: [...K.reports, type, q], queryFn: () => fn(q), enabled });

export { reportsApi };
