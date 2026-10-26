import { useAuthStore } from '@/modules/auth/store/authStore';
import { hasPermission, usePermissionMatrix, type Permission } from '@/shared/constants/roles';

export const useCurrentUser = () => useAuthStore((s) => s.session?.user ?? null);

export const useSession = () => useAuthStore((s) => s.session);

export const usePermission = (permission: Permission) => {
  const role = useAuthStore((s) => s.session?.user.role);
  usePermissionMatrix((s) => s.matrix); // matritsa o'zgarganda qayta render
  return hasPermission(role, permission);
};

/** Bir nechta ruxsatni bir yo'la tekshirish */
export const usePermissions = () => {
  const role = useAuthStore((s) => s.session?.user.role);
  usePermissionMatrix((s) => s.matrix);
  return (permission: Permission) => hasPermission(role, permission);
};
