import { Baby, HeartPulse, Pill, TriangleAlert } from '@/shared/icons';
import type { AppIcon } from '@/shared/icons';
import { cn } from '@/shared/utils/cn';

interface MedicalInfo {
  allergies: string[];
  conditions: string[];
  medications: string[];
  pregnant?: boolean;
}

interface Item {
  icon: AppIcon;
  label: string;
  text: string;
  tone: 'danger' | 'warning' | 'info';
}

const toItems = (p: MedicalInfo): Item[] => [
  ...(p.allergies.length ? [{ icon: TriangleAlert, label: 'Allergiya', text: p.allergies.join(', '), tone: 'danger' as const }] : []),
  ...(p.pregnant ? [{ icon: Baby, label: 'Homilador', text: 'Rentgen va ayrim anestetiklar cheklangan', tone: 'warning' as const }] : []),
  ...(p.conditions.length ? [{ icon: HeartPulse, label: 'Kasalliklar', text: p.conditions.join(', '), tone: 'warning' as const }] : []),
  ...(p.medications.length ? [{ icon: Pill, label: 'Dorilar', text: p.medications.join(', '), tone: 'info' as const }] : []),
];

const CLS = {
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
};

/** Allergiya, homiladorlik, kasallik va dorilar ogohlantirishi */
export const MedicalAlert = ({ patient, compact }: { patient: MedicalInfo; compact?: boolean }) => {
  const items = toItems(patient);
  if (!items.length) return null;
  return (
    <div className={cn('flex flex-wrap', compact ? 'gap-1.5' : 'gap-2')} role="alert">
      {items.map((it) => (
        <div
          key={it.label}
          className={cn('inline-flex items-center gap-2', CLS[it.tone], compact ? 'rounded-pill px-2.5 py-1 text-xs' : 'rounded-md px-3 py-2 text-sm')}
        >
          <it.icon size={compact ? 14 : 16} strokeWidth={1.5} className="shrink-0" />
          <span>
            <b className="font-medium">{it.label}:</b> {it.text}
          </span>
        </div>
      ))}
    </div>
  );
};
