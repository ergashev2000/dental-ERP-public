import type { ID } from '@/shared/types/common';

export type CallResult =
  | 'PENDING'
  | 'CALLING'
  | 'CONFIRMED'
  | 'CANCELLED_BY_PATIENT'
  | 'OPERATOR_REQUESTED'
  | 'NO_ANSWER'
  | 'BUSY'
  | 'FAILED'
  | 'SKIPPED';

export interface ReminderRule {
  id: ID;
  name: string;
  kind: 'BEFORE_HOURS' | 'DAY_BEFORE_AT';
  hours?: number;
  time?: string;
  retries: number;
  retryIntervalMin: number;
  isActive: boolean;
}

export interface ReminderJob {
  id: ID;
  appointmentId?: ID;
  patientId: ID;
  ruleId?: ID;
  type: 'APPOINTMENT' | 'RECALL';
  scheduledAt: string;
  attempt: number;
  maxAttempts: number;
  status: CallResult;
  updatedAt: string;
}

export interface CallLog {
  id: ID;
  jobId: ID;
  patientId: ID;
  phone: string;
  startedAt: string;
  durationSec: number;
  result: CallResult;
  keyPressed?: '1' | '2' | '3';
  attempt: number;
}

export interface ReminderSettings {
  callWindowStart: string;
  callWindowEnd: string;
  skipSunday: boolean;
  smsFallback: boolean;
  recallEnabled: boolean;
  recallMonths: number;
}

export type TemplateLang = 'uz' | 'ru';
export type VoiceTemplates = Record<TemplateLang, string>;

export interface JobView extends ReminderJob {
  patientName: string;
  phone: string;
  appointmentStart?: string;
  doctorName?: string;
  ruleName: string;
}

export interface CallLogView extends CallLog {
  patientName: string;
}

export interface QueueSummary {
  confirmed: number;
  cancelled: number;
  noAnswer: number;
  pending: number;
}

export interface CallLogFilters {
  from?: string | null;
  to?: string | null;
  result?: CallResult | null;
  q?: string | null;
  page?: number;
  pageSize?: number;
  patientId?: string;
  appointmentId?: string;
}

export interface RulesPayload {
  rules: ReminderRule[];
  settings: ReminderSettings;
}
