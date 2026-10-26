import { InputNumber, type InputNumberProps } from 'antd';

interface Props extends Omit<InputNumberProps<number>, 'addonAfter' | 'addonBefore'> {
  /** "so'm" belgisi maydon ichida (jadval qatorlarida — false) */
  currency?: boolean;
}

/** So'm kiritish: 350 000 formatida */
export const MoneyInput = ({ currency = true, ...props }: Props) => (
  <InputNumber<number>
    min={0}
    step={10_000}
    className="w-full tabular-nums"
    formatter={(v) => (v === undefined || v === null ? '' : `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' '))}
    parser={(v) => Number((v ?? '').replace(/\D/g, '')) || 0}
    suffix={currency ? <span className="text-muted">so‘m</span> : undefined}
    {...props}
  />
);
