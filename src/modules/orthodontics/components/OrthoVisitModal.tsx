import { App, AutoComplete, Button, Checkbox, DatePicker, Form, Input, Modal, Segmented, Select, Upload } from 'antd';
import type { Dayjs } from 'dayjs';
import { ImagePlus, Trash2 } from '@/shared/icons';
import { useEffect, useState } from 'react';
import dayjs from '@/shared/lib/dayjs';
import { ORTHO_STAGE } from '@/shared/constants/status';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { usePermission } from '@/shared/hooks/usePermission';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { cn } from '@/shared/utils/cn';
import { formatDate } from '@/shared/utils/format';
import { useNewAppointment } from '@/modules/appointments';
import { useAddOrthoVisit } from '../hooks/useOrtho';
import { ORTHO_STAGES, type OrthoCaseView, type OrthoPhoto, type OrthoStage, type OrthoVisitView } from '../types';

/** Ko'p uchraydigan ishlar — bir bosishda tanlanadi */
const ORTHO_WORKS = [
  'Duga almashtirildi',
  'Ligaturalar almashtirildi',
  'Faollashtirish',
  'Rezinkalar berildi',
  'Breket qayta yopishtirildi',
  'Nazorat ko‘rigi',
  'Breketlar o‘rnatildi',
  'Breketlar olindi',
  'Retainer o‘rnatildi',
  'Qolip olindi',
];

/** Har oylik korreksiyada takrorlanadigan ishlar — oldingi tashrifdan avtomatik olinadi */
const ROUTINE_WORKS = ['Ligaturalar almashtirildi', 'Faollashtirish', 'Rezinkalar berildi', 'Nazorat ko‘rigi'];

/**
 * Duga va ligatura alohida maydon sifatida kiritiladi, lekin `work` ichida
 * "Duga: 0.016 NiTi" ko'rinishida saqlanadi — keyingi korreksiyada shundan to'ldiriladi.
 */
const WIRE_PREFIX = 'Duga: ';
const LIGATURE_PREFIX = 'Ligatura: ';

const WIRES = ['0.012 NiTi', '0.014 NiTi', '0.016 NiTi', '0.018 NiTi', '0.016×0.022 NiTi', '0.017×0.025 NiTi', '0.019×0.025 NiTi', '0.016×0.022 SS', '0.017×0.025 SS', '0.019×0.025 SS', '0.017×0.025 TMA'];
const LIGATURES = ['Elastik, kulrang', 'Elastik, shaffof', 'Elastik, rangli', 'Metall ligatura', 'Zanjir (power chain)'];

const MAX = 20 * 1024 * 1024;

/** Ishlar — chiplar (Form.Item ichida value/onChange bilan) */
const WorkPicker = ({ value = [], onChange }: { value?: string[]; onChange?: (v: string[]) => void }) => (
  <div className="flex flex-wrap gap-1.5">
    {ORTHO_WORKS.map((w) => {
      const on = value.includes(w);
      return (
        <button
          key={w}
          type="button"
          aria-pressed={on}
          onClick={() => onChange?.(on ? value.filter((x) => x !== w) : [...value, w])}
          className={cn(
            'h-8 cursor-pointer rounded-pill border-0 px-3 text-sm transition-colors duration-150',
            on ? 'bg-ink text-on-ink hover:bg-neutral-800' : 'bg-subtle text-ink hover:bg-subtle-strong',
          )}
        >
          {w}
        </button>
      );
    })}
  </div>
);

interface Values {
  date: Dayjs;
  stage: OrthoStage;
  wire?: string;
  ligature?: string;
  work: string[];
  note?: string;
  /** Keyingi korreksiya sanasi — saqlangach qabulga yozishda ishlatiladi */
  next?: Dayjs;
  book?: boolean;
}

interface Photo {
  uid: string;
  file: File;
  url: string;
  kind: OrthoPhoto['kind'];
}

/** Oxirgi tashriflardan prefiksli yozuvni topish (masalan, oxirgi duga) */
const lastTagged = (visits: OrthoVisitView[], prefix: string) => {
  for (const v of visits) {
    const hit = v.work.find((w) => w.startsWith(prefix));
    if (hit) return hit.slice(prefix.length);
  }
  return undefined;
};

interface Props {
  /** Batafsil sahifadan kelganda `visits` ham bor — standart qiymatlar shundan olinadi */
  orthoCase: OrthoCaseView & { visits?: OrthoVisitView[] };
  open: boolean;
  onClose: () => void;
}

/** Korreksiya (tashrif) qo'shish: oldingi korreksiyadan to'ldirilgan — odatda faqat "Saqlash" yetarli */
export const OrthoVisitModal = ({ orthoCase, open, onClose }: Props) => {
  const [form] = Form.useForm<Values>();
  const { message } = App.useApp();
  const isMobile = useIsMobile();
  const add = useAddOrthoVisit();
  const openNew = useNewAppointment((s) => s.show);
  const canBook = usePermission('appointment.manage');
  const [photos, setPhotos] = useState<Photo[]>([]);

  const visits = orthoCase.visits ?? [];
  const last = visits[0];
  const prevWire = lastTagged(visits, WIRE_PREFIX);
  const prevLigature = lastTagged(visits, LIGATURE_PREFIX);
  const hasWire = orthoCase.appliance !== 'ALIGNER';
  const hasLigature = orthoCase.appliance !== 'ALIGNER' && orthoCase.appliance !== 'SELF_LIGATING';
  const interval = orthoCase.visitIntervalDays;

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    const routine = orthoCase.stage === 'ADJUSTMENT' ? (last?.work.filter((w) => ROUTINE_WORKS.includes(w)) ?? []) : [];
    form.setFieldsValue({
      date: dayjs(),
      stage: orthoCase.stage,
      wire: hasWire ? prevWire : undefined,
      ligature: hasLigature ? prevLigature : undefined,
      work: routine.length || orthoCase.stage !== 'ADJUSTMENT' || !hasLigature ? routine : ['Ligaturalar almashtirildi'],
      next: dayjs().add(interval, 'day'),
      book: canBook,
    });
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- faqat oyna ochilganda to'ldiriladi
  }, [open]);

  const onValuesChange = (changed: Partial<Values>) => {
    // Sana o'zgarsa — keyingi korreksiya ham shu sanadan hisoblanadi
    if (changed.date) form.setFieldValue('next', changed.date.add(interval, 'day'));
    // Duga oldingisidan farq qilsa — "Duga almashtirildi" avtomatik belgilanadi (olib tashlash mumkin)
    if ('wire' in changed) {
      const work: string[] = form.getFieldValue('work') ?? [];
      const changedWire = !!changed.wire && changed.wire !== prevWire;
      const tag = 'Duga almashtirildi';
      if (changedWire && !work.includes(tag)) form.setFieldValue('work', [...work, tag]);
      if (!changedWire && prevWire && work.includes(tag)) form.setFieldValue('work', work.filter((w) => w !== tag));
    }
  };

  const submit = (v: Values) => {
    const work = [...(v.work ?? []), v.wire?.trim() && `${WIRE_PREFIX}${v.wire.trim()}`, v.ligature?.trim() && `${LIGATURE_PREFIX}${v.ligature.trim()}`].filter(
      (x): x is string => !!x,
    );
    add.mutate(
      { caseId: orthoCase.id, date: v.date.format('YYYY-MM-DD'), stage: v.stage, work, note: v.note, photos: photos.map((p) => ({ file: p.file, kind: p.kind })) },
      {
        onSuccess: () => {
          onClose();
          const next = v.next ?? dayjs().add(interval, 'day');
          if (v.book && canBook) {
            message.success('Korreksiya saqlandi — endi keyingi qabulni tanlang');
            openNew({ patientId: orthoCase.patientId, doctorId: orthoCase.doctorId, date: next.format('YYYY-MM-DD') });
          } else {
            message.success(`Korreksiya saqlandi. Keyingisi taxminan ${formatDate(next.toISOString())}`);
          }
        },
        onError: (e) => message.error(errorMessage(e)),
      },
    );
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      afterClose={() => setPhotos([])}
      width={isMobile ? '100%' : 640}
      title={`Korreksiya — ${orthoCase.patientName}`}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Bekor qilish</Button>
          <Button type="primary" loading={add.isPending} onClick={() => form.submit()}>
            Saqlash
          </Button>
        </div>
      }
    >
      {last && (
        <div className="mt-4 flex flex-col gap-1 rounded-md bg-subtle px-4 py-3 text-sm">
          <div className="text-xs text-muted">
            Oldingi korreksiya · <span className="tabular-nums">{formatDate(last.date)}</span> · {dayjs().startOf('day').diff(dayjs(last.date), 'day')} kun oldin
          </div>
          <div className="truncate" title={[...last.work, last.note].filter(Boolean).join(', ')}>
            {[...last.work, last.note].filter(Boolean).join(' · ') || '—'}
          </div>
        </div>
      )}

      <Form form={form} layout="vertical" onFinish={submit} onValuesChange={onValuesChange} className="mt-4" requiredMark={false}>
        <div className="grid gap-x-3 sm:grid-cols-2">
          <Form.Item name="date" label="Sana" rules={[{ required: true, message: 'Sanani tanlang' }]}>
            <DatePicker format="DD.MM.YYYY" className="w-full" allowClear={false} disabledDate={(d) => d.isAfter(dayjs(), 'day')} />
          </Form.Item>
          <Form.Item name="stage" label="Bosqich" tooltip="Bosqich oldinga o‘tsa, davolash bosqichi ham yangilanadi">
            <Select options={ORTHO_STAGES.map((s) => ({ value: s, label: ORTHO_STAGE[s].label }))} />
          </Form.Item>
          {hasWire && (
            <Form.Item name="wire" label="Duga" extra={prevWire ? `Oldingi: ${prevWire}` : undefined} className={hasLigature ? undefined : 'sm:col-span-2'}>
              <AutoComplete allowClear options={WIRES.map((w) => ({ value: w }))} placeholder="Masalan, 0.016 NiTi" filterOption={(input, o) => !!o?.value.toLowerCase().includes(input.toLowerCase())} />
            </Form.Item>
          )}
          {hasLigature && (
            <Form.Item name="ligature" label="Ligatura" extra={prevLigature ? `Oldingi: ${prevLigature}` : undefined}>
              <AutoComplete allowClear options={LIGATURES.map((w) => ({ value: w }))} placeholder="Masalan, elastik, kulrang" filterOption={(input, o) => !!o?.value.toLowerCase().includes(input.toLowerCase())} />
            </Form.Item>
          )}
        </div>

        <Form.Item
          name="work"
          label="Nima qilindi"
          dependencies={['note', 'wire', 'ligature']}
          rules={[
            {
              validator: (_, v?: string[]) =>
                v?.length || form.getFieldValue('note') || form.getFieldValue('wire') || form.getFieldValue('ligature')
                  ? Promise.resolve()
                  : Promise.reject(new Error('Kamida bittasini tanlang yoki izoh yozing')),
            },
          ]}
        >
          <WorkPicker />
        </Form.Item>

        <Form.Item name="note" label="Shifokor izohi">
          <Input.TextArea rows={2} maxLength={500} placeholder="Masalan: gigiyena yaxshi, keyingi safar 0.018 duga" />
        </Form.Item>

        <div className="grid items-end gap-x-3 sm:grid-cols-2">
          <Form.Item name="next" label="Keyingi korreksiya" tooltip={`Davolash rejasi bo‘yicha har ${interval} kunda`}>
            <DatePicker
              format="DD.MM.YYYY"
              className="w-full"
              allowClear={false}
              disabledDate={(d) => d.isBefore(dayjs(), 'day')}
              presets={[3, 4, 5, 6].map((w) => ({ label: `${w} haftadan keyin`, value: dayjs().add(w, 'week') }))}
            />
          </Form.Item>
          {canBook && (
            <Form.Item name="book" valuePropName="checked">
              <Checkbox>Saqlagach qabulga yozish</Checkbox>
            </Form.Item>
          )}
        </div>

        <div className="mb-2 text-xs text-muted">Rasmlar (ixtiyoriy)</div>
        <div className="flex flex-wrap gap-2">
          {photos.map((p) => (
            <div key={p.uid} className="w-36 overflow-hidden rounded-sm bg-subtle">
              <img src={p.url} alt={p.file.name} className="block h-24 w-full object-cover" />
              <div className="flex items-center gap-1 p-1.5">
                <Segmented
                  size="small"
                  value={p.kind}
                  onChange={(k) => setPhotos((list) => list.map((x) => (x.uid === p.uid ? { ...x, kind: k as Photo['kind'] } : x)))}
                  options={[
                    { value: 'BEFORE', label: 'Oldin' },
                    { value: 'AFTER', label: 'Keyin' },
                  ]}
                />
                <Button
                  size="small"
                  type="text"
                  shape="circle"
                  aria-label="Olib tashlash"
                  icon={<Trash2 size={16} strokeWidth={1.5} />}
                  onClick={() => setPhotos((list) => list.filter((x) => x.uid !== p.uid))}
                />
              </div>
            </div>
          ))}
          <Upload
            accept="image/*"
            multiple
            showUploadList={false}
            beforeUpload={(file) => {
              if (file.size > MAX) {
                message.error(`${file.name}: hajmi 20 MB dan katta`);
                return Upload.LIST_IGNORE;
              }
              setPhotos((list) => [...list, { uid: file.uid, file, url: URL.createObjectURL(file), kind: list.length ? 'AFTER' : 'BEFORE' }]);
              return false;
            }}
          >
            <button
              type="button"
              className={cn(
                'flex cursor-pointer items-center justify-center gap-2 rounded-sm border-0 bg-subtle text-sm text-ink transition-colors duration-150 hover:bg-subtle-strong',
                photos.length ? 'h-[132px] w-36 flex-col' : 'h-11 rounded-pill px-4',
              )}
            >
              <ImagePlus size={20} strokeWidth={1.5} />
              Rasm qo‘shish
            </button>
          </Upload>
        </div>
      </Form>
    </Modal>
  );
};
