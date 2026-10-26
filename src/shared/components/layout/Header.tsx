import { Button, Layout } from 'antd';
import { Menu as MenuIcon, PanelLeftClose, PanelLeftOpen, Plus } from '@/shared/icons';
import { Link } from 'react-router';
import { useUiStore } from '@/app/store';
import { usePageMetaStore } from '@/shared/hooks/usePageMeta';
import { useIsMobile, useIsTablet } from '@/shared/hooks/useMediaQuery';
import { usePermission } from '@/shared/hooks/usePermission';
import { useNewAppointment } from '@/modules/appointments';
import { GlobalSearch } from './GlobalSearch';
import { NotificationsBell } from './NotificationsBell';
import { UserMenu } from './UserMenu';

export const Header = ({ collapsed }: { collapsed: boolean }) => {
  const { title, breadcrumb } = usePageMetaStore();
  const toggle = useUiStore((s) => s.toggleSidebar);
  const setMobileNav = useUiStore((s) => s.setMobileNav);
  const isMobile = useIsMobile();
  // Planshetda qidiruvga joy qolishi uchun tugma faqat ikonka
  const isTablet = useIsTablet();
  const compact = isMobile || isTablet;
  const canCreate = usePermission('appointment.manage');
  const openNew = useNewAppointment((s) => s.show);
  const crumbs = breadcrumb.length ? breadcrumb : [{ label: title }];

  const icon = { size: 20, strokeWidth: 1.5 };

  // Kulrang panelning yuqori qatori: oq doira tugmalar, sarlavha, oq qidiruv pill, lime CTA
  return (
    <Layout.Header className="sticky top-0 z-20 mb-4 flex !h-auto items-center gap-3 !bg-panel !px-3 py-3 !leading-normal md:mb-6 md:gap-4 md:rounded-tl-sheet md:!px-6 md:pt-5">
      <Button
        shape="circle"
        aria-label="Menyu"
        className="bg-surface"
        onClick={() => (isMobile ? setMobileNav(true) : toggle())}
        icon={isMobile ? <MenuIcon {...icon} /> : collapsed ? <PanelLeftOpen {...icon} /> : <PanelLeftClose {...icon} />}
      />
      {/* Breadcrumb: oldingi bo‘limlar kichik qatorda, joriy sahifa — title */}
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1 md:min-w-[180px] md:flex-none">
        <ol className="m-0 flex list-none flex-wrap items-center gap-x-1.5 p-0">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            if (!last && isMobile) return null;
            return last ? (
              <li key={`${c.label}-${i}`} className="w-full min-w-0">
                <h1 className="m-0 truncate text-xl font-normal" aria-current="page">
                  {c.label}
                </h1>
              </li>
            ) : (
              <li key={`${c.label}-${i}`} className="flex shrink-0 items-center gap-1.5 text-xs leading-5 text-muted">
                {c.to ? (
                  <Link to={c.to} className="text-muted transition-colors duration-150 hover:text-ink">
                    {c.label}
                  </Link>
                ) : (
                  <span>{c.label}</span>
                )}
                <span aria-hidden>/</span>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="hidden flex-1 justify-center md:flex">
        <GlobalSearch />
      </div>

      <div className="ml-auto flex items-center gap-2 md:ml-0">
        {canCreate && (
          <Button
            type="primary"
            shape={compact ? 'circle' : 'default'}
            aria-label="Yangi qabul"
            icon={<Plus size={20} strokeWidth={1.5} />}
            onClick={() => openNew({})}
            className="btn-lime"
          >
            {!compact && <span>Yangi qabul</span>}
          </Button>
        )}
        <NotificationsBell />
        <UserMenu />
      </div>
    </Layout.Header>
  );
};
