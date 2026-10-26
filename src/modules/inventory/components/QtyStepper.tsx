import { Button, InputNumber } from 'antd';

interface Props {
  value?: number | null;
  onChange?: (v: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  'aria-label'?: string;
}

const round = (n: number) => +n.toFixed(3);

/** Miqdor: − [son] + (Form.Item ichida boshqariladigan maydon) */
export const QtyStepper = ({ value, onChange, min = 0, max, step = 1, disabled, 'aria-label': ariaLabel = 'Miqdor' }: Props) => {
  const v = value ?? 0;
  const canDown = !disabled && round(v - step) >= min;
  const canUp = !disabled && (max === undefined || round(v + step) <= max);
  return (
    <div className="inline-flex items-center gap-1">
      <Button shape="circle" size="small" aria-label="Kamaytirish" disabled={!canDown} onClick={() => onChange?.(round(v - step))}>
        <span className="text-base leading-none">−</span>
      </Button>
      <InputNumber<number>
        value={value}
        onChange={(n) => onChange?.(n)}
        min={min}
        max={max}
        controls={false}
        disabled={disabled}
        aria-label={ariaLabel}
        className="w-16 tabular-nums [&_input]:text-center"
      />
      <Button shape="circle" size="small" aria-label="Ko‘paytirish" disabled={!canUp} onClick={() => onChange?.(round(v + step))}>
        <span className="text-base leading-none">+</span>
      </Button>
    </div>
  );
};
