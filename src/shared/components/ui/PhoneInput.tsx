import { Input, type InputProps } from 'antd';

/** 901234567 → "90 123 45 67" */
const mask = (digits: string) => {
  const d = digits.slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');
};

const localDigits = (v?: string) => {
  const d = (v ?? '').replace(/\D/g, '');
  return d.startsWith('998') ? d.slice(3) : d;
};

interface Props extends Omit<InputProps, 'value' | 'onChange'> {
  /** Form qiymati: "+998901234567" */
  value?: string;
  onChange?: (value: string) => void;
}

/** Telefon kiritish: +998 prefiksi, mask va normallashtirilgan qiymat */
export const PhoneInput = ({ value, onChange, ...rest }: Props) => (
  <Input
    {...rest}
    inputMode="tel"
    prefix={<span className="pr-1 text-muted tabular-nums">+998</span>}
    placeholder="90 123 45 67"
    value={mask(localDigits(value))}
    onChange={(e) => {
      let d = e.target.value.replace(/\D/g, '');
      if (d.length > 9 && d.startsWith('998')) d = d.slice(3);
      d = d.slice(0, 9);
      onChange?.(d ? `+998${d}` : '');
    }}
    className="tabular-nums"
  />
);
