import type { AppIcon } from '@/shared/icons';
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Package,
  PhoneCall,
  Building2,
  CreditCard,
  DoorClosed,
  FlaskLab,
  MapPin,
  Receipt,
  Settings,
  ShieldCheck,
  Smile,
  UserRoundCog,
  UserCog,
  Users,
  Wallet,
} from '@/shared/icons';
import type { Permission } from '@/shared/constants/roles';
import { ROUTES } from '@/shared/constants/routes';

export interface NavItem {
  key: string;
  label: string;
  /** Guruh sarlavhasida ikonka yo'q */
  icon?: AppIcon;
  /** Guruh (ichida children) uchun bo'lmaydi */
  to?: string;
  perm?: Permission;
  /** true — menyuda sarlavhali guruh (bosilmaydi); aks holda children — ochiladigan bo'lim */
  group?: boolean;
  children?: NavItem[];
}

/** Sidebar: 4 guruh (TZ 7-bo'lim) — Kunlik ish, Davolash, Moliya, Klinika */
export const NAV_ITEMS: NavItem[] = [
  {
    key: 'g-daily',
    label: 'Kunlik ish',
    group: true,
    children: [
      { key: 'dashboard', label: 'Bosh sahifa', icon: LayoutDashboard, to: ROUTES.dashboard, perm: 'dashboard.view' },
      { key: 'appointments', label: 'Qabullar', icon: CalendarDays, to: ROUTES.appointments, perm: 'appointment.manage' },
      { key: 'patients', label: 'Bemorlar', icon: Users, to: ROUTES.patients, perm: 'patient.view' },
    ],
  },
  {
    key: 'g-care',
    label: 'Davolash',
    group: true,
    children: [
      { key: 'ortho', label: 'Breketlar', icon: Smile, to: ROUTES.ortho, perm: 'ortho.view' },
      { key: 'lab', label: 'Laboratoriya', icon: FlaskLab, to: ROUTES.lab, perm: 'lab.view' },
    ],
  },
  {
    key: 'g-money',
    label: 'Moliya',
    group: true,
    children: [
      { key: 'billing', label: 'To‘lovlar', icon: Wallet, to: ROUTES.billing, perm: 'billing.view' },
      { key: 'reports', label: 'Hisobotlar', icon: BarChart3, to: ROUTES.reports, perm: 'report.view' },
    ],
  },
  {
    key: 'g-clinic',
    label: 'Klinika',
    group: true,
    children: [
      { key: 'inventory', label: 'Ombor', icon: Package, to: ROUTES.inventory, perm: 'inventory.view' },
      { key: 'reminders', label: 'Eslatmalar', icon: PhoneCall, to: ROUTES.reminders, perm: 'reminder.view' },
      {
        key: 'settings',
        label: 'Sozlamalar',
        icon: Settings,
        children: [
          { key: 'settings-clinic', label: 'Klinika', icon: Building2, to: ROUTES.settingsClinic, perm: 'settings.manage' },
          { key: 'settings-branches', label: 'Filiallar', icon: MapPin, to: ROUTES.settingsBranches, perm: 'branch.manage' },
          { key: 'settings-chairs', label: 'Kabinetlar', icon: DoorClosed, to: ROUTES.settingsChairs, perm: 'settings.manage' },
          { key: 'services', label: 'Xizmatlar', icon: ClipboardList, to: ROUTES.services, perm: 'service.view' },
          { key: 'staff', label: 'Xodimlar', icon: UserCog, to: ROUTES.staff, perm: 'staff.view' },
          { key: 'settings-users', label: 'Foydalanuvchilar', icon: UserRoundCog, to: ROUTES.settingsUsers, perm: 'settings.manage' },
          { key: 'settings-roles', label: 'Rollar va ruxsatlar', icon: ShieldCheck, to: ROUTES.settingsRoles, perm: 'settings.manage' },
          { key: 'settings-payments', label: 'To‘lov turlari', icon: CreditCard, to: ROUTES.settingsPayments, perm: 'settings.manage' },
          { key: 'settings-receipt', label: 'Chek', icon: Receipt, to: ROUTES.settingsReceipt, perm: 'settings.manage' },
        ],
      },
    ],
  },
];

/** Ruxsat bo'yicha filtr: bo'sh qolgan guruh/bo'lim ko'rinmaydi */
export const filterNav = (items: NavItem[], can: (p: Permission) => boolean): NavItem[] =>
  items.flatMap((i) => {
    if (i.children) {
      const children = filterNav(i.children, can);
      return children.length ? [{ ...i, children }] : [];
    }
    return !i.perm || can(i.perm) ? [i] : [];
  });

/** Bosiladigan sahifalar (guruh va bo'limlarsiz) */
export const flattenNav = (items: NavItem[]): NavItem[] => items.flatMap((i) => (i.children ? flattenNav(i.children) : [i]));
