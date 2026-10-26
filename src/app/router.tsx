import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { MainLayout } from '@/shared/components/layout/MainLayout';
import { ForbiddenPage, HomeRoute, NotFoundPage, ProtectedRoute, RoleGuard, RootLayout } from '@/shared/components/layout/Guards';
import type { Permission } from '@/shared/constants/roles';
import {
  AppointmentsPage,
  BillingPage,
  BranchesPage,
  DashboardPage,
  InventoryPage,
  LabPage,
  LoginPage,
  NewAppointmentPage,
  OrthoCasePage,
  OrthoPage,
  PatientCardPage,
  PatientsPage,
  RemindersPage,
  ReportsPage,
  ServicesPage,
  SettingsPage,
  StaffPage,
  VisitPage,
} from './pages';

const guard = (perm: Permission, el: ReactNode) => <RoleGuard perm={perm}>{el}</RoleGuard>;

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <MainLayout />,
            children: [
              { index: true, element: <HomeRoute dashboard={<DashboardPage />} /> },
              { path: 'appointments', element: guard('appointment.manage', <AppointmentsPage />) },
              { path: 'appointments/new', element: guard('appointment.manage', <NewAppointmentPage />) },
              { path: 'visit/:id', element: guard('appointment.manage', <VisitPage />) },
              { path: 'patients', element: guard('patient.view', <PatientsPage />) },
              { path: 'patients/:id', element: guard('patient.view', <PatientCardPage />) },
              { path: 'lab', element: guard('lab.view', <LabPage />) },
              { path: 'orthodontics', element: guard('ortho.view', <OrthoPage />) },
              { path: 'orthodontics/:id', element: guard('ortho.view', <OrthoCasePage />) },
              { path: 'billing', element: guard('billing.view', <BillingPage />) },
              { path: 'inventory', element: guard('inventory.view', <InventoryPage />) },
              { path: 'reminders', element: guard('reminder.view', <RemindersPage />) },
              { path: 'reports', element: guard('report.view', <ReportsPage />) },
              {
                path: 'settings',
                children: [
                  { index: true, element: <Navigate to="clinic" replace /> },
                  { path: 'clinic', element: guard('settings.manage', <SettingsPage section="clinic" />) },
                  { path: 'chairs', element: guard('settings.manage', <SettingsPage section="chairs" />) },
                  { path: 'branches', element: guard('branch.manage', <BranchesPage />) },
                  { path: 'services', element: guard('service.view', <ServicesPage />) },
                  { path: 'staff', element: guard('staff.view', <StaffPage />) },
                  { path: 'users', element: guard('settings.manage', <SettingsPage section="users" />) },
                  { path: 'roles', element: guard('settings.manage', <SettingsPage section="roles" />) },
                  { path: 'payments', element: guard('settings.manage', <SettingsPage section="payments" />) },
                  { path: 'receipt', element: guard('settings.manage', <SettingsPage section="receipt" />) },
                ],
              },
              // Eski manzillar
              { path: 'services', element: <Navigate to="/settings/services" replace /> },
              { path: 'staff', element: <Navigate to="/settings/staff" replace /> },
              { path: '403', element: <ForbiddenPage /> },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
