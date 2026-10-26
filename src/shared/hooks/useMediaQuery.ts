import { useSyncExternalStore } from 'react';

export const useMediaQuery = (query: string) =>
  useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', cb);
      return () => mql.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );

/** < 768px */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
/** 768–1279px */
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1279px)');
