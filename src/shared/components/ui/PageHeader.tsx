import type { ReactNode } from 'react';
import { usePageMeta, type Crumb } from '@/shared/hooks/usePageMeta';

interface Props {
  title: string;
  breadcrumb?: Crumb[];
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

/**
 * Sahifa sarlavhasi va breadcrumb Header'ga uzatiladi;
 * shu yerda faqat qisqa izoh va amallar qatori chiziladi.
 */
export const PageHeader = ({ title, breadcrumb, description, actions, children }: Props) => {
  usePageMeta(title, breadcrumb);
  if (!description && !actions && !children) return null;
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        {description && <p className="m-0 text-sm text-muted">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
};
