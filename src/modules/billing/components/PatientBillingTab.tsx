import { useState } from 'react';
import { Panel, StatusTag } from '@/shared/components/ui';
import { formatMoney } from '@/shared/utils/format';
import { useInvoices, usePayments } from '../hooks/useBilling';
import { InvoicesTable, PaymentsTable } from './BillingTables';
import { InvoiceDrawer } from './InvoiceDrawer';

/** Bemor kartasidagi "To'lovlar" tabi */
export const PatientBillingTab = ({ patientId }: { patientId: string }) => {
  const [open, setOpen] = useState<string | null>(null);
  const invoices = useInvoices({ patientId, pageSize: 100 });
  const payments = usePayments({ patientId, pageSize: 100 });
  const debt = invoices.data?.items.reduce((s, i) => s + (i.status === 'CANCELLED' ? 0 : i.remaining), 0) ?? 0;
  return (
    <div className="flex flex-col gap-6">
      <Panel
        title="Hisob-fakturalar"
        extra={invoices.data && (debt > 0 ? <StatusTag tone="danger">Qarz: {formatMoney(debt)}</StatusTag> : <StatusTag tone="success">Qarz yo‘q</StatusTag>)}
        bodyClassName="p-3 md:p-4"
      >
        <InvoicesTable data={invoices.data?.items} loading={invoices.isLoading} onOpen={setOpen} hidePatient />
      </Panel>
      <Panel title="To‘lovlar" bodyClassName="p-3 md:p-4">
        <PaymentsTable data={payments.data?.items} loading={payments.isLoading} hidePatient />
      </Panel>
      <InvoiceDrawer id={open} onClose={() => setOpen(null)} />
    </div>
  );
};
