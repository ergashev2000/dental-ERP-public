/**
 * In-memory mock "ma'lumotlar bazasi". Seed'ning structuredClone nusxasi.
 * localStorage ishlatilmaydi — sahifa yangilanganda seed holatiga qaytadi.
 * Komponentlar bu faylga to'g'ridan-to'g'ri murojaat qilmaydi, faqat modullarning api/ qatlami.
 */
import type { UserRecord } from '@/modules/auth/types';
import type { Staff } from '@/modules/staff/types';
import type { Patient, PatientFile } from '@/modules/patients/types';
import type { Service } from '@/modules/services/types';
import type { Appointment } from '@/modules/appointments/types';
import type { ToothHistory, ToothRecord } from '@/modules/dental-chart/types';
import type { TreatmentPlanItem } from '@/modules/treatments/types';
import type { Invoice, Payment } from '@/modules/billing/types';
import type { Batch, Product, StockMovement, Supplier } from '@/modules/inventory/types';
import type { CallLog, ReminderJob, ReminderRule, ReminderSettings, VoiceTemplates } from '@/modules/reminders/types';
import type { Chair, ClinicSettings } from '@/modules/settings/types';
import type { AppNotification } from '@/modules/dashboard/types';
import type { OrthoCase, OrthoVisit } from '@/modules/orthodontics/types';
import { staffSeed, usersSeed } from './data/staff';
import { patientsSeed } from './data/patients';
import { chairsSeed, clinicSeed, productsSeed, servicesSeed, suppliersSeed } from './data/catalog';
import { appointmentsSeed } from './data/appointments';
import { invoicesSeed, paymentsSeed } from './data/billing';
import { toothHistorySeed, toothRecordsSeed, treatmentPlanSeed } from './data/clinical';
import { batchesSeed, movementsSeed } from './data/inventory';
import {
  callLogsSeed,
  reminderJobsSeed,
  reminderRulesSeed,
  reminderSettingsSeed,
  voiceTemplatesSeed,
} from './data/reminders';
import {
  orthoAppointmentsSeed,
  orthoCasesSeed,
  orthoInvoicesSeed,
  orthoPatientsSeed,
  orthoPaymentsSeed,
  orthoVisitsSeed,
} from './data/ortho';
import { dt } from './helpers';

export interface MockDb {
  users: UserRecord[];
  staff: Staff[];
  patients: Patient[];
  patientFiles: PatientFile[];
  chairs: Chair[];
  clinic: ClinicSettings;
  services: Service[];
  appointments: Appointment[];
  toothRecords: ToothRecord[];
  toothHistory: ToothHistory[];
  treatmentPlans: TreatmentPlanItem[];
  invoices: Invoice[];
  payments: Payment[];
  products: Product[];
  batches: Batch[];
  movements: StockMovement[];
  suppliers: Supplier[];
  reminderRules: ReminderRule[];
  reminderSettings: ReminderSettings;
  voiceTemplates: VoiceTemplates;
  reminderJobs: ReminderJob[];
  callLogs: CallLog[];
  orthoCases: OrthoCase[];
  orthoVisits: OrthoVisit[];
  /** Administrator uchun vazifa va bildirishnomalar (qo'ng'iroq natijalaridan) */
  tasks: (AppNotification & { done: boolean })[];
}

const seed: MockDb = {
  users: usersSeed,
  staff: staffSeed,
  patients: [...patientsSeed, ...orthoPatientsSeed],
  patientFiles: [],
  chairs: chairsSeed,
  clinic: clinicSeed,
  services: servicesSeed,
  appointments: [...appointmentsSeed, ...orthoAppointmentsSeed],
  toothRecords: toothRecordsSeed,
  toothHistory: toothHistorySeed,
  treatmentPlans: treatmentPlanSeed,
  invoices: [...invoicesSeed, ...orthoInvoicesSeed],
  payments: [...paymentsSeed, ...orthoPaymentsSeed],
  products: productsSeed,
  batches: batchesSeed,
  movements: movementsSeed,
  suppliers: suppliersSeed,
  reminderRules: reminderRulesSeed,
  reminderSettings: reminderSettingsSeed,
  voiceTemplates: voiceTemplatesSeed,
  reminderJobs: reminderJobsSeed,
  callLogs: callLogsSeed,
  orthoCases: orthoCasesSeed,
  orthoVisits: orthoVisitsSeed,
  tasks: [
    {
      id: 'task-a9',
      kind: 'CALL_CANCELLED',
      title: "Bemor qo‘ng‘iroqda qabulni bekor qildi",
      description: 'Ismoilova Feruza — bugun 15:00 (Aziz Rahimov)',
      at: dt(-1, '18:01'),
      link: '/appointments?appointment=a9',
      done: false,
    },
  ],
};

export const mockDb: MockDb = structuredClone(seed);
