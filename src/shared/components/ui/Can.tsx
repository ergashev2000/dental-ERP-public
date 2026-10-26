import type { ReactNode } from 'react';
import type { Permission } from '@/shared/constants/roles';
import { usePermission } from '@/shared/hooks/usePermission';

/** Ruxsat bo'lsa ko'rsatadi */
export const Can = ({ perm, children, fallback = null }: { perm: Permission; children: ReactNode; fallback?: ReactNode }) =>
  usePermission(perm) ? <>{children}</> : <>{fallback}</>;
