import { staffColors, type StaffColor } from '@/shared/theme/tokens';
import { initials } from '@/shared/utils/format';
import { cn } from '@/shared/utils/cn';

interface Props {
  name: string;
  color?: StaffColor;
  size?: number;
  className?: string;
}

/** Bosh harfli avatar (rasm ishlatilmaydi) */
export const UserAvatar = ({ name, color = 'neutral', size = 36, className }: Props) => {
  const c = staffColors[color];
  return (
    <span
      className={cn('inline-grid shrink-0 place-items-center rounded-full font-medium', className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36), background: c.soft, color: c.base }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
};

export const ColorDot = ({ color, size = 8 }: { color: StaffColor; size?: number }) => (
  <span className="inline-block shrink-0 rounded-full" style={{ width: size, height: size, background: staffColors[color].base }} />
);
