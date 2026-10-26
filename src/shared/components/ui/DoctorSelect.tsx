import { Select } from 'antd';
import { doctorOffReason } from '@/shared/utils/schedule';
import { useDoctors } from '@/modules/staff';
import { ColorDot } from './UserAvatar';

interface Props {
  value?: string | null;
  onChange?: (id: string) => void;
  /** Berilsa: shu kuni ishlamaydigan shifokor disabled */
  date?: string | null;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  className?: string;
  /** Faqat shu ID lar (masalan, shifokor faqat o'zini tanlaydi) */
  only?: string[];
}

/** Rang nuqtasi bilan shifokor tanlash; ishlamaydigan kunda disabled + sabab */
export const DoctorSelect = ({ value, onChange, date, placeholder = 'Shifokor', allowClear, disabled, className, only }: Props) => {
  const { data = [], isLoading } = useDoctors();
  const list = data.filter((d) => d.isActive && (!only || only.includes(d.id)));
  return (
    <Select
      value={value || undefined}
      onChange={onChange}
      placeholder={placeholder}
      allowClear={allowClear}
      disabled={disabled}
      loading={isLoading}
      className={className}
      popupMatchSelectWidth={false}
      options={list.map((d) => {
        const off = date ? doctorOffReason(d, date) : null;
        return {
          value: d.id,
          disabled: !!off,
          label: (
            <span className="flex items-center gap-2">
              <ColorDot color={d.color} />
              <span className="truncate">{d.fullName}</span>
              {off ? (
                <span className="ml-auto pl-3 text-xs text-muted">{off}</span>
              ) : (
                d.specialty && <span className="ml-auto pl-3 text-xs text-muted">{d.specialty}</span>
              )}
            </span>
          ),
        };
      })}
    />
  );
};
