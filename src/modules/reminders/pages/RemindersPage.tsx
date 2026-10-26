import { DatePicker, Select, Tabs } from 'antd';
import { CalendarCheck2, CalendarX2, Hourglass, PhoneMissed } from '@/shared/icons';
import dayjs from '@/shared/lib/dayjs';
import { FilterBar, PageHeader, Panel, SearchInput, StatCard, StatusTag } from '@/shared/components/ui';
import { CALL_RESULT } from '@/shared/constants/status';
import { usePermission } from '@/shared/hooks/usePermission';
import { CallsTable } from '../components/CallsTable';
import { QueueTab } from '../components/QueueTab';
import { RulesTab } from '../components/RulesTab';
import { TemplateTab } from '../components/TemplateTab';
import { CALL_RESULTS, REMINDER_TABS, useCallLogs, useReminderSummary, useRemindersParams } from '../hooks/useReminders';

const iso = (d: Date | null) => (d ? dayjs(d).format('YYYY-MM-DD') : null);

/** Bugungi natijalar: sokin plitkalar, har birida nima qilish kerakligi so'z bilan */
const Summary = () => {
  const { data, isLoading } = useReminderSummary();
  const noAnswer = data?.noAnswer ?? 0;
  const items = [
    { title: 'Tasdiqladi', icon: CalendarCheck2, value: data?.confirmed, hint: 'Bugun · qabulga keladi' },
    { title: 'Bekor qildi', icon: CalendarX2, value: data?.cancelled, hint: 'Bugun · kalendarda vaqt bo‘shadi' },
    {
      title: 'Javob bermadi',
      icon: PhoneMissed,
      value: data?.noAnswer,
      hint: noAnswer > 0 ? <StatusTag tone="warning">O‘zingiz qo‘ng‘iroq qiling</StatusTag> : 'Bugun · hamma javob berdi',
    },
    { title: 'Navbatda', icon: Hourglass, value: data?.pending, hint: 'Hali qo‘ng‘iroq qilinmagan' },
  ];
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
      {items.map((i) => (
        <StatCard key={i.title} icon={i.icon} title={i.title} value={i.value ?? '—'} hint={i.hint} loading={isLoading} />
      ))}
    </div>
  );
};

export const RemindersPage = () => {
  const [p, setP] = useRemindersParams();
  const isAdmin = usePermission('reminder.rules');
  const calls = useCallLogs({ from: iso(p.from), to: iso(p.to), result: p.result, q: p.q, page: p.page, pageSize: 15 }, p.tab === 'history');
  const set = (patch: Partial<typeof p>) => void setP({ ...patch, page: 1 });
  const tab = !isAdmin && (p.tab === 'rules' || p.tab === 'template') ? 'queue' : p.tab;

  return (
    <>
      <PageHeader
        title="Eslatmalar"
        breadcrumb={[{ label: 'Bosh sahifa', to: '/' }, { label: 'Eslatmalar' }]}
        description="Qabuldan oldin bemorga avtomatik qo‘ng‘iroq. Ertalab navbatni oching: kim tasdiqladi, kimga o‘zingiz qo‘ng‘iroq qilishingiz kerak"
      />
      <Summary />
      <Panel className="flex-1" bodyClassName="px-3 pb-4 md:px-4">
        <Tabs
          activeKey={tab}
          onChange={(k) => void setP({ tab: k as (typeof REMINDER_TABS)[number], page: 1, q: null, show: null })}
          items={[
            { key: 'queue', label: 'Navbat', children: <QueueTab q={p.q} onQ={(q) => set({ q })} show={p.show} onShow={(show) => void setP({ show })} /> },
            {
              key: 'history',
              label: 'Qo‘ng‘iroqlar tarixi',
              children: (
                <>
                  <FilterBar active={!!(p.q || p.result || p.from)} onReset={() => set({ q: null, result: null, from: null, to: null })}>
                    <SearchInput value={p.q} onChange={(q) => set({ q })} placeholder="Bemor yoki telefon" />
                    <Select
                      allowClear
                      placeholder="Natija"
                      className="w-full sm:w-48"
                      value={p.result ?? undefined}
                      onChange={(r?: (typeof CALL_RESULTS)[number]) => set({ result: r ?? null })}
                      options={CALL_RESULTS.filter((r) => r !== 'PENDING' && r !== 'CALLING').map((r) => ({ value: r, label: CALL_RESULT[r].label }))}
                    />
                    <DatePicker.RangePicker
                      format="DD.MM.YYYY"
                      className="w-full sm:w-auto"
                      value={p.from && p.to ? [dayjs(p.from), dayjs(p.to)] : null}
                      onChange={(r) => set({ from: r?.[0]?.toDate() ?? null, to: r?.[1]?.toDate() ?? null })}
                    />
                  </FilterBar>
                  <CallsTable data={calls.data?.items} loading={calls.isFetching} total={calls.data?.total} page={p.page} onPage={(page) => void setP({ page })} />
                </>
              ),
            },
            ...(isAdmin
              ? [
                  { key: 'rules', label: 'Qoidalar', children: <RulesTab /> },
                  { key: 'template', label: 'Ovozli xabar shabloni', children: <TemplateTab /> },
                ]
              : []),
          ]}
        />
      </Panel>
    </>
  );
};
