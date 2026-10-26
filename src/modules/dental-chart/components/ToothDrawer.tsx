import { Alert, App, Button, Checkbox, Divider, Drawer, Form, Input, Segmented } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { TOOTH_CONDITION } from '@/shared/constants/status';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { toothName } from '@/shared/utils/fdi';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { useUpdateTooth } from '../hooks/useChart';
import type { SurfaceMap, SurfaceState, ToothCondition, ToothRecord } from '../types';
import { CONDITIONS, surfaceCode } from '../utils';
import { AddToPlanForm } from './AddToPlanForm';
import { ConditionIcon } from './ChartLegend';
import { SurfaceSquare } from './SurfaceMaps';
import { ToothHistoryList } from './ToothHistoryList';
import { ToothShape } from './ToothShape';

interface Values {
  conditions: ToothCondition[];
  surfaces: SurfaceMap;
  note?: string;
}

const EXCLUSIVE: ToothCondition[] = ['MISSING', 'IMPLANT'];

/** Holatlarni moslashtirish: "Sog'lom" qolganlarini tozalaydi, "Yo'q"/"Implant" boshqalar bilan kelmaydi */
const normalize = (next: ToothCondition[], prev: ToothCondition[]): ToothCondition[] => {
  const added = next.find((c) => !prev.includes(c));
  if (added === 'HEALTHY') return ['HEALTHY'];
  let out = next.filter((c) => c !== 'HEALTHY');
  if (added && EXCLUSIVE.includes(added)) {
    const keep: ToothCondition[] = added === 'MISSING' ? ['PLANNED'] : ['CROWN', 'PLANNED'];
    out = [added, ...out.filter((c) => keep.includes(c))];
  } else if (added) {
    const ex = out.find((c) => EXCLUSIVE.includes(c));
    const allowed: ToothCondition[] = ex === 'MISSING' ? ['PLANNED'] : ex === 'IMPLANT' ? ['CROWN', 'PLANNED'] : [];
    if (ex && !allowed.includes(added)) out = out.filter((c) => c !== ex);
  }
  return out.length ? out : ['HEALTHY'];
};

interface Props {
  patientId: string;
  tooth: number | null;
  record?: ToothRecord;
  readOnly: boolean;
  onClose: () => void;
}

export const ToothDrawer = ({ patientId, tooth, record, readOnly, onClose }: Props) => {
  const [form] = Form.useForm<Values>();
  const { message } = App.useApp();
  const update = useUpdateTooth(patientId);
  const isMobile = useIsMobile();
  const [brush, setBrush] = useState<SurfaceState>('CARIES');
  const prevConditions = useRef<ToothCondition[]>([]);
  const conditions = Form.useWatch('conditions', form) ?? [];
  const surfaces = Form.useWatch('surfaces', form) ?? {};

  useEffect(() => {
    if (tooth === null) return;
    prevConditions.current = record?.conditions.length ? record.conditions : ['HEALTHY'];
    form.setFieldsValue({
      conditions: prevConditions.current,
      surfaces: record?.surfaces ?? {},
      note: record?.note,
    });
  }, [tooth, record, form]);

  const noSurfaces = conditions.includes('MISSING') || conditions.includes('IMPLANT');

  const save = (v: Values) => {
    if (tooth === null) return;
    const clean = v.conditions.filter((c) => c !== 'HEALTHY');
    update.mutate(
      { tooth, patch: { conditions: clean, surfaces: noSurfaces ? {} : v.surfaces, note: v.note } },
      {
        onSuccess: () => message.success(`${tooth}-tish saqlandi`),
        onError: (e) => message.error(errorMessage(e)),
      },
    );
  };

  return (
    <Drawer
      open={tooth !== null}
      onClose={onClose}
      width={isMobile ? '100%' : 440}
      destroyOnHidden
      title={
        tooth !== null && (
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-11 place-items-center rounded-sm bg-neutral-25">
              <ToothShape tooth={tooth} conditions={conditions} width={26} />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="text-xl font-normal">{tooth}-tish</div>
              <div className="truncate text-xs font-normal text-muted">{toothName(tooth)}</div>
            </div>
          </div>
        )
      }
      footer={
        !readOnly && (
          <div className="flex justify-end gap-2">
            <Button onClick={onClose}>Yopish</Button>
            <Button type="primary" loading={update.isPending} onClick={() => form.submit()}>
              Saqlash
            </Button>
          </div>
        )
      }
    >
      {tooth !== null && (
        <>
          {readOnly && <Alert className="mb-4" type="info" showIcon message="Sizda faqat ko‘rish huquqi bor" />}
          <Form
            form={form}
            layout="vertical"
            disabled={readOnly}
            onFinish={save}
            onValuesChange={(changed: Partial<Values>, all: Values) => {
              if (changed.conditions) {
                form.setFieldValue('conditions', normalize(changed.conditions, prevConditions.current));
              }
              if (changed.surfaces) {
                // yuzaga karies/plomba qo'yilsa — tegishli holat ham belgilanadi
                const states = Object.values(all.surfaces ?? {});
                let cond = (all.conditions ?? []).filter((c) => c !== 'HEALTHY');
                for (const s of ['CARIES', 'FILLING'] as const) if (states.includes(s) && !cond.includes(s)) cond = [...cond, s];
                form.setFieldValue('conditions', cond.length ? cond : ['HEALTHY']);
              }
              prevConditions.current = form.getFieldValue('conditions') as ToothCondition[];
            }}
          >
            <Form.Item name="conditions" label="Holatlar">
              <Checkbox.Group className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CONDITIONS.map((c) => (
                  <Checkbox key={c} value={c}>
                    <span className="inline-flex items-center gap-2">
                      <ConditionIcon condition={c} />
                      {TOOTH_CONDITION[c].short}
                    </span>
                  </Checkbox>
                ))}
              </Checkbox.Group>
            </Form.Item>

            <Form.Item
              label={
                <span>
                  Yuzalar {surfaceCode(tooth, surfaces) && <span className="ml-1 font-medium text-ink">{surfaceCode(tooth, surfaces)}</span>}
                </span>
              }
            >
              {noSurfaces ? (
                <div className="text-sm text-muted">Yo‘q tish yoki implant uchun yuzalar belgilanmaydi</div>
              ) : (
                <div className="flex flex-wrap items-start gap-5">
                  <Form.Item name="surfaces" noStyle>
                    <SurfaceControl tooth={tooth} brush={brush} disabled={readOnly} />
                  </Form.Item>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-muted">Bosilganda qo‘yiladi:</span>
                    <Segmented
                      vertical
                      value={brush}
                      onChange={(v) => setBrush(v as SurfaceState)}
                      disabled={readOnly}
                      options={[
                        { value: 'CARIES', label: 'Karies' },
                        { value: 'FILLING', label: 'Plomba' },
                      ]}
                    />
                    <span className="max-w-[140px] text-xs text-muted">Qayta bosish — belgini olib tashlaydi</span>
                  </div>
                </div>
              )}
            </Form.Item>

            <Form.Item name="note" label="Izoh">
              <Input.TextArea rows={2} maxLength={300} placeholder="Masalan: sezuvchanlik, rentgen natijasi" />
            </Form.Item>
          </Form>

          {!readOnly && (
            <>
              <Divider className="my-5" />
              <h4 className="mb-3 mt-0 text-base font-medium">Davolash rejasiga qo‘shish</h4>
              <AddToPlanForm
                patientId={patientId}
                tooth={tooth}
                missing={conditions.includes('MISSING')}
                onAdded={() => {
                  if (!conditions.includes('PLANNED')) {
                    const next = [...conditions.filter((c) => c !== 'HEALTHY'), 'PLANNED' as const];
                    update.mutate({ tooth, patch: { conditions: next, surfaces: noSurfaces ? {} : surfaces, note: form.getFieldValue('note') } });
                  }
                }}
              />
            </>
          )}

          <Divider className="my-5" />
          <h4 className="mb-3 mt-0 text-base font-medium">Shu tish bo‘yicha tarix</h4>
          <ToothHistoryList patientId={patientId} tooth={tooth} />
        </>
      )}
    </Drawer>
  );
};

/** Form.Item uchun value/onChange adapteri */
const SurfaceControl = ({
  tooth,
  brush,
  disabled,
  value = {},
  onChange,
}: {
  tooth: number;
  brush: SurfaceState;
  disabled?: boolean;
  value?: SurfaceMap;
  onChange?: (v: SurfaceMap) => void;
}) => <SurfaceSquare tooth={tooth} value={value} onChange={onChange} brush={brush} disabled={disabled} />;
