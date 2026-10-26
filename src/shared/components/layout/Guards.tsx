import { Button } from 'antd';
import { Compass, ShieldX } from '@/shared/icons';
import type { ReactNode } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import type { Permission } from '@/shared/constants/roles';
import { useCurrentUser, usePermission, usePermissions, useSession } from '@/shared/hooks/usePermission';
import { filterNav, flattenNav, NAV_ITEMS } from './navItems';
import { usePageMeta } from '@/shared/hooks/usePageMeta';
import { ROUTES } from '@/shared/constants/routes';

/** Router ildizi: nuqs adapter (URL state) */
export const RootLayout = () => (
  <NuqsAdapter>
    <Outlet />
  </NuqsAdapter>
);

/** Kirmagan foydalanuvchini login sahifasiga yo'naltiradi */
export const ProtectedRoute = () => {
  const session = useSession();
  const location = useLocation();
  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${ROUTES.login}?next=${next}`} replace />;
  }
  return <Outlet />;
};

const StatusPage = ({ code, title, text, icon }: { code: string; title: string; text: string; icon: ReactNode }) => {
  usePageMeta(title);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="grid size-14 place-items-center rounded-lg bg-primary-50 text-primary-600">{icon}</span>
      <div className="text-sm font-semibold tabular-nums text-muted">{code}</div>
      <h2 className="m-0 text-xl font-medium">{title}</h2>
      <p className="m-0 max-w-sm text-muted">{text}</p>
      <Link to={ROUTES.dashboard}>
        <Button type="primary">Bosh sahifaga</Button>
      </Link>
    </div>
  );
};

export const ForbiddenPage = () => (
  <StatusPage
    code="403"
    title="Ruxsat yo‘q"
    text="Bu bo‘limni ko‘rish uchun sizning rolingizga ruxsat berilmagan. Administratorga murojaat qiling."
    icon={<ShieldX size={26} strokeWidth={1.75} />}
  />
);

export const NotFoundPage = () => (
  <StatusPage code="404" title="Sahifa topilmadi" text="Manzil noto‘g‘ri yoki sahifa o‘chirilgan." icon={<Compass size={26} strokeWidth={1.75} />} />
);

/** Route darajasidagi rol tekshiruvi */
export const RoleGuard = ({ perm, children }: { perm: Permission; children: ReactNode }) =>
  usePermission(perm) ? <>{children}</> : <ForbiddenPage />;

/** Bosh sahifa rolga qarab (TZ 7-bo'lim): dashboard ruxsati bo'lmasa — birinchi ruxsat etilgan bo'limga */
export const HomeRoute = ({ dashboard }: { dashboard: ReactNode }) => {
  const can = usePermissions();
  const role = useCurrentUser()?.role;
  if (can('dashboard.view')) return <>{dashboard}</>;
  // Rolning asosiy ish joyi: kassir — kassa, omborchi — ombor
  const preferred = role === 'CASHIER' ? ROUTES.billing : role === 'STOREKEEPER' ? ROUTES.inventory : null;
  const allowed = flattenNav(filterNav(NAV_ITEMS, can));
  if (preferred && allowed.some((i) => i.to === preferred)) return <Navigate to={preferred} replace />;
  const first = allowed.find((i) => i.to && i.to !== ROUTES.dashboard);
  return first?.to ? <Navigate to={first.to} replace /> : <ForbiddenPage />;
};
