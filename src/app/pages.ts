/** Sahifalar — lazy yuklanadi (router.tsx faqat marshrutlarni tuzadi) */
import { lazy } from 'react';

export const LoginPage = lazy(() => import('@/modules/auth').then((m) => ({ default: m.LoginPage })));
export const DashboardPage = lazy(() => import('@/modules/dashboard').then((m) => ({ default: m.DashboardPage })));
export const AppointmentsPage = lazy(() => import('@/modules/appointments').then((m) => ({ default: m.AppointmentsPage })));
export const NewAppointmentPage = lazy(() => import('@/modules/appointments').then((m) => ({ default: m.NewAppointmentPage })));
export const VisitPage = lazy(() => import('@/modules/appointments').then((m) => ({ default: m.VisitPage })));
export const PatientsPage = lazy(() => import('@/modules/patients').then((m) => ({ default: m.PatientsPage })));
export const PatientCardPage = lazy(() => import('@/modules/patients').then((m) => ({ default: m.PatientCardPage })));
export const OrthoPage = lazy(() => import('@/modules/orthodontics').then((m) => ({ default: m.OrthoPage })));
export const OrthoCasePage = lazy(() => import('@/modules/orthodontics').then((m) => ({ default: m.OrthoCasePage })));
export const BillingPage = lazy(() => import('@/modules/billing').then((m) => ({ default: m.BillingPage })));
export const InventoryPage = lazy(() => import('@/modules/inventory').then((m) => ({ default: m.InventoryPage })));
export const RemindersPage = lazy(() => import('@/modules/reminders').then((m) => ({ default: m.RemindersPage })));
export const ServicesPage = lazy(() => import('@/modules/services').then((m) => ({ default: m.ServicesPage })));
export const StaffPage = lazy(() => import('@/modules/staff').then((m) => ({ default: m.StaffPage })));
export const ReportsPage = lazy(() => import('@/modules/reports').then((m) => ({ default: m.ReportsPage })));
export const LabPage = lazy(() => import('@/modules/lab').then((m) => ({ default: m.LabPage })));
export const BranchesPage = lazy(() => import('@/modules/branches').then((m) => ({ default: m.BranchesPage })));
export const SettingsPage = lazy(() => import('@/modules/settings').then((m) => ({ default: m.SettingsPage })));
