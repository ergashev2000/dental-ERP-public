import { useEffect } from 'react';
import { create } from 'zustand';

export interface Crumb {
  label: string;
  to?: string;
}

interface PageMetaState {
  title: string;
  breadcrumb: Crumb[];
  set: (title: string, breadcrumb: Crumb[]) => void;
}

/** Header'dagi sahifa sarlavhasi va breadcrumb */
export const usePageMetaStore = create<PageMetaState>((set) => ({
  title: '',
  breadcrumb: [],
  set: (title, breadcrumb) => set({ title, breadcrumb }),
}));

export const usePageMeta = (title: string, breadcrumb: Crumb[] = []) => {
  const set = usePageMetaStore((s) => s.set);
  const key = JSON.stringify(breadcrumb);
  useEffect(() => {
    set(title, JSON.parse(key) as Crumb[]);
    document.title = `${title} — Oq Tabassum Dental`;
  }, [title, key, set]);
};
