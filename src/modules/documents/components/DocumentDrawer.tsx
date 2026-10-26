import { App, Button, Checkbox, Drawer, Form, Input, Popconfirm, Select, Skeleton } from 'antd';
import { useState } from 'react';
import { Contract, FileText, Pill, Printer, RotateCcw, ShieldCheck, Tooth, type AppIcon } from '@/shared/icons';
import { DoctorSelect, MoneyInput, StatusTag } from '@/shared/components/ui';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import dayjs from '@/shared/lib/dayjs';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { ADULT_LOWER, ADULT_UPPER } from '@/shared/utils/fdi';
import { useDoctors } from '@/modules/staff';
import { DOC_STATUS, DOC_TEMPLATES, docTemplate, fillTemplate } from '../templates';
import { useDocumentContext, useRemoveDraft, useSaveDocument } from '../hooks/useDocuments';
import type { DocTemplate, DocTemplateKey, DocumentView } from '../types';
import { DocumentSheet, type PrintableDoc } from './DocumentSheet';
import { SignaturePad } from './SignaturePad';

export type DocumentDrawerState = { mode: 'new' } | { docId: string } | null;

interface Props {
  patientId: string;
  state: DocumentDrawerState;
  docs: DocumentView[];
  onClose: () => void;
  onOpenDoc: (id: string) => void;
  onPrint: (doc: PrintableDoc) => void;
}

const TEMPLATE_ICON: Record<DocTemplateKey, AppIcon> = {
  GENERAL_CONSENT: ShieldCheck,
  IMPLANT_CONSENT: Tooth,
  EXTRACTION_CONSENT: Tooth,
  BRACES_CONTRACT: Contract,
  PRESCRIPTION: Pill,
};

const TEETH_OPTIONS = [
  { label: 'Yuqori jag‘', options: ADULT_UPPER.map((n) => ({ value: n, label: String(n) })) },
  { label: 'Pastki jag‘', options: ADULT_LOWER.map((n) => ({ value: n, label: String(n) })) },
];

interface Draft {
  template: DocTemplate;
  docId?: string;
  doctorId?: string;
  teeth: number[];
  price?: number;
  /** Qo‘lda tahrirlangan matn; null — shablondan avtomatik to‘ldiriladi */
  custom: string | null;
  signature: string | null;
  ack: boolean;
}

/**
 * Hujjat tuzish oqimi (registratura uchun 3 bosish): shablon → oldindan ko‘rish/tahrir → imzo + "tanishdi" → Imzolash.
 * Mavjud qoralama — shu oynada davom ettiriladi; imzolangan — faqat ko‘rish va chop etish.
 */
export const DocumentDrawer = ({ patientId, state, docs, onClose, onOpenDoc, onPrint }: Props) => {
  const isMobile = useIsMobile();
  const { message } = App.useApp();
  const { data: ctx } = useDocumentContext(patientId);
  const { data: doctors = [] } = useDoctors();
  const save = useSaveDocument();
  const remove = useRemoveDraft();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [openedFor, setOpenedFor] = useState<DocumentDrawerState>(null);

  const doc = state && 'docId' in state ? docs.find((d) => d.id === state.docId) : undefined;

  // Drawer holati o'zgarganda (yangi hujjat / boshqa qoralama) tahrir holatini qayta boshlaymiz
  if (state !== openedFor) {
    setOpenedFor(state);
    setDraft(
      doc && doc.status === 'DRAFT'
        ? { template: docTemplate(doc.templateKey), docId: doc.id, doctorId: doc.doctorId, teeth: doc.teeth, price: doc.price, custom: doc.body, signature: null, ack: false }
        : null,
    );
  }

  const doctorName = (id?: string) => doctors.find((d) => d.id === id)?.fullName ?? '';
  const today = dayjs().format('DD.MM.YYYY');

  const start = (t: DocTemplate) =>
    setDraft({ template: t, doctorId: ctx?.defaultDoctorId, teeth: [], custom: null, signature: null, ack: false });

  const body = draft
    ? (draft.custom ??
      fillTemplate(draft.template.body, {
        bemor: ctx?.patientName ?? '',
        sana: today,
        shifokor: doctorName(draft.doctorId),
        klinika: ctx?.clinicName ?? '',
        teeth: draft.teeth,
        price: draft.price,
      }))
    : '';

  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));

  const submit = (sign: boolean) => {
    if (!draft) return;
    if (!draft.doctorId) {
      message.warning('Shifokorni tanlang');
      return;
    }
    save.mutate(
      {
        id: draft.docId,
        input: {
          patientId,
          templateKey: draft.template.key,
          body,
          doctorId: draft.doctorId,
          teeth: draft.teeth,
          price: draft.price,
          signature: sign ? (draft.signature ?? undefined) : undefined,
          acknowledged: sign ? draft.ack : false,
        },
      },
      {
        onSuccess: (saved) => {
          if (sign) {
            message.success('Hujjat imzolandi');
            onOpenDoc(saved.id);
          } else {
            message.success('Qoralama saqlandi');
            onClose();
          }
        },
        onError: (e) => message.error(errorMessage(e)),
      },
    );
  };

  const printable = (): PrintableDoc | null => {
    if (!ctx) return null;
    if (doc && doc.status === 'SIGNED')
      return {
        title: doc.title,
        number: doc.number,
        body: doc.body,
        date: doc.signedAt ?? doc.createdAt,
        patientName: ctx.patientName,
        doctorName: doc.doctorName,
        signer: docTemplate(doc.templateKey).signer,
        signature: doc.signature,
        signedAt: doc.signedAt,
        ctx,
      };
    if (!draft) return null;
    return {
      title: draft.template.title,
      number: doc?.number,
      body,
      date: new Date().toISOString(),
      patientName: ctx.patientName,
      doctorName: doctorName(draft.doctorId),
      signer: draft.template.signer,
      ctx,
    };
  };

  const doPrint = () => {
    const p = printable();
    if (p) onPrint(p);
  };

  const viewing = !!doc && doc.status === 'SIGNED';
  const canSign = !!draft?.signature && !!draft.ack;
  const title = viewing ? doc.title : draft ? draft.template.title : 'Hujjat tuzish';

  const footer = viewing ? (
    <div className="flex justify-end gap-2">
      <Button onClick={onClose}>Yopish</Button>
      <Button type="primary" icon={<Printer size={16} strokeWidth={1.5} />} onClick={doPrint}>
        Chop etish
      </Button>
    </div>
  ) : draft ? (
    <div className="flex flex-wrap justify-end gap-2">
      <Button onClick={onClose}>Bekor qilish</Button>
      <Button loading={save.isPending && !canSign} onClick={() => submit(false)}>
        Qoralama
      </Button>
      <Button type="primary" disabled={!canSign} loading={save.isPending && canSign} onClick={() => submit(true)}>
        Imzolash
      </Button>
    </div>
  ) : (
    <div className="flex justify-end">
      <Button onClick={onClose}>Bekor qilish</Button>
    </div>
  );

  return (
    // Drawer body'ga portal qilinadi (#root tashqarisida) — chop etishda varaq ustiga chiqmasin
    <Drawer open={!!state} onClose={onClose} width={isMobile ? '100%' : 560} title={title} destroyOnHidden footer={footer} rootClassName="print:hidden">
      {!ctx ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : viewing ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusTag meta={DOC_STATUS.SIGNED} />
            <span className="text-xs text-muted">
              {doc.number} · tuzdi {doc.createdByName}
            </span>
          </div>
          <div className="rounded-sheet bg-panel p-2">
            <div className="rounded-card bg-surface p-5">
              <DocumentSheet doc={printable()!} />
            </div>
          </div>
        </div>
      ) : !draft ? (
        <div className="flex flex-col gap-3">
          <p className="m-0 text-sm text-muted">
            Shablonni tanlang — {ctx.patientName} ma’lumotlari avtomatik to‘ldiriladi
          </p>
          <div className="flex flex-col gap-1.5">
            {DOC_TEMPLATES.map((t) => {
              const Icon = TEMPLATE_ICON[t.key] ?? FileText;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => start(t)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-md border-0 bg-subtle p-4 text-left transition-colors hover:bg-subtle-strong"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink">
                    <Icon size={20} strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-ink">{t.title}</span>
                    <span className="block truncate text-xs text-muted">{t.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <Form layout="vertical" component="div" requiredMark={false}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <span className="min-w-0 truncate text-base text-ink">{ctx.patientName}</span>
            {doc && <StatusTag meta={DOC_STATUS.DRAFT} />}
          </div>
          <div className="grid gap-x-3 sm:grid-cols-2">
            <Form.Item label="Shifokor" className={draft.template.fields.length === 0 ? 'sm:col-span-2' : ''}>
              <DoctorSelect value={draft.doctorId} onChange={(doctorId) => patch({ doctorId })} />
            </Form.Item>
            {draft.template.fields.includes('tish') && (
              <Form.Item label="Tish (FDI)">
                <Select mode="multiple" allowClear placeholder="Masalan, 46" value={draft.teeth} onChange={(teeth: number[]) => patch({ teeth })} options={TEETH_OPTIONS} maxTagCount="responsive" />
              </Form.Item>
            )}
            {draft.template.fields.includes('narx') && (
              <Form.Item label="Narx">
                <MoneyInput value={draft.price} onChange={(v) => patch({ price: v ?? undefined })} />
              </Form.Item>
            )}
          </div>

          <Form.Item
            label={
              <span className="flex w-full items-center justify-between gap-2">
                Matn
                {draft.custom !== null && !draft.docId && (
                  <Button type="link" size="small" className="h-auto px-0!" icon={<RotateCcw size={14} strokeWidth={1.5} />} onClick={() => patch({ custom: null })}>
                    Shablondan qayta to‘ldirish
                  </Button>
                )}
              </span>
            }
            className="[&_.ant-form-item-label>label]:w-full"
          >
            <Input.TextArea value={body} autoSize={{ minRows: 8, maxRows: 16 }} onChange={(e) => patch({ custom: e.target.value })} className="text-sm leading-6" />
          </Form.Item>

          <section className="flex flex-col gap-3 rounded-md bg-panel p-4">
            <SignaturePad
              label={draft.template.signer === 'patient' ? 'Bemor imzosi' : 'Shifokor imzosi'}
              empty={!draft.signature}
              onChange={(signature) => patch({ signature })}
            />
            <Checkbox checked={draft.ack} onChange={(e) => patch({ ack: e.target.checked })}>
              Bemor hujjat bilan tanishib chiqdi
            </Checkbox>
          </section>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <Button type="text" icon={<Printer size={16} strokeWidth={1.5} />} onClick={doPrint}>
              Qog‘ozda imzolash uchun chop etish
            </Button>
            {draft.docId && (
              <Popconfirm
                title="Qoralamani o‘chirasizmi?"
                okText="O‘chirish"
                cancelText="Yo‘q"
                okButtonProps={{ danger: true, loading: remove.isPending }}
                onConfirm={() =>
                  remove.mutate(draft.docId!, {
                    onSuccess: () => {
                      message.success('Qoralama o‘chirildi');
                      onClose();
                    },
                    onError: (e) => message.error(errorMessage(e)),
                  })
                }
              >
                <Button type="text" danger>
                  Qoralamani o‘chirish
                </Button>
              </Popconfirm>
            )}
          </div>
        </Form>
      )}
    </Drawer>
  );
};
