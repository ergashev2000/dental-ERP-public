import { App, Button, Image, Input, Segmented, Skeleton, Tooltip, Upload } from 'antd';
import { useState } from 'react';
import { ExternalLink, FileText, ImagePlus, Trash2, UploadCloud } from '@/shared/icons';
import { EmptyState, Panel } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { formatDate, formatFileSize } from '@/shared/utils/format';
import { useDeleteFile, usePatientFiles, useUpdateFileNote, useUploadFile } from '../hooks/usePatients';
import type { PatientFile } from '../types';

const MAX = 20 * 1024 * 1024;
const isImage = (f: PatientFile) => f.mime.startsWith('image/');

type Kind = 'XRAY' | 'PHOTO' | 'DOC';
const KIND_LABEL: Record<Kind, string> = { XRAY: 'Rentgen', PHOTO: 'Foto', DOC: 'Hujjat' };
const PHOTO_KIND_LABEL = { BEFORE: 'Oldin', PROGRESS: 'Jarayon', AFTER: 'Keyin' } as const;
const XRAY_RE = /rentgen|x-?ray|opg|panoram|ortopantom|kt\b|cbct|snimok/i;

/** Fayl turi: rasm nomi/izohida rentgen belgisi bo'lsa — Rentgen, boshqa rasm — Foto, qolgani — Hujjat */
const kindOf = (f: PatientFile): Kind => {
  if (!isImage(f)) return 'DOC';
  return XRAY_RE.test(`${f.name} ${f.note ?? ''}`) ? 'XRAY' : 'PHOTO';
};

const Chip = ({ children }: { children: string }) => (
  <span className="inline-flex h-6 items-center whitespace-nowrap rounded-pill bg-surface px-2.5 text-xs text-ink">{children}</span>
);

/** Rentgen, rasm va PDF fayllar (faqat yuklash va ko'rish — tahrirlash MVPda yo'q) */
export const FilesTab = ({ patientId }: { patientId: string }) => {
  const { message, modal } = App.useApp();
  const { data = [], isLoading } = usePatientFiles(patientId);
  const upload = useUploadFile();
  const del = useDeleteFile();
  const note = useUpdateFileNote();
  const [filter, setFilter] = useState<Kind | 'ALL'>('ALL');

  const count = (k: Kind) => data.filter((f) => kindOf(f) === k).length;
  const shown = filter === 'ALL' ? data : data.filter((f) => kindOf(f) === filter);

  const remove = (f: PatientFile) =>
    modal.confirm({
      title: 'Faylni o‘chirish',
      content: f.name,
      okText: 'O‘chirish',
      okButtonProps: { danger: true },
      cancelText: 'Bekor qilish',
      onOk: () => del.mutateAsync(f.id),
    });

  const beforeUpload = (file: File) => {
    if (file.size > MAX) {
      message.error(`${file.name}: hajmi 20 MB dan katta`);
      return Upload.LIST_IGNORE;
    }
    upload.mutate(
      { patientId, file },
      { onSuccess: () => message.success(`${file.name} yuklandi`), onError: (e) => message.error(errorMessage(e)) },
    );
    return false;
  };

  return (
    <Panel title="Fayllar" bodyClassName="flex flex-col gap-5 p-5">
      <Upload.Dragger multiple accept="image/*,application/pdf" showUploadList={false} beforeUpload={beforeUpload}>
        {data.length ? (
          // fayllar bor — ixcham bir qatorli yuklash maydoni
          <div className="flex items-center justify-center gap-3 px-2 text-left">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink">
              <UploadCloud size={20} strokeWidth={1.5} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm text-ink">Yangi faylni tashlang yoki tanlang</span>
              <span className="block text-xs text-muted">Rentgen, rasm yoki PDF · maksimal 20 MB</span>
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <span className="grid size-12 place-items-center rounded-full bg-surface text-ink">
              <ImagePlus size={20} strokeWidth={1.5} />
            </span>
            <div className="text-base text-ink">Faylni shu yerga tashlang yoki tanlang</div>
            <div className="text-xs text-muted">Rentgen, rasm yoki PDF · maksimal 20 MB</div>
          </div>
        )}
      </Upload.Dragger>

      {isLoading || upload.isPending ? <Skeleton active paragraph={{ rows: 2 }} /> : null}
      {!isLoading && !data.length && !upload.isPending && <div className="text-center text-sm text-muted">Bu bemorda hali fayl yo‘q</div>}

      {data.length > 0 && (
        <>
          <div className="max-w-full overflow-x-auto">
            <Segmented
              value={filter}
              onChange={(v) => setFilter(v as Kind | 'ALL')}
              options={[
                { value: 'ALL', label: `Hammasi · ${data.length}` },
                { value: 'XRAY', label: `Rentgen · ${count('XRAY')}` },
                { value: 'PHOTO', label: `Foto · ${count('PHOTO')}` },
                { value: 'DOC', label: `Hujjat · ${count('DOC')}` },
              ]}
            />
          </div>

          {!shown.length ? (
            <EmptyState compact icon={FileText} title={`${filter === 'ALL' ? 'Fayl' : KIND_LABEL[filter]} yo‘q`} />
          ) : (
            <Image.PreviewGroup>
              <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {shown.map((f) => {
                  const kind = kindOf(f);
                  return (
                    <li key={f.id} className="group relative flex min-w-0 flex-col overflow-hidden rounded-md bg-subtle">
                      {kind === 'DOC' ? (
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          className="grid h-36 place-items-center text-ink transition-colors hover:bg-subtle-strong"
                          aria-label={`${f.name} — ochish`}
                        >
                          <span className="flex flex-col items-center gap-2">
                            <span className="grid size-12 place-items-center rounded-full bg-surface">
                              <FileText size={20} strokeWidth={1.5} />
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-muted">
                              Ochish <ExternalLink size={14} strokeWidth={1.5} />
                            </span>
                          </span>
                        </a>
                      ) : (
                        <Image src={f.url} alt={f.name} width="100%" height={144} rootClassName="block" className="object-cover" />
                      )}

                      <div className="pointer-events-none absolute left-2 top-2 flex gap-1">
                        <Chip>{KIND_LABEL[kind]}</Chip>
                        {f.photoKind && <Chip>{PHOTO_KIND_LABEL[f.photoKind]}</Chip>}
                      </div>
                      <Tooltip title="O‘chirish">
                        <Button
                          shape="circle"
                          size="small"
                          aria-label="O‘chirish"
                          className="absolute! right-2 top-2 bg-surface transition-opacity duration-150 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                          icon={<Trash2 size={16} strokeWidth={1.5} />}
                          onClick={() => remove(f)}
                        />
                      </Tooltip>

                      <div className="flex min-w-0 flex-col gap-0.5 px-3 pb-2 pt-3">
                        <div className="truncate text-sm text-ink" title={f.name}>
                          {f.name}
                        </div>
                        <div className="text-xs text-muted tabular-nums">
                          {formatDate(f.createdAt)} · {formatFileSize(f.size)}
                        </div>
                        <Input
                          size="small"
                          variant="borderless"
                          defaultValue={f.note}
                          placeholder="Izoh qo‘shish…"
                          aria-label="Fayl izohi"
                          className="px-0!"
                          onBlur={(e) => e.target.value !== (f.note ?? '') && note.mutate({ id: f.id, note: e.target.value })}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Image.PreviewGroup>
          )}
        </>
      )}
    </Panel>
  );
};
