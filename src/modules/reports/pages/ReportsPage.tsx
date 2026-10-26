import { Button, DatePicker, Segmented, Tabs } from 'antd';
import { useState } from 'react';
import type { Dayjs } from 'dayjs';
import { Printer } from '@/shared/icons';
import dayjs from '@/shared/lib/dayjs';
import { DoctorSelect, PageHeader } from '@/shared/components/ui';
import { useCurrentUser, usePermission } from '@/shared/hooks/usePermission';
import {
  AppointmentsReportView,
  DoctorsReportView,
  InventoryReportView,
  RemindersReportView,
  ReportKpis,
  RevenueReportView,
  ServicesReportView,
} from '../components/ReportViews';
import { useReportsParams } from '../hooks/useReports';
import type { ReportQuery, ReportType } from '../types';

/** Bo'limlar tartibi — asosiy holatlar birinchi: shifokorlar hisob-kitobi, xizmatlar, kelmaganlar */
const SECTIONS: { key: ReportType; label: string }[] = [
  { key: 'doctors', label: 'Shifokorlar' },
  { key: 'services', label: 'Xizmatlar' },
  { key: 'appointments', label: 'Qabullar' },
  { key: 'revenue', label: 'Tushum' },
  { key: 'reminders', label: 'Eslatmalar' },
  { key: 'inventory', label: 'Ombor' },
];

const VIEWS = {
  revenue: RevenueReportView,
  doctors: DoctorsReportView,
  services: ServicesReportView,
  appointments: AppointmentsReportView,
  reminders: RemindersReportView,
  inventory: InventoryReportView,
} satisfies Record<ReportType, unknown>;

type Period = 'day' | 'week' | 'month' | 'custom';

/**
 * URL'da sana UTC bo'yicha "YYYY-MM-DD" (nuqs parseAsIsoDate) saqlanadi — mahalliy yarim tunni
 * to'g'ridan-to'g'ri bersak, UTC+5 da bir kun oldinga siljiydi. Shu sababli kun satri orqali o'tkazamiz.
 */
const toParam = (d: Dayjs) => new Date(d.format('YYYY-MM-DD'));
const fromParam = (d: Date | null, fallback: Dayjs) => (d ? dayjs(d.toISOString().slice(0, 10)) : fallback);

const presetRange = (p: Exclude<Period, 'custom'>) => {
  const today = dayjs().startOf('day');
  if (p === 'day') return [today, today] as const;
  if (p === 'week') return [today.startOf('isoWeek'), today] as const;
  return [today.startOf('month'), today] as const;
};

export const ReportsPage = () => {
  const [p, setP] = useReportsParams();
  const user = useCurrentUser();
  const revenue = usePermission('report.revenue');
  const isDoctor = user?.role === 'DOCTOR';
  const sections = SECTIONS.filter((s) => revenue || s.key !== 'revenue');
  const type = p.type && sections.some((s) => s.key === p.type) ? p.type : sections[0]!.key;

  const from = fromParam(p.from, dayjs().startOf('month')).startOf('day');
  const to = fromParam(p.to, dayjs()).startOf('day');
  // shifokor faqat o'zini ko'radi (API ham cheklaydi); boshqalar shifokor bo'yicha filtrlay oladi
  const doctor = isDoctor ? null : p.doctor;
  const q: ReportQuery = { from: from.format('YYYY-MM-DD'), to: to.format('YYYY-MM-DD'), doctor };

  const [customOpen, setCustomOpen] = useState(false);
  const matched = (['day', 'week', 'month'] as const).find((k) => {
    const [a, b] = presetRange(k);
    return a.isSame(from, 'day') && b.isSame(to, 'day');
  });
  const period: Period = customOpen || !matched ? 'custom' : matched;

  const onPeriod = (v: Period) => {
    if (v === 'custom') return setCustomOpen(true);
    setCustomOpen(false);
    const [a, b] = presetRange(v);
    void setP({ from: toParam(a), to: toParam(b) });
  };

  const description = isDoctor
    ? 'Faqat o‘z ko‘rsatkichlaringiz (summalarsiz)'
    : revenue
      ? 'Shifokorlar, xizmatlar va tushum — tanlangan davr bo‘yicha'
      : 'Qabullar va xizmatlar soni — tushum summalari faqat rahbariyat uchun';

  const View = VIEWS[type];

  return (
    <>
      <PageHeader
        title="Hisobotlar"
        breadcrumb={[{ label: 'Bosh sahifa', to: '/' }, { label: 'Hisobotlar' }]}
        description={description}
        actions={
          <Button icon={<Printer size={18} strokeWidth={1.5} />} onClick={() => window.print()}>
            Chop etish
          </Button>
        }
      />

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented<Period>
            value={period}
            onChange={onPeriod}
            options={[
              { value: 'day', label: 'Bugun' },
              { value: 'week', label: 'Hafta' },
              { value: 'month', label: 'Oy' },
              { value: 'custom', label: 'Tanlangan davr' },
            ]}
            className="max-w-full"
          />
          {period === 'custom' ? (
            <DatePicker.RangePicker
              format="DD.MM.YYYY"
              allowClear={false}
              value={[from, to]}
              disabledDate={(d) => d.isAfter(dayjs(), 'day')}
              presets={[
                { label: 'O‘tgan oy', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
                { label: 'Oxirgi 30 kun', value: [dayjs().subtract(29, 'day'), dayjs()] },
                { label: 'Shu yil', value: [dayjs().startOf('year'), dayjs()] },
              ]}
              onChange={(r) => r && void setP({ from: toParam(r[0]!), to: toParam(r[1]!) })}
              className="w-full rounded-pill bg-surface hover:bg-surface sm:w-auto"
            />
          ) : (
            <span className="text-sm tabular-nums text-muted">
              {from.isSame(to, 'day') ? from.format('DD.MM.YYYY') : `${from.format('DD.MM')} – ${to.format('DD.MM.YYYY')}`}
            </span>
          )}
          {!isDoctor && (
            <DoctorSelect
              allowClear
              placeholder="Barcha shifokorlar"
              value={p.doctor}
              onChange={(d) => void setP({ doctor: d ?? null })}
              className="w-full sm:ml-auto sm:w-56"
            />
          )}
        </div>

        <ReportKpis q={q} revenue={revenue} />

        <Tabs
          activeKey={type}
          onChange={(k) => void setP({ type: k as ReportType })}
          items={sections.map((s) => ({ key: s.key, label: s.label }))}
          className="-mb-2"
        />
        <View q={q} />
        {type === 'inventory' && doctor && <p className="m-0 -mt-2 text-xs text-muted">Ombor hisoboti shifokor bo‘yicha filtrlanmaydi</p>}
      </div>
    </>
  );
};
