import { App, Button, Dropdown, Segmented, Tooltip } from 'antd';
import { Layers, Presentation, Printer, X } from '@/shared/icons';
import { useCallback, useState } from 'react';
import { CardSkeleton, ErrorState, Panel, PrintHeader, usePrint } from '@/shared/components/ui';
import { TOOTH_CONDITION } from '@/shared/constants/status';
import { usePermission } from '@/shared/hooks/usePermission';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { ageFrom, formatDate, fullName } from '@/shared/utils/format';
import type { Patient } from '@/modules/patients/types';
import { useBulkCondition, useChart } from '../hooks/useChart';
import type { Dentition } from '../types';
import { CONDITIONS } from '../utils';
import { ChartLegend, ConditionIcon } from './ChartLegend';
import { Jaw3DLegend } from './Jaw3DLegend';
import { Jaw3DView } from './Jaw3DView';
import { JawPresentationModal } from './JawPresentationModal';
import { ToothChart } from './ToothChart';
import { ToothDrawer } from './ToothDrawer';
import { ToothHistoryList } from './ToothHistoryList';

type ChartMode = '2d' | '3d';

/** Bemor kartasidagi "Tish sxemasi" tabi: ma'lumot kiritish — 2D, tushuntirish — 3D */
export const DentalChartTab = ({ patient }: { patient: Patient }) => {
  const { message } = App.useApp();
  const canEdit = usePermission('chart.edit');
  const { data: records = [], isLoading, isError, error, refetch } = useChart(patient.id);
  const bulk = useBulkCondition(patient.id);
  // 12 yoshdan kichik — sut tishlari rejimida ochiladi
  const [dentition, setDentition] = useState<Dentition>(patient.birthDate && ageFrom(patient.birthDate) < 12 ? 'child' : 'adult');
  const [mode, setMode] = useState<ChartMode>('2d');
  const [presenting, setPresenting] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const { print, portal } = usePrint();
  const [printedAt] = useState(() => new Date().toISOString());

  const onSelect = useCallback((tooth: number, multi: boolean) => {
    setSelected((prev) => (multi ? (prev.includes(tooth) ? prev.filter((t) => t !== tooth) : [...prev, tooth]) : [tooth]));
  }, []);
  const onOpen = useCallback((tooth: number) => setOpen(tooth), []);
  // 3D'da ham 2D bilan bir xil: oddiy bosish — ochadi, Shift/Ctrl — bir nechta tanlaydi
  const on3DClick = useCallback(
    (tooth: number, multi: boolean) => {
      onSelect(tooth, multi);
      if (!multi) onOpen(tooth);
    },
    [onSelect, onOpen],
  );

  if (isLoading) return <CardSkeleton rows={10} />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="flex flex-col gap-6">
      <Panel bodyClassName="p-3 md:p-5">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Segmented<ChartMode>
            value={mode}
            onChange={setMode}
            options={[
              { value: '2d', label: '2D sxema' },
              { value: '3d', label: '3D ko‘rinish' },
            ]}
          />
          <Segmented<Dentition>
            value={dentition}
            onChange={setDentition}
            options={[
              { value: 'adult', label: 'Doimiy' },
              { value: 'child', label: 'Sut tishlar' },
              { value: 'mixed', label: 'Aralash' },
            ]}
          />
          {selected.length > 1 && (
            <span className="inline-flex h-7.5 items-center gap-1.5 rounded-pill bg-lime-soft pl-3 pr-1 text-xs text-ink">
              {selected.length} ta tish tanlandi
              <button
                type="button"
                aria-label="Tanlovni bekor qilish"
                className="grid size-6 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-ink hover:bg-subtle"
                onClick={() => setSelected([])}
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </span>
          )}
          <div className="flex flex-wrap gap-2 md:ml-auto">
            {canEdit && (
              <Dropdown
                disabled={!selected.length}
                trigger={['click']}
                menu={{
                  items: CONDITIONS.map((c) => ({ key: c, label: TOOTH_CONDITION[c].label, icon: <ConditionIcon condition={c} /> })),
                  onClick: ({ key }) =>
                    bulk.mutate(
                      { teeth: selected, condition: key as (typeof CONDITIONS)[number] },
                      {
                        onSuccess: () => {
                          message.success(`${selected.length} ta tishga “${TOOTH_CONDITION[key as keyof typeof TOOTH_CONDITION].short}” berildi`);
                          setSelected([]);
                        },
                        onError: (e) => message.error(errorMessage(e)),
                      },
                    ),
                }}
              >
                <Tooltip title={selected.length ? undefined : 'Shift yoki Ctrl bilan bir nechta tish tanlang'}>
                  <Button icon={<Layers size={18} strokeWidth={1.5} />} loading={bulk.isPending} disabled={!selected.length}>
                    Tanlanganlarga holat berish
                  </Button>
                </Tooltip>
              </Dropdown>
            )}
            <Button icon={<Presentation size={18} strokeWidth={1.5} />} onClick={() => setPresenting(true)}>
              Bemorga ko‘rsatish
            </Button>
            <Tooltip title="Chop etish">
              <Button shape="circle" aria-label="Chop etish" icon={<Printer size={18} strokeWidth={1.5} />} onClick={print} />
            </Tooltip>
          </div>
        </div>

        {mode === '2d' ? (
          <ToothChart records={records} dentition={dentition} selected={selected} onSelect={onSelect} onOpen={onOpen} />
        ) : (
          <Jaw3DView records={records} dentition={dentition} selected={selected} onToothClick={on3DClick} />
        )}

        <div className="mt-5 border-t border-line-soft pt-4">
          {mode === '2d' ? <ChartLegend /> : <Jaw3DLegend records={records} dentition={dentition} />}
          <p className="mb-0 mt-3 text-xs text-muted">
            {mode === '2d'
              ? 'Tishni bosing — ma’lumot oynasi ochiladi. Shift / Ctrl bilan bir nechta tanlash, Tab — tishlar bo‘ylab yurish, Enter — ochish.'
              : '3D — ko‘rish va tushuntirish uchun. Holatlarni tez kiritish uchun 2D sxemadan foydalaning.'}
          </p>
        </div>
      </Panel>

      <Panel title="O‘zgarishlar tarixi">
        <ToothHistoryList patientId={patient.id} />
      </Panel>

      <ToothDrawer
        patientId={patient.id}
        tooth={open}
        record={records.find((r) => r.tooth === open)}
        readOnly={!canEdit}
        onClose={() => setOpen(null)}
      />

      <JawPresentationModal
        open={presenting}
        onClose={() => setPresenting(false)}
        patientId={patient.id}
        dentition={dentition}
        subtitle={fullName(patient)}
      />

      {portal(
        <div className="p-2">
          <PrintHeader title="Tish sxemasi (odontogramma)" subtitle={<>{fullName(patient)} · {patient.cardNo}<br />{formatDate(printedAt)}</>} />
          <ToothChart records={records} dentition={dentition} selected={[]} compact />
          <div className="mt-4">
            <ChartLegend />
          </div>
        </div>,
      )}
    </div>
  );
};
