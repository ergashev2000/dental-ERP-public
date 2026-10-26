import { Button, Popover, Segmented } from 'antd';
import { useState } from 'react';
import { surfaceCode, SurfaceSquare } from '@/modules/dental-chart';
import type { SurfaceMap, SurfaceState } from '@/modules/dental-chart/types';
import { surfaceSummary } from '../utils';

const BRUSH_OPTIONS = [
  { value: 'FILLING', label: 'Plomba qo‘yildi' },
  { value: 'CARIES', label: 'Karies topildi' },
];

/** 5 zonali sxema + "nima qilindi" tanlovi: zonani bosing — belgilanadi, yana bosing — olib tashlanadi */
export const SurfaceEditor = ({ tooth, value = {}, onChange }: { tooth: number; value?: SurfaceMap; onChange: (v: SurfaceMap) => void }) => {
  const [brush, setBrush] = useState<SurfaceState>('FILLING');
  return (
    <div className="flex flex-col items-center gap-2">
      <Segmented size="small" value={brush} onChange={(v) => setBrush(v as SurfaceState)} options={BRUSH_OPTIONS} />
      <SurfaceSquare tooth={tooth} value={value} onChange={onChange} brush={brush} />
      <div className="flex w-full items-center justify-between gap-2 text-xs text-muted">
        <span>{surfaceSummary(tooth, value) || 'Yuza tanlanmagan'}</span>
        {Object.keys(value).length > 0 && (
          <button type="button" className="cursor-pointer border-0 bg-transparent p-0 text-xs font-medium text-ink" onClick={() => onChange({})}>
            Tozalash
          </button>
        )}
      </div>
    </div>
  );
};

/** Qator ichidagi kichik tugma (Form.Item bilan: value / onChange) */
export const SurfacePickerButton = ({ tooth, value, onChange }: { tooth?: number; value?: SurfaceMap; onChange?: (v: SurfaceMap) => void }) => {
  const code = tooth && value ? surfaceCode(tooth, value) : '';
  return (
    <Popover
      trigger="click"
      placement="bottom"
      title={tooth ? `${tooth}-tish yuzalari` : undefined}
      content={tooth ? <SurfaceEditor tooth={tooth} value={value} onChange={(v) => onChange?.(v)} /> : null}
    >
      <Button block disabled={!tooth} title={tooth ? surfaceSummary(tooth, value) || 'Tish yuzasini belgilash' : 'Avval tishni tanlang'}>
        {code || 'Yuza'}
      </Button>
    </Popover>
  );
};
