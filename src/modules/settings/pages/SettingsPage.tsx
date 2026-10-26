import type { ReactNode } from 'react';
import { PageHeader } from '@/shared/components/ui';
import { ROUTES } from '@/shared/constants/routes';
import { ChairsTab } from '../components/ChairsTab';
import { ClinicTab } from '../components/ClinicTab';
import { PaymentMethodsTab, ReceiptTab } from '../components/PaymentsReceiptTabs';
import { RolesTab } from '../components/RolesTab';
import { UsersTab } from '../components/UsersTab';

export type SettingsSection = 'clinic' | 'chairs' | 'users' | 'roles' | 'payments' | 'receipt';

const SECTIONS: Record<SettingsSection, { title: string; description: string; content: ReactNode }> = {
  clinic: { title: 'Klinika', description: 'Nomi, manzili, ish vaqti va ish kunlari', content: <ClinicTab /> },
  chairs: { title: 'Kabinetlar', description: 'Kreslolar va kabinetlar ro‘yxati', content: <ChairsTab /> },
  users: { title: 'Foydalanuvchilar', description: 'Tizimga kirish loginlari, rollar va parollar', content: <UsersTab /> },
  roles: { title: 'Rollar va ruxsatlar', description: 'Har bir rol nimalarni ko‘ra va qila olishi', content: <RolesTab /> },
  payments: { title: 'To‘lov turlari', description: 'Kassada qabul qilinadigan to‘lov turlari', content: <PaymentMethodsTab /> },
  receipt: { title: 'Chek', description: 'Chekning yuqori va pastki matni', content: <ReceiptTab /> },
};

/**
 * Sozlamalar bo'limidagi bitta sahifa (sidebar'da "Sozlamalar" ichida).
 * Sarlavha Header'ga ketadi; kontent — kulrang panel ustidagi oq kartalar (har bir tab o'zi tuzadi).
 */
export const SettingsPage = ({ section }: { section: SettingsSection }) => {
  const s = SECTIONS[section];
  return (
    <>
      <PageHeader
        title={s.title}
        description={s.description}
        breadcrumb={[{ label: 'Bosh sahifa', to: ROUTES.dashboard }, { label: 'Sozlamalar' }, { label: s.title }]}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-4">{s.content}</div>
    </>
  );
};
