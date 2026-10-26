import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Chop etish: kontent #print-root ga chiziladi, @media print da faqat u ko'rinadi.
 * Ishlatish: const { print, portal } = usePrint(); ... {portal(<Receipt/>)}; print();
 */
export const usePrint = () => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!active) return;
    document.body.classList.add('print-portal');
    const done = () => setActive(false);
    window.addEventListener('afterprint', done);
    // kontent chizilgandan keyin chop etish oynasini ochamiz
    const t = setTimeout(() => window.print(), 80);
    return () => {
      clearTimeout(t);
      window.removeEventListener('afterprint', done);
      document.body.classList.remove('print-portal');
    };
  }, [active]);

  const print = useCallback(() => setActive(true), []);
  const portal = useCallback(
    (node: ReactNode) => {
      const root = document.getElementById('print-root');
      return active && root ? createPortal(node, root) : null;
    },
    [active],
  );
  return { print, portal, printing: active };
};
