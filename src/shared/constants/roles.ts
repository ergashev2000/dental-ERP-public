import { create } from 'zustand';

export const ROLES = ['OWNER', 'ADMIN', 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST', 'CASHIER', 'STOREKEEPER'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: 'Klinika egasi',
  ADMIN: 'Filial boshqaruvchisi',
  DOCTOR: 'Shifokor',
  ASSISTANT: 'Assistent',
  RECEPTIONIST: 'Registratura',
  CASHIER: 'Kassir',
  STOREKEEPER: 'Omborchi',
};

export const ROLE_SHORT: Record<Role, string> = {
  OWNER: 'Egasi',
  ADMIN: 'Boshqaruvchi',
  DOCTOR: 'Shifokor',
  ASSISTANT: 'Assistent',
  RECEPTIONIST: 'Registratura',
  CASHIER: 'Kassir',
  STOREKEEPER: 'Omborchi',
};

/** To'liq ruxsatli rollar — matritsada o'zgartirilmaydi (TZ 2-bo'lim) */
export const FULL_ACCESS_ROLES: readonly Role[] = ['OWNER', 'ADMIN'];
export const isFullAccess = (role: Role) => FULL_ACCESS_ROLES.includes(role);

const FULL = ['OWNER', 'ADMIN'] as const;

/**
 * Ruxsatlar matritsasi (TZ 2-bo'lim).
 * "O'ziniki" cheklovlari (shifokor faqat o'z qabullari) komponent va mock API ichida qo'shimcha tekshiriladi.
 */
const MATRIX = {
  'dashboard.view': [...FULL, 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST'],
  'dashboard.revenue': [...FULL],
  'appointment.viewAll': [...FULL, 'RECEPTIONIST'],
  'appointment.manage': [...FULL, 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST'],
  'appointment.manageAll': [...FULL, 'RECEPTIONIST'],
  'appointment.backdate': [...FULL],
  /** Qabulni yakunlash (muolajalar, to'lov, keyingi tashrif — bitta oynada) */
  'appointment.complete': [...FULL, 'DOCTOR', 'RECEPTIONIST'],
  'patient.view': [...FULL, 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST', 'CASHIER'],
  'patient.edit': [...FULL, 'DOCTOR', 'RECEPTIONIST'],
  'chart.edit': [...FULL, 'DOCTOR'],
  'treatment.edit': [...FULL, 'DOCTOR'],
  'treatment.complete': [...FULL, 'DOCTOR'],
  /** Rozilik shakli, shartnoma, retsept */
  'document.manage': [...FULL, 'DOCTOR', 'RECEPTIONIST'],
  'billing.view': [...FULL, 'RECEPTIONIST', 'CASHIER'],
  'payment.receive': [...FULL, 'RECEPTIONIST', 'CASHIER'],
  'payment.refund': [...FULL],
  'payment.discount': [...FULL, 'RECEPTIONIST'],
  'inventory.view': [...FULL, 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST', 'STOREKEEPER'],
  'inventory.in': [...FULL, 'RECEPTIONIST', 'STOREKEEPER'],
  'inventory.out': [...FULL, 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST', 'STOREKEEPER'],
  'inventory.writeOff': [...FULL, 'RECEPTIONIST', 'STOREKEEPER'],
  'inventory.adjust': [...FULL, 'STOREKEEPER'],
  'inventory.manage': [...FULL, 'RECEPTIONIST', 'STOREKEEPER'],
  /** Tish texnikiga buyurtmalar (toj, protez, kappa) */
  'lab.view': [...FULL, 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST'],
  'lab.manage': [...FULL, 'DOCTOR', 'ASSISTANT'],
  'service.view': [...FULL, 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST', 'CASHIER'],
  'service.manage': [...FULL],
  'reminder.view': [...FULL, 'RECEPTIONIST'],
  'reminder.rules': [...FULL],
  'staff.view': [...FULL, 'DOCTOR', 'RECEPTIONIST'],
  'staff.viewAll': [...FULL, 'RECEPTIONIST'],
  'staff.manage': [...FULL],
  'report.view': [...FULL, 'DOCTOR', 'CASHIER'],
  'report.revenue': [...FULL],
  'settings.manage': [...FULL],
  /** Filiallarni boshqarish va barcha filiallarni ko'rish */
  'branch.manage': ['OWNER'],
  /** Breketli bemorlar: ko'rish va qo'shish/tahrirlash (registratura ham) */
  'ortho.view': [...FULL, 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST'],
  'ortho.manage': [...FULL, 'DOCTOR', 'RECEPTIONIST'],
  /** Korreksiya (klinik yozuv) kiritish */
  'ortho.visit': [...FULL, 'DOCTOR'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof MATRIX;
export type PermissionMatrix = Record<Permission, Role[]>;

/** Standart (zavod) ruxsatlar — "Rollar" sahifasida tiklash uchun */
export const defaultMatrix = (): PermissionMatrix =>
  Object.fromEntries(Object.entries(MATRIX).map(([k, v]) => [k, [...v]])) as PermissionMatrix;

/**
 * Joriy ruxsatlar matritsasi. Sozlamalar → Rollar sahifasida o'zgartiriladi (mock: xotirada,
 * sahifa yangilanganda standartga qaytadi). Hook'lar obuna bo'ladi — o'zgarish darhol ko'rinadi.
 */
export const usePermissionMatrix = create<{ matrix: PermissionMatrix }>(() => ({ matrix: defaultMatrix() }));

export const hasPermission = (role: Role | undefined | null, permission: Permission): boolean =>
  !!role && (isFullAccess(role) || usePermissionMatrix.getState().matrix[permission].includes(role));

/** Rollar sahifasi uchun: ruxsatlar guruhlari va tushunarli nomlari */
export const PERMISSION_GROUPS: { title: string; items: { key: Permission; label: string }[] }[] = [
  {
    title: 'Bosh sahifa va qabullar',
    items: [
      { key: 'dashboard.view', label: 'Bosh sahifani ko‘rish' },
      { key: 'dashboard.revenue', label: 'Bosh sahifada tushumni ko‘rish' },
      { key: 'appointment.manage', label: 'Qabullar bo‘limi (yozish, ko‘rish)' },
      { key: 'appointment.viewAll', label: 'Barcha shifokorlar qabullarini ko‘rish' },
      { key: 'appointment.manageAll', label: 'Boshqa shifokorlarga qabul yozish/o‘zgartirish' },
      { key: 'appointment.backdate', label: 'Orqaga sana bilan yozish' },
      { key: 'appointment.complete', label: 'Qabulni yakunlash' },
    ],
  },
  {
    title: 'Bemorlar va davolash',
    items: [
      { key: 'patient.view', label: 'Bemorlar bo‘limini ko‘rish' },
      { key: 'patient.edit', label: 'Bemor ma’lumotlarini tahrirlash' },
      { key: 'chart.edit', label: 'Tish sxemasini tahrirlash' },
      { key: 'treatment.edit', label: 'Davolash rejasini tuzish' },
      { key: 'treatment.complete', label: 'Reja bandini bajarildi deb belgilash' },
      { key: 'document.manage', label: 'Hujjatlar (rozilik, shartnoma) tuzish' },
      { key: 'lab.view', label: 'Laboratoriya buyurtmalarini ko‘rish' },
      { key: 'lab.manage', label: 'Laboratoriyaga buyurtma berish' },
    ],
  },
  {
    title: 'Breketlar',
    items: [
      { key: 'ortho.view', label: 'Breketlar bo‘limini ko‘rish' },
      { key: 'ortho.manage', label: 'Breket shartnomasini qo‘shish/tahrirlash' },
      { key: 'ortho.visit', label: 'Korreksiya yozuvini kiritish' },
    ],
  },
  {
    title: 'To‘lovlar',
    items: [
      { key: 'billing.view', label: 'To‘lovlar bo‘limini ko‘rish' },
      { key: 'payment.receive', label: 'To‘lov qabul qilish' },
      { key: 'payment.discount', label: 'Chegirma berish' },
      { key: 'payment.refund', label: 'Pulni qaytarish' },
    ],
  },
  {
    title: 'Ombor',
    items: [
      { key: 'inventory.view', label: 'Omborni ko‘rish' },
      { key: 'inventory.in', label: 'Kirim qilish' },
      { key: 'inventory.out', label: 'Chiqim qilish' },
      { key: 'inventory.writeOff', label: 'Hisobdan chiqarish' },
      { key: 'inventory.adjust', label: 'Qoldiqni tuzatish (inventarizatsiya)' },
      { key: 'inventory.manage', label: 'Mahsulot va yetkazib beruvchilarni boshqarish' },
    ],
  },
  {
    title: 'Xizmatlar, xodimlar, eslatmalar',
    items: [
      { key: 'service.view', label: 'Xizmatlar ro‘yxatini ko‘rish' },
      { key: 'service.manage', label: 'Xizmat va narxlarni o‘zgartirish' },
      { key: 'staff.view', label: 'Xodimlar bo‘limini ko‘rish' },
      { key: 'staff.viewAll', label: 'Barcha xodimlarni ko‘rish' },
      { key: 'staff.manage', label: 'Xodim va jadvallarni boshqarish' },
      { key: 'reminder.view', label: 'Eslatmalar bo‘limini ko‘rish' },
      { key: 'reminder.rules', label: 'Eslatma qoidalarini o‘zgartirish' },
    ],
  },
  {
    title: 'Hisobotlar va sozlamalar',
    items: [
      { key: 'report.view', label: 'Hisobotlarni ko‘rish' },
      { key: 'report.revenue', label: 'Tushum hisobotlarini ko‘rish' },
      { key: 'settings.manage', label: 'Sozlamalarni boshqarish' },
      { key: 'branch.manage', label: 'Filiallarni boshqarish' },
    ],
  },
];
