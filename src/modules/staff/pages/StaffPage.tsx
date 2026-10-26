import { Button, Dropdown, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CalendarClock, CalendarOff, EllipsisVertical, Pencil, Plus, Users } from '@/shared/icons';
import { useState } from 'react';
import { parseAsBoolean, useQueryState } from 'nuqs';
import {
  CardSkeleton,
  Can,
  ColorDot,
  EmptyState,
  ErrorState,
  FilterBar,
  PageHeader,
  Panel,
  PhoneText,
  SearchInput,
  StatusTag,
  UserAvatar,
} from '@/shared/components/ui';
import { POSITIONS, positionLabel, WEEKDAYS } from '@/shared/constants/options';
import { ROLE_SHORT } from '@/shared/constants/roles';
import { useCurrentUser, usePermission } from '@/shared/hooks/usePermission';
import { formatDate } from '@/shared/utils/format';
import { isOnTimeOff } from '@/shared/utils/schedule';
import { cn } from '@/shared/utils/cn';
import { useUsers } from '@/modules/settings';
import { ScheduleModal } from '../components/ScheduleModal';
import { StaffFormDrawer } from '../components/StaffFormDrawer';
import { TimeOffModal } from '../components/TimeOffModal';
import { WeekSchedule } from '../components/WeekSchedule';
import { useStaffList } from '../hooks/useStaff';
import type { Staff, StaffPosition } from '../types';

/** Lavozim chipi: rahbariyat — qora, qolganlar — neytral */
const PositionChip = ({ position }: { position: StaffPosition }) => (
  <span
    className={cn(
      'inline-flex h-7.5 items-center whitespace-nowrap rounded-pill px-3 text-xs',
      position === 'OWNER' || position === 'ADMIN' ? 'bg-ink text-on-ink' : 'bg-subtle text-ink',
    )}
  >
    {positionLabel(position)}
  </span>
);

/** Ish kunlari: 7 ta kichik doira (ishlaydi — to'ldirilgan, dam — chiziqli) */
const WorkDays = ({ s }: { s: Staff }) =>
  s.schedule.length ? (
    <div className="flex gap-1" aria-label="Ish kunlari">
      {WEEKDAYS.map((w) => {
        const d = s.schedule.find((x) => x.weekday === w.value);
        return (
          <Tooltip key={w.value} title={d ? `${w.label}: ${d.start}–${d.end}` : `${w.label}: dam olish`}>
            <span
              className={cn(
                'grid size-7 place-items-center rounded-full text-xs',
                d ? 'bg-subtle text-ink' : 'text-muted ring-1 ring-inset ring-line',
              )}
            >
              {w.short}
            </span>
          </Tooltip>
        );
      })}
    </div>
  ) : (
    <span className="text-muted">—</span>
  );

export const StaffPage = () => {
  const { data: all = [], isLoading, isError, error, refetch } = useStaffList();
  // ?me=true — "Ish jadvalim": faqat joriy foydalanuvchining o'z ma'lumoti
  const [me] = useQueryState('me', parseAsBoolean.withDefault(false));
  const user = useCurrentUser();
  const mine = me ? all.filter((s) => s.id === user?.staffId) : all;
  const canManage = usePermission('staff.manage');
  const { data: users = [] } = useUsers(canManage);
  const [editing, setEditing] = useState<Staff | null | undefined>(undefined);
  const [schedule, setSchedule] = useState<Staff | null>(null);
  const [timeOff, setTimeOff] = useState<Staff | null>(null);
  const [position, setPosition] = useState<StaffPosition | null>(null);
  const [search, setSearch] = useState<string | null>(null);
  const [today] = useState(() => new Date().toISOString());

  const q = search?.toLowerCase() ?? '';
  const data = mine.filter((s) => (!position || s.position === position) && (!q || `${s.fullName} ${s.phone} ${s.specialty ?? ''}`.toLowerCase().includes(q)));
  const scheduled = mine.filter((s) => s.position === 'DOCTOR' || s.schedule.length > 0);
  const positions = POSITIONS.filter((p) => mine.some((s) => s.position === p.value));

  // modal ochiq bo'lsa ham yangilangan ma'lumotni ko'rsatish
  const fresh = (s: Staff | null) => (s ? (all.find((x) => x.id === s.id) ?? s) : null);

  const columns: ColumnsType<Staff> = [
    {
      title: 'Xodim',
      key: 'name',
      render: (_, s) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={s.fullName} color={s.color} size={36} />
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-2">
              <span className={cn('block max-w-56 truncate font-medium', !s.isActive && 'text-muted')} title={s.fullName}>
                {s.fullName}
              </span>
              {s.position === 'DOCTOR' && <ColorDot color={s.color} />}
            </div>
            <div className="mt-0.5 truncate text-xs text-muted">{s.specialty ?? positionLabel(s.position)}</div>
          </div>
        </div>
      ),
    },
    { title: 'Lavozim', dataIndex: 'position', responsive: ['sm'], render: (v: StaffPosition) => <PositionChip position={v} /> },
    { title: 'Telefon', dataIndex: 'phone', responsive: ['md'], render: (v: string) => <PhoneText phone={v} className="whitespace-nowrap" /> },
    { title: 'Ish kunlari', key: 'days', responsive: ['lg'], render: (_, s) => <WorkDays s={s} /> },
    {
      title: 'Holat',
      key: 'status',
      render: (_, s) => {
        const next = s.timeOff.find((t) => t.to >= today.slice(0, 10));
        return (
          <div className="flex flex-col items-start gap-1">
            {isOnTimeOff(s, today) ? (
              <StatusTag tone="warning">Ta’tilda</StatusTag>
            ) : (
              <StatusTag tone={s.isActive ? 'success' : 'neutral'}>{s.isActive ? 'Faol' : 'Nofaol'}</StatusTag>
            )}
            {next && !isOnTimeOff(s, today) && (
              <span className="whitespace-nowrap text-xs tabular-nums text-muted" title={next.reason}>
                Ta’til: {formatDate(next.from)} – {formatDate(next.to)}
              </span>
            )}
          </div>
        );
      },
    },
    ...(canManage
      ? [
          {
            title: 'Login',
            key: 'login',
            responsive: ['xl' as const],
            render: (_: unknown, s: Staff) => {
              const linked = users.find((u) => u.staffId === s.id);
              return linked ? (
                <span className="whitespace-nowrap text-sm">
                  {linked.username} <span className="text-xs text-muted">· {ROLE_SHORT[linked.role]}</span>
                </span>
              ) : (
                <span className="text-muted">—</span>
              );
            },
          },
          {
            key: 'a',
            width: 56,
            render: (_: unknown, s: Staff) => (
              <Dropdown
                trigger={['click']}
                menu={{
                  items: [
                    { key: 'edit', label: 'Tahrirlash', icon: <Pencil size={18} strokeWidth={1.5} />, onClick: () => setEditing(s) },
                    ...(s.position === 'DOCTOR'
                      ? [
                          { key: 'sch', label: 'Ish jadvali', icon: <CalendarClock size={18} strokeWidth={1.5} />, onClick: () => setSchedule(s) },
                          { key: 'off', label: 'Ta’til / kasallik', icon: <CalendarOff size={18} strokeWidth={1.5} />, onClick: () => setTimeOff(s) },
                        ]
                      : []),
                  ],
                }}
              >
                <Button shape="circle" aria-label={`${s.fullName}: amallar`} icon={<EllipsisVertical size={20} strokeWidth={1.5} />} />
              </Dropdown>
            ),
          },
        ]
      : []),
  ];

  const filtered = !!(position || search);

  return (
    <>
      <PageHeader
        title={me ? 'Ish jadvalim' : 'Xodimlar'}
        breadcrumb={[{ label: 'Bosh sahifa', to: '/' }, { label: 'Sozlamalar' }, { label: me ? 'Ish jadvalim' : 'Xodimlar' }]}
        description={me ? 'Joriy hafta ish vaqtingiz va ta’tillaringiz' : `Shifokorlar, ish jadvali va ta’tillar · ${all.length} ta xodim`}
        actions={
          !me && (
            <Can perm="staff.manage">
              <Button type="primary" icon={<Plus size={18} strokeWidth={1.5} />} onClick={() => setEditing(null)}>
                Yangi xodim
              </Button>
            </Can>
          )
        }
      />
      {isLoading ? (
        <CardSkeleton rows={6} />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !mine.length ? (
        <EmptyState
          icon={Users}
          title="Xodimlar yo‘q"
          description="Shifokor va registratorlarni qo‘shing — ular kalendar va qabullarda paydo bo‘ladi"
          action={
            <Can perm="staff.manage">
              <Button onClick={() => setEditing(null)}>Birinchi xodimni qo‘shish</Button>
            </Can>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {(!me || mine.length > 1) && (
            <Panel bodyClassName="p-3 md:p-4">
              {positions.length > 1 && (
                <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Lavozim">
                  {[null, ...positions.map((p) => p.value)].map((v) => {
                    const active = position === v;
                    return (
                      <button
                        key={v ?? 'all'}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setPosition(v)}
                        className={cn(
                          'inline-flex h-8 cursor-pointer items-center gap-2 rounded-pill border-0 px-3.5 text-xs transition-colors duration-150',
                          active ? 'bg-ink text-on-ink' : 'bg-subtle text-ink hover:bg-subtle-strong',
                        )}
                      >
                        {v ? positionLabel(v) : 'Barchasi'}
                        <span className={cn('tabular-nums', active ? 'text-on-dark-muted' : 'text-muted')}>
                          {mine.filter((s) => !v || s.position === v).length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              <FilterBar active={filtered} onReset={() => {
                  setPosition(null);
                  setSearch(null);
                }}>
                <SearchInput value={search} onChange={setSearch} placeholder="Ism, telefon yoki mutaxassislik" />
              </FilterBar>
              <Table
                rowKey="id"
                size="middle"
                columns={columns}
                dataSource={data}
                pagination={false}
                scroll={{ x: 'max-content' }}
                locale={{ emptyText: <EmptyState icon={Users} title="Xodim topilmadi" description="Qidiruv yoki lavozimni o‘zgartiring" /> }}
              />
            </Panel>
          )}
          {me && mine[0] && <MyCard s={mine[0]} />}
          {scheduled.length > 0 && (
            <Panel title="Haftalik jadval" bodyClassName="p-3 md:p-4">
              <WeekSchedule staff={scheduled} onEdit={canManage ? setSchedule : undefined} />
            </Panel>
          )}
        </div>
      )}
      <StaffFormDrawer open={editing !== undefined} staff={editing} onClose={() => setEditing(undefined)} />
      <ScheduleModal staff={fresh(schedule)} onClose={() => setSchedule(null)} />
      <TimeOffModal staff={fresh(timeOff)} onClose={() => setTimeOff(null)} />
    </>
  );
};

/** "Ish jadvalim": o'z kartasi — ism, lavozim, rejadagi ta'tillar */
const MyCard = ({ s }: { s: Staff }) => {
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const upcoming = s.timeOff.filter((t) => t.to >= today);
  return (
    <section className="flex flex-col gap-5 rounded-card bg-surface p-5 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <UserAvatar name={s.fullName} color={s.color} size={56} />
        <div className="min-w-0">
          <h3 className="m-0 text-2xl font-normal">{s.fullName}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PositionChip position={s.position} />
            {s.specialty && <span className="text-sm text-muted">{s.specialty}</span>}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1 text-sm md:items-end">
        <span className="text-xs text-muted">Rejadagi ta’tillar</span>
        {upcoming.length ? (
          upcoming.map((t) => (
            <span key={t.from} className="tabular-nums">
              {formatDate(t.from)} – {formatDate(t.to)} <span className="text-muted">· {t.reason}</span>
            </span>
          ))
        ) : (
          <span className="text-muted">Yo‘q</span>
        )}
      </div>
    </section>
  );
};
