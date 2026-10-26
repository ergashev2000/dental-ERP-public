import { Drawer, Layout } from 'antd';
import { Suspense, useEffect } from 'react';
import { Outlet } from 'react-router';
import { useUiStore } from '@/app/store';
import { useIsMobile, useIsTablet } from '@/shared/hooks/useMediaQuery';
import { QUERY_KEYS as K } from '@/shared/constants/queryKeys';
import { invalidate } from '@/shared/lib/react-query';
import { onCallsChanged, startCallSimulator } from '@/shared/lib/mock/callSimulator';
import { AppointmentDrawer, NewAppointmentModal, QuickBookingDrawer, useAppointmentHotkeys } from '@/modules/appointments';
import { PaymentModal } from '@/modules/billing';
import { CardSkeleton } from '../ui/States';
import { Header } from './Header';
import { SidebarContent } from './Sidebar';

export const MainLayout = () => {
  const collapsedPref = useUiStore((s) => s.sidebarCollapsed);
  const mobileOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileNav = useUiStore((s) => s.setMobileNav);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  // 768–1280px: sidebar avtomatik yig'iladi
  const collapsed = isTablet || collapsedPref;
  useAppointmentHotkeys();

  // Qo'ng'iroq simulyatsiyasi (mock): natija kelganda tegishli ma'lumotlar yangilanadi
  useEffect(() => {
    const stop = startCallSimulator();
    const off = onCallsChanged(() => {
      void invalidate(K.reminders, K.appointments, K.dashboard, K.notifications);
    });
    return () => {
      stop();
      off();
    };
  }, []);

  // Lime Health (klinika varianti): oq sahifa, chapda qora sidebar, kontent — och panel ichidagi oq kartalar
  return (
    <Layout className="min-h-screen bg-sidebar">
      {!isMobile && (
        <Layout.Sider
          width={248}
          collapsedWidth={72}
          collapsed={collapsed}
          trigger={null}
          className="!sticky top-0 h-screen overflow-hidden bg-sidebar"
        >
          <SidebarContent collapsed={collapsed} />
        </Layout.Sider>
      )}
      {isMobile && (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileNav(false)}
          placement="left"
          width={280}
          closable={false}
          styles={{ body: { padding: 0 }, content: { background: 'var(--color-sidebar)' } }}
        >
          <SidebarContent onNavigate={() => setMobileNav(false)} />
        </Drawer>
      )}
      <Layout className="min-w-0 bg-panel md:rounded-l-sheet">
        <Header collapsed={collapsed} />
        {/* flex-col: ro'yxat sahifalaridagi asosiy karta (className="flex-1") pastgacha cho'ziladi */}
        <Layout.Content className="flex min-w-0 flex-col px-3 pb-6 md:px-6">
          <Suspense fallback={<CardSkeleton rows={8} />}>
            <Outlet />
          </Suspense>
        </Layout.Content>
      </Layout>

      {/* Global oynalar: istalgan sahifadan ochiladi */}
      <NewAppointmentModal />
      <QuickBookingDrawer />
      <AppointmentDrawer />
      <PaymentModal />
    </Layout>
  );
};
