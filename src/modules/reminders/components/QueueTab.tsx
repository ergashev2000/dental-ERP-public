import { App, Button, Segmented, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCheck, PhoneCall, PhoneMissed, SkipForward } from '@/shared/icons';
import { useMemo } from 'react';
import { EmptyState, FilterBar, PhoneText, SearchInput, StatusTag } from '@/shared/components/ui';
import { CALL_RESULT } from '@/shared/constants/status';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { formatRelativeDay } from '@/shared/utils/format';
import { MOCK_CALLS_ENABLED } from '@/shared/lib/mock/callSimulator';
import { QUEUE_VIEWS, useCallNow, useConfirmJob, useQueue, useSkipJob } from '../hooks/useReminders';
import type { CallResult, JobView } from '../types';

type QueueView = (typeof QUEUE_VIEWS)[number];

/** Qaysi status qaysi ko'rinishga tushadi. "call" — registratura o'zi qo'ng'iroq qilishi kerak */
const VIEW_STATUSES: Record<Exclude<QueueView, 'all'>, CallResult[]> = {
  call: ['NO_ANSWER', 'BUSY', 'FAILED', 'OPERATOR_REQUESTED'],
  pending: ['PENDING', 'CALLING'],
  done: ['CONFIRMED', 'CANCELLED_BY_PATIENT', 'SKIPPED'],
};

const VIEW_LABEL: Record<QueueView, string> = { all: 'Hammasi', call: 'Qo‘ng‘iroq kerak', pending: 'Navbatda', done: 'Yakunlangan' };

const OPEN_STATUSES: CallResult[] = ['PENDING', 'NO_ANSWER', 'BUSY', 'FAILED', 'OPERATOR_REQUESTED'];

interface Props {
  q: string | null;
  onQ: (q: string | null) => void;
  show: QueueView;
  onShow: (v: QueueView) => void;
}

export const QueueTab = ({ q, onQ, show, onShow }: Props) => {
  const { data, isLoading } = useQueue(q);
  const call = useCallNow();
  const skip = useSkipJob();
  const confirm = useConfirmJob();
  const { message, modal } = App.useApp();
  const onErr = (e: unknown) => message.error(errorMessage(e));

  const counts = useMemo(() => {
    const rows = data ?? [];
    const c = { all: rows.length, call: 0, pending: 0, done: 0 };
    for (const r of rows) {
      for (const v of ['call', 'pending', 'done'] as const) if (VIEW_STATUSES[v].includes(r.status)) c[v]++;
    }
    return c;
  }, [data]);

  const rows = show === 'all' ? data : data?.filter((r) => VIEW_STATUSES[show].includes(r.status));

  const columns: ColumnsType<JobView> = [
    { title: 'Qo‘ng‘iroq vaqti', dataIndex: 'scheduledAt', render: (v: string) => <span className="whitespace-nowrap tabular-nums">{formatRelativeDay(v)}</span> },
    {
      title: 'Bemor',
      key: 'p',
      render: (_, r) => (
        <div className="leading-tight">
          <div className="max-w-56 truncate font-medium" title={r.patientName}>
            {r.patientName}
          </div>
          <PhoneText phone={r.phone} className="text-xs" />
        </div>
      ),
    },
    {
      title: 'Qabul',
      key: 'a',
      responsive: ['md'],
      render: (_, r) =>
        r.appointmentStart ? (
          <div className="leading-tight">
            <div className="whitespace-nowrap tabular-nums">{formatRelativeDay(r.appointmentStart)}</div>
            <div className="max-w-48 truncate text-xs text-muted" title={r.doctorName}>
              {r.doctorName}
            </div>
          </div>
        ) : (
          <span className="text-muted">Profilaktik ko‘rik</span>
        ),
    },
    { title: 'Qoida', dataIndex: 'ruleName', responsive: ['xl'], render: (v: string) => <span className="block max-w-48 truncate text-muted" title={v}>{v}</span> },
    { title: 'Urinish', key: 'att', align: 'center', responsive: ['lg'], render: (_, r) => <span className="tabular-nums">{r.attempt}/{r.maxAttempts}</span> },
    { title: 'Holat', dataIndex: 'status', render: (s: JobView['status']) => <StatusTag meta={CALL_RESULT[s]} pulse={s === 'CALLING'} /> },
    {
      key: 'act',
      width: 140,
      render: (_, r) => {
        const open = OPEN_STATUSES.includes(r.status);
        const canConfirm = open && !!r.appointmentId;
        const canSkip = ['PENDING', 'NO_ANSWER', 'BUSY'].includes(r.status);
        // Bajarib bo'lmaydigan amallar ko'rsatilmaydi — har qatordagi o'chiq ikonkalar shovqin edi
        if (!open && !canSkip) return null;
        return (
          <div className="flex justify-end gap-1">
            {open && (
            <Tooltip title="Avtomatik qo‘ng‘iroqni hozir boshlash">
              <Button
                type="text"
                shape="circle"
                aria-label="Hozir qo‘ng‘iroq qilish"
                icon={<PhoneCall size={18} strokeWidth={1.5} />}
                loading={call.isPending && call.variables === r.id}
                onClick={() => call.mutate(r.id, { onSuccess: () => message.info('Qo‘ng‘iroq boshlandi'), onError: onErr })}
              />
            </Tooltip>
            )}
            {canConfirm && (
            <Tooltip title="Bemor bilan gaplashdingiz va u keladi — qo‘lda tasdiqlash">
              <Button
                type="text"
                shape="circle"
                aria-label="Qo‘lda tasdiqlash"
                icon={<CheckCheck size={18} strokeWidth={1.5} />}
                onClick={() => confirm.mutate(r.id, { onSuccess: () => message.success('Qabul tasdiqlandi'), onError: onErr })}
              />
            </Tooltip>
            )}
            {canSkip && (
            <Tooltip title="O‘tkazib yuborish — qo‘ng‘iroq qilinmaydi">
              <Button
                type="text"
                shape="circle"
                aria-label="O‘tkazib yuborish"
                icon={<SkipForward size={18} strokeWidth={1.5} />}
                onClick={() =>
                  modal.confirm({
                    title: 'Eslatma o‘tkazib yuborilsinmi?',
                    content: `${r.patientName} — bu qo‘ng‘iroq qilinmaydi. Buni qaytarib bo‘lmaydi.`,
                    okText: 'Ha, o‘tkazib yuborish',
                    cancelText: 'Yopish',
                    onOk: () => skip.mutateAsync(r.id).catch(onErr),
                  })
                }
              />
            </Tooltip>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      {counts.call > 0 && show !== 'call' && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md bg-warning-soft px-4 py-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink">
            <PhoneMissed size={20} strokeWidth={1.5} />
          </span>
          <div className="min-w-0 flex-1 text-sm text-ink">
            {counts.call} ta bemor javob bermadi yoki operatorni so‘radi — ularga o‘zingiz qo‘ng‘iroq qiling.
            <div className="text-xs text-muted">Gaplashib bo‘lgach, qatordagi “Qo‘lda tasdiqlash” tugmasi bilan belgilang.</div>
          </div>
          <Button className="bg-surface" onClick={() => onShow('call')}>
            Ro‘yxatni ochish
          </Button>
        </div>
      )}
      <FilterBar
        active={!!q || show !== 'all'}
        onReset={() => {
          onQ(null);
          onShow('all');
        }}
        extra={!MOCK_CALLS_ENABLED && <span className="text-xs text-muted">Simulyatsiya o‘chirilgan (VITE_MOCK_CALLS)</span>}
      >
        <SearchInput value={q} onChange={onQ} placeholder="Bemor yoki telefon" />
        <div className="max-w-full overflow-x-auto">
          <Segmented<QueueView>
            value={show}
            onChange={onShow}
            options={QUEUE_VIEWS.map((v) => ({
              value: v,
              label: (
                <span className="whitespace-nowrap">
                  {VIEW_LABEL[v]} <span className="tabular-nums text-muted">{counts[v]}</span>
                </span>
              ),
            }))}
          />
        </div>
      </FilterBar>
      <Table
        rowKey="id"
        size="middle"
        loading={isLoading}
        columns={columns}
        dataSource={rows}
        scroll={{ x: 640 }}
        pagination={{ pageSize: 15, hideOnSinglePage: true, showSizeChanger: false }}
        locale={{
          emptyText:
            show === 'call' ? (
              <EmptyState title="Qo‘ng‘iroq kerak bo‘lgan bemor yo‘q" description="Hamma javob berdi yoki navbatda turibdi" />
            ) : (
              <EmptyState title="Navbat bo‘sh" description="Bugun va ertaga uchun rejalashtirilgan qo‘ng‘iroqlar yo‘q" />
            ),
        }}
      />
    </>
  );
};
