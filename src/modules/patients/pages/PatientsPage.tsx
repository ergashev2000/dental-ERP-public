import { Button, Checkbox, Select, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus, UserRound } from '@/shared/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  DoctorSelect,
  EmptyState,
  ErrorState,
  FilterBar,
  MoneyText,
  PageHeader,
  Panel,
  PhoneText,
  SearchInput,
  StatusTag,
  UserAvatar,
} from '@/shared/components/ui';
import { PATIENT_TAGS, tagLabel } from '@/shared/constants/options';
import { ROUTES } from '@/shared/constants/routes';
import { formatAge, formatDate, formatRelativeDay, genderLabel, shortName } from '@/shared/utils/format';
import { PatientFormDrawer } from '../components/PatientFormDrawer';
import { usePatients, usePatientsParams } from '../hooks/usePatients';
import type { PatientRow } from '../types';

const SORTS = [
  { value: '-createdAt', label: 'Yangi qo‘shilganlar' },
  { value: 'name', label: 'Ism bo‘yicha' },
  { value: '-lastVisit', label: 'Oxirgi tashrif' },
  { value: '-debt', label: 'Qarzdorlik' },
] as const;

export const PatientsPage = () => {
  const navigate = useNavigate();
  const [p, setP] = usePatientsParams();
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isFetching, isError, error, refetch } = usePatients({
    q: p.q,
    tag: p.tag,
    hasDebt: p.hasDebt,
    doctor: p.doctor,
    sort: p.sort,
    page: p.page,
    pageSize: 10,
  });
  // filtr o'zgarganda sahifa 1 ga qaytadi
  const setFilter = (patch: Partial<typeof p>) => void setP({ ...patch, page: 1 });
  const active = !!(p.q || p.tag || p.hasDebt || p.doctor);
  const resetFilters = () => setFilter({ q: null, tag: null, hasDebt: null, doctor: null });

  const columns: ColumnsType<PatientRow> = [
    { title: 'Karta №', dataIndex: 'cardNo', width: 110, render: (v: string) => <span className="font-medium tabular-nums text-muted">{v}</span> },
    {
      title: 'F.I.O.',
      key: 'name',
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={`${r.lastName} ${r.firstName}`} size={32} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium text-ink">{shortName(r)}</span>
              {/* "Teglar" ustuni lg'dan boshlab ko'rinadi — undan kichikda breket belgisini ism yonida ko'rsatamiz (takrorlanmasin) */}
              {r.tags.includes('ORTHO') && (
                <span className="lg:hidden">
                  <StatusTag tone="neutral" dot={false}>
                    Breket
                  </StatusTag>
                </span>
              )}
            </div>
            {r.middleName && <div className="truncate text-xs text-muted">{r.middleName}</div>}
          </div>
        </div>
      ),
    },
    { title: 'Telefon', dataIndex: 'phone', render: (v: string) => <PhoneText phone={v} /> },
    { title: 'Yosh / jins', key: 'age', responsive: ['md'], render: (_, r) => (r.birthDate ? [formatAge(r.birthDate), genderLabel(r.gender, true)].filter(Boolean).join(' · ') : '—') },
    { title: 'Oxirgi tashrif', dataIndex: 'lastVisit', responsive: ['lg'], render: (v?: string) => formatDate(v) },
    { title: 'Keyingi qabul', dataIndex: 'nextAppointment', responsive: ['xl'], render: (v?: string) => (v ? formatRelativeDay(v) : <span className="text-muted">—</span>) },
    { title: 'Qarzdorlik', dataIndex: 'debt', align: 'right', render: (v: number) => (v > 0 ? <MoneyText value={v} debt strong /> : <span className="text-muted">—</span>) },
    {
      title: 'Teglar',
      dataIndex: 'tags',
      responsive: ['lg'],
      render: (tags: string[]) =>
        tags.length ? (
          <div className="flex gap-1">
            {tags.map((t) => (
              <span key={t} className="inline-flex h-6 items-center whitespace-nowrap rounded-pill bg-subtle px-2.5 text-xs text-ink">
                {tagLabel(t)}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Bemorlar"
        breadcrumb={[{ label: 'Bosh sahifa', to: '/' }, { label: 'Bemorlar' }]}
        description={data ? `Jami ${data.total} ta bemor` : ' '}
        actions={
          <Button type="primary" icon={<Plus size={20} strokeWidth={1.5} />} onClick={() => setCreating(true)}>
            Yangi bemor
          </Button>
        }
      />
      <Panel className="flex-1" bodyClassName="p-3 md:p-4">
        <FilterBar active={active} onReset={resetFilters}>
          <SearchInput value={p.q} onChange={(q) => setFilter({ q })} placeholder="Ism, telefon yoki karta №" />
          <Select
            allowClear
            placeholder="Teg"
            value={p.tag ?? undefined}
            onChange={(tag?: string) => setFilter({ tag: tag ?? null })}
            options={PATIENT_TAGS.map((t) => ({ value: t.value, label: t.label }))}
            className="min-w-0 flex-1 sm:w-36 sm:flex-none"
          />
          <DoctorSelect
            allowClear
            placeholder="Shifokor"
            value={p.doctor}
            onChange={(doctor) => setFilter({ doctor: doctor ?? null })}
            className="min-w-0 flex-1 sm:w-52 sm:flex-none"
          />
          <Checkbox checked={!!p.hasDebt} onChange={(e) => setFilter({ hasDebt: e.target.checked || null })}>
            Faqat qarzdorlar
          </Checkbox>
          <Select value={p.sort} onChange={(sort) => void setP({ sort })} options={[...SORTS]} className="w-full sm:ml-auto sm:w-48" aria-label="Saralash" />
        </FilterBar>
        {isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : (
          <Table
            rowKey="id"
            size="middle"
            loading={isLoading || isFetching}
            columns={columns}
            dataSource={data?.items}
            scroll={{ x: 720 }}
            onRow={(r) => ({ onClick: () => navigate(ROUTES.patient(r.id)), className: 'cursor-pointer' })}
            pagination={{
              current: p.page,
              pageSize: 10,
              total: data?.total,
              showSizeChanger: false,
              onChange: (page) => void setP({ page }),
              showTotal: (t) => `${t} ta`,
            }}
            locale={{
              emptyText: (
                <EmptyState
                  icon={UserRound}
                  title={active ? 'Filtr bo‘yicha bemor topilmadi' : 'Hali bemor yo‘q'}
                  description={active ? 'Qidiruv so‘zini yoki filtrlarni o‘zgartirib ko‘ring' : 'Birinchi bemorni qo‘shing — karta raqami avtomatik beriladi'}
                  action={
                    active ? (
                      <Button onClick={resetFilters}>Filtrlarni tozalash</Button>
                    ) : (
                      <Button onClick={() => setCreating(true)}>Birinchi bemorni qo‘shish</Button>
                    )
                  }
                />
              ),
            }}
          />
        )}
      </Panel>
      <PatientFormDrawer open={creating} onClose={() => setCreating(false)} onSaved={(pt) => navigate(ROUTES.patient(pt.id))} />
    </>
  );
};
