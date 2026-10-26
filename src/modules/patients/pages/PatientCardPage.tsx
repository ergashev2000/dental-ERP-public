import { Tabs } from 'antd';
import { useState } from 'react';
import { useParams } from 'react-router';
import { CardSkeleton, ErrorState, PageHeader } from '@/shared/components/ui';
import { usePermissions } from '@/shared/hooks/usePermission';
import { shortName } from '@/shared/utils/format';
import { DentalChartTab } from '@/modules/dental-chart';
import { TreatmentPlanTab } from '@/modules/treatments';
import { PatientBillingTab } from '@/modules/billing';
import { PatientCallsTab } from '@/modules/reminders';
import { PatientOrthoTab } from '@/modules/orthodontics';
import { PatientDocumentsTab } from '@/modules/documents';
import { PatientLabOrders } from '@/modules/lab';
import { FilesTab } from '../components/FilesTab';
import { OverviewTab } from '../components/OverviewTab';
import { PatientFormDrawer } from '../components/PatientFormDrawer';
import { PatientHeader } from '../components/PatientHeader';
import { VisitsTab } from '../components/VisitsTab';
import { usePatient, usePatientTab, type PatientTab } from '../hooks/usePatients';

export const PatientCardPage = () => {
  const { id = '' } = useParams();
  const { data: patient, isLoading, isError, error, refetch } = usePatient(id);
  const [tab, setTab] = usePatientTab();
  const [editing, setEditing] = useState(false);
  const can = usePermissions();

  const title = patient ? shortName(patient) : 'Bemor kartasi';
  const crumbs = [{ label: 'Bemorlar', to: '/patients' }, { label: title }];

  if (isLoading)
    return (
      <>
        <PageHeader title={title} breadcrumb={crumbs} />
        <CardSkeleton rows={4} />
      </>
    );
  if (isError || !patient)
    return (
      <>
        <PageHeader title={title} breadcrumb={crumbs} />
        <ErrorState error={error} onRetry={() => void refetch()} />
      </>
    );

  const openTab = (k: PatientTab) => void setTab(k);
  const items = [
    { key: 'overview', label: 'Umumiy', children: <OverviewTab patient={patient} onOpenTab={openTab} /> },
    { key: 'chart', label: 'Tish sxemasi', children: <DentalChartTab patient={patient} /> },
    { key: 'plan', label: 'Davolash rejasi', children: <TreatmentPlanTab patient={patient} /> },
    { key: 'visits', label: 'Tashriflar', children: <VisitsTab patientId={patient.id} /> },
    { key: 'payments', label: 'To‘lovlar', children: <PatientBillingTab patientId={patient.id} /> },
    { key: 'files', label: 'Fayllar', children: <FilesTab patientId={patient.id} /> },
    can('document.manage') && { key: 'documents', label: 'Hujjatlar', children: <PatientDocumentsTab patientId={patient.id} /> },
    can('lab.view') && { key: 'lab', label: 'Laboratoriya', children: <PatientLabOrders patientId={patient.id} /> },
    { key: 'ortho', label: 'Breket', children: <PatientOrthoTab patientId={patient.id} /> },
    { key: 'reminders', label: 'Eslatmalar', children: <PatientCallsTab patientId={patient.id} /> },
  ].filter((t) => !!t);
  // ruxsat yo'q tab URL'da bo'lsa — umumiy tabga qaytamiz
  const active = items.some((t) => t.key === tab) ? tab : 'overview';

  return (
    <>
      <PageHeader title={title} breadcrumb={crumbs} />
      <PatientHeader patient={patient} onEdit={() => setEditing(true)} />
      <Tabs activeKey={active} onChange={(k) => openTab(k as PatientTab)} destroyOnHidden items={items} className="min-w-0" />
      <PatientFormDrawer open={editing} patient={patient} onClose={() => setEditing(false)} />
    </>
  );
};
