import { Menu, type MenuProps } from 'antd';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { usePermissions } from '@/shared/hooks/usePermission';
import { BranchSwitcher } from '@/modules/branches';
import { LogoMark } from './Logo';
import { filterNav, flattenNav, NAV_ITEMS, type NavItem } from './navItems';

type MenuItem = NonNullable<MenuProps['items']>[number];

const toMenu = (i: NavItem): MenuItem =>
  i.group
    ? { type: 'group', key: i.key, label: i.label, children: i.children?.map(toMenu) }
    : {
        key: i.key,
        icon: i.icon ? <i.icon size={20} strokeWidth={1.5} /> : undefined,
        label: i.label,
        children: i.children?.map(toMenu),
      };

/** Ochiladigan bo'limlar (guruh emas) — faol sahifa qaysi bo'lim ichida */
const submenus = (items: NavItem[]): NavItem[] => items.flatMap((i) => (i.children ? [...(i.group ? [] : [i]), ...submenus(i.children)] : []));

interface Props {
  collapsed?: boolean;
  onNavigate?: () => void;
}

/** Sidebar kontenti (desktop Sider va mobil Drawer uchun umumiy) */
export const SidebarContent = ({ collapsed, onNavigate }: Props) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const can = usePermissions();

  // Ruxsat bo'yicha filtr; guruh ichida birorta sahifa qolmasa — guruh ko'rinmaydi
  const items = filterNav(NAV_ITEMS, can);
  const leaves = flattenNav(items);
  const active = leaves.find((i) => i.to && (i.to === '/' ? pathname === '/' : pathname.startsWith(i.to)));
  const parent = submenus(items).find((i) => i.children?.some((c) => c.key === active?.key))?.key;

  // Faol sahifaning guruhi ochiq tursin
  const [openKeys, setOpenKeys] = useState<string[]>(parent ? [parent] : []);
  const [prevParent, setPrevParent] = useState(parent);
  if (parent !== prevParent) {
    setPrevParent(parent);
    if (parent && !openKeys.includes(parent)) setOpenKeys([...openKeys, parent]);
  }

  return (
    <div className="flex h-full flex-col text-on-ink">
      <div className={`flex h-20 shrink-0 items-center gap-3 ${collapsed ? 'justify-center px-0' : 'px-5'}`}>
        <LogoMark size={48} dark={false} className="rounded-full bg-surface" />
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <div className="truncate text-base">Oq Tabassum</div>
            <BranchSwitcher />
          </div>
        )}
      </div>

      <nav className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-1 pb-4 pt-1">
        <Menu
          theme="dark"
          mode="inline"
          inlineCollapsed={collapsed}
          selectedKeys={active ? [active.key] : []}
          {...(collapsed ? {} : { openKeys, onOpenChange: setOpenKeys })}
          onClick={({ key }) => {
            const item = leaves.find((i) => i.key === key);
            if (item?.to) navigate(item.to);
            onNavigate?.();
          }}
          items={items.map(toMenu)}
          className="border-0 bg-transparent"
        />
      </nav>

    </div>
  );
};
