import { Skeleton } from 'antd';
import { cn } from '@/shared/utils/cn';

interface Props {
  value?: string;
  onChange?: (v: string) => void;
  slots: string[];
  loading?: boolean;
  disabled?: boolean;
  emptyText?: string;
}

/** Faqat bo'sh slotlar — chiplar ko'rinishida (tanlangan shifokor va davomiylik bo'yicha) */
export const SlotPicker = ({ value, onChange, slots, loading, disabled, emptyText = 'Bo‘sh vaqt yo‘q' }: Props) => {
  if (loading) return <Skeleton.Input active block size="small" />;
  if (disabled) return <div className="rounded-md bg-subtle px-3 py-2.5 text-sm text-muted">Avval shifokor va sanani tanlang</div>;
  if (!slots.length) return <div className="rounded-md bg-warning-soft px-3 py-2.5 text-sm text-warning">{emptyText}</div>;
  return (
    <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-md bg-subtle p-2" role="listbox" aria-label="Bo‘sh vaqtlar">
      {slots.map((s) => (
        <button
          key={s}
          type="button"
          role="option"
          aria-selected={value === s}
          onClick={() => onChange?.(s)}
          className={cn(
            'h-8 cursor-pointer rounded-pill px-3 text-sm tabular-nums transition-colors duration-150',
            value === s ? 'bg-ink text-on-ink' : 'bg-surface text-ink hover:bg-lime-soft',
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
};
