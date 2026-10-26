import { onDark } from '@/shared/theme/tokens';

/** Tish silueti (viewBox 0 0 32 32) */
export const TOOTH_PATH =
  'M10 6.5c-3 0-4.8 2.6-4.4 6 .4 3.3 1.7 5.6 2.5 9 .7 2.8 1.3 4.8 2.8 4.8 1.9 0 1.9-4.8 3.2-7 .7-1.1 1.3-1.6 1.9-1.6s1.2.5 1.9 1.6c1.3 2.2 1.3 7 3.2 7 1.5 0 2.1-2 2.8-4.8.8-3.4 2.1-5.7 2.5-9 .4-3.4-1.4-6-4.4-6-2.5 0-3.7 1.6-6 1.6s-3.5-1.6-6-1.6Z';

/** Klinika belgisi — tekis, bir rangli tish silueti */
export const LogoMark = ({ size = 36, dark = true, className }: { size?: number; dark?: boolean; className?: string }) => (
  <span
    className={`grid shrink-0 place-items-center ${className ?? `rounded-md ${dark ? 'bg-primary-700' : 'bg-primary-50'}`}`}
    style={{ width: size, height: size }}
  >
    <svg viewBox="0 0 32 32" width={size * 0.62} height={size * 0.62} aria-hidden>
      <path
        d={TOOTH_PATH}
        fill={dark ? onDark.text : 'currentColor'}
        className={dark ? undefined : 'text-primary-600'}
      />
    </svg>
  </span>
);
