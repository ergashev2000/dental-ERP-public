import { useState } from 'react';
import { Panel } from '@/shared/components/ui';
import { useCallLogs } from '../hooks/useReminders';
import { CallsTable } from './CallsTable';

/** Bemor kartasidagi "Eslatmalar" tabi: shu bemorga qilingan qo'ng'iroqlar */
export const PatientCallsTab = ({ patientId }: { patientId: string }) => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCallLogs({ patientId, page, pageSize: 10 });
  return (
    <Panel title="Qo‘ng‘iroqlar tarixi" bodyClassName="p-3 md:p-4">
      <CallsTable data={data?.items} loading={isLoading} total={data?.total} page={page} pageSize={10} onPage={setPage} hidePatient />
    </Panel>
  );
};
