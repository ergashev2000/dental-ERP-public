import { App, Button, Drawer, Form, Input, Select, Switch, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { KeyRound, Pencil, Plus, ShieldCheck, UserRoundCog } from '@/shared/icons';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { EmptyState, Panel, SearchInput, StatusTag, UserAvatar } from '@/shared/components/ui';
import { isFullAccess, PERMISSION_GROUPS, ROLE_LABELS, ROLES, usePermissionMatrix, type Role } from '@/shared/constants/roles';
import { useCurrentUser } from '@/shared/hooks/usePermission';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { errorMessage, matches } from '@/shared/lib/mock/mockRequest';
import { cn } from '@/shared/utils/cn';
import { useStaffList } from '@/modules/staff';
import { useResetPassword, useSaveUser, useUsers } from '../hooks/useSettings';
import type { UserInput, UserView } from '../types';

const TOTAL_PERMS = PERMISSION_GROUPS.reduce((n, g) => n + g.items.length, 0);

/** Rol chipi: to'liq ruxsatli rollar — qora (ajralib tursin), qolganlari — neytral */
const RoleChip =({ role, className }: { role: Role; className?: string }) => (
  <span
    className={cn(
      'inline-flex h-7.5 items-center gap-1.5 whitespace-nowrap rounded-pill px-3 text-xs',
      isFullAccess(role) ? 'bg-ink text-on-ink' : 'bg-subtle text-ink',
      className,
    )}
  >
    {isFullAccess(role) && <ShieldCheck size={14} strokeWidth={1.5} aria-hidden />}
    {ROLE_LABELS[role]}
  </span>
);

/** Drawer ichidagi guruh sarlavhasi */
const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <fieldset className="m-0 flex min-w-0 flex-col border-0 p-0">
    <legend className="mb-3 p-0 text-base text-ink">{title}</legend>
    {children}
  </fieldset>
);

export const UsersTab = () => {
  const { data = [], isLoading } = useUsers();
  const { data: staff = [] } = useStaffList();
  const me = useCurrentUser();
  const matrix = usePermissionMatrix((s) => s.matrix);
  const save = useSaveUser();
  const reset = useResetPassword();
  const { message, modal } = App.useApp();
  const isMobile = useIsMobile();
  const [editing, setEditing] = useState<UserView | null | undefined>(undefined);
  const [q, setQ] = useState<string | null>(null);
  const [role, setRole] = useState<Role | 'ALL'>('ALL');
  const [form] = Form.useForm<UserInput>();
  const formRole = Form.useWatch('role', form);

  useEffect(() => {
    if (editing !== undefined) form.setFieldsValue(editing ?? { username: '', role: 'RECEPTIONIST', staffId: undefined, isActive: true, password: '' });
  }, [editing, form]);

  const colorOf = useMemo(() => new Map(staff.map((s) => [s.id, s.color])), [staff]);
  const rows = useMemo(() => data.filter((u) => (role === 'ALL' || u.role === role) && matches(q, u.username, u.staffName)), [data, q, role]);

  const permCount = (r: Role) => (isFullAccess(r) ? TOTAL_PERMS : PERMISSION_GROUPS.flatMap((g) => g.items).filter((it) => matrix[it.key].includes(r)).length);

  const resetPassword = (r: UserView) =>
    modal.confirm({
      title: `${r.username} parolini tiklash`,
      content: 'Vaqtinchalik parol yaratiladi. Uni foydalanuvchiga bering — keyin o‘zi o‘zgartiradi.',
      okText: 'Tiklash',
      cancelText: 'Bekor qilish',
      onOk: () =>
        reset.mutateAsync(r.id).then(
          (res) =>
            void modal.success({
              title: 'Vaqtinchalik parol',
              content: (
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-muted">{r.username} uchun yangi parol:</span>
                  <span className="rounded-md bg-subtle px-4 py-3 text-center text-3xl font-normal tracking-[0.2em] tabular-nums">{res.tempPassword}</span>
                </div>
              ),
            }),
          (e) => message.error(errorMessage(e)),
        ),
    });

  const columns: ColumnsType<UserView> = [
    {
      title: 'Foydalanuvchi',
      dataIndex: 'username',
      render: (v: string, r) => (
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar name={r.staffName} color={colorOf.get(r.staffId)} size={36} />
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-2">
              <span className="block max-w-56 truncate font-medium" title={r.staffName}>
                {r.staffName}
              </span>
              {me?.id === r.id && <span className="inline-flex h-5 items-center rounded-pill bg-subtle px-2 text-xs">siz</span>}
            </div>
            <div className="truncate text-xs text-muted">
              {v}
              <span className="md:hidden"> · {ROLE_LABELS[r.role]}</span>
              {!r.isActive && <span className="sm:hidden"> · nofaol</span>}
            </div>
          </div>
        </div>
      ),
    },
    { title: 'Rol', dataIndex: 'role', responsive: ['md'], render: (v: Role) => <RoleChip role={v} /> },
    {
      title: 'Holat',
      dataIndex: 'isActive',
      responsive: ['sm'],
      render: (v: boolean) => <StatusTag tone={v ? 'success' : 'neutral'}>{v ? 'Faol' : 'Nofaol'}</StatusTag>,
    },
    {
      key: 'a',
      width: 96,
      align: 'right',
      render: (_, r) => (
        <div className="flex justify-end gap-1">
          <Button type="text" shape="circle" aria-label="Tahrirlash" title="Tahrirlash" icon={<Pencil size={18} strokeWidth={1.5} />} onClick={() => setEditing(r)} />
          <Button
            type="text"
            shape="circle"
            aria-label="Parolni tiklash"
            title="Parolni tiklash"
            icon={<KeyRound size={18} strokeWidth={1.5} />}
            onClick={() => resetPassword(r)}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Panel className="flex-1"
        title="Tizim foydalanuvchilari"
        extra={
          <Button type="primary" icon={<Plus size={18} strokeWidth={1.5} />} onClick={() => setEditing(null)}>
            Yangi foydalanuvchi
          </Button>
        }
        bodyClassName="px-3 pb-4 pt-4 md:px-4"
      >
        <div className="mb-3 flex flex-wrap items-center gap-2 px-2 md:px-1">
          <SearchInput value={q} onChange={setQ} placeholder="Login yoki ism" className="w-full sm:w-64!" />
          <Select<Role | 'ALL'>
            value={role}
            onChange={setRole}
            className="w-full sm:w-56"
            aria-label="Rol bo‘yicha filtr"
            options={[{ value: 'ALL', label: 'Barcha rollar' }, ...ROLES.map((r) => ({ value: r, label: `${ROLE_LABELS[r]} · ${data.filter((u) => u.role === r).length}` }))]}
          />
          <span className="ml-auto text-xs text-muted tabular-nums">
            {rows.length} / {data.length} ta
          </span>
        </div>
        <Table
          rowKey="id"
          size="middle"
          loading={isLoading}
          dataSource={rows}
          columns={columns}
          pagination={false}
          rowClassName={(r) => (r.isActive ? '' : 'opacity-60')}
          locale={{ emptyText: <EmptyState compact icon={UserRoundCog} title="Foydalanuvchi topilmadi" description="Qidiruv yoki rol filtrini o‘zgartiring" /> }}
        />
      </Panel>

      <Drawer
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        width={isMobile ? '100%' : 460}
        title={editing ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi'}
        destroyOnHidden
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setEditing(undefined)}>Bekor qilish</Button>
            <Button type="primary" loading={save.isPending} onClick={() => form.submit()}>
              Saqlash
            </Button>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className="flex flex-col gap-6"
          onFinish={(input) =>
            save.mutate(
              { id: editing?.id, input },
              {
                onSuccess: () => {
                  message.success('Saqlandi');
                  setEditing(undefined);
                },
                onError: (e) => message.error(errorMessage(e)),
              },
            )
          }
        >
          <Group title="Kirish ma’lumotlari">
            <Form.Item
              name="username"
              label="Login"
              extra="Lotin harf, raqam, nuqta yoki chiziqcha — masalan, dr.aziz"
              rules={[{ required: true, message: 'Loginni kiriting' }, { pattern: /^[a-z0-9._-]{3,}$/i, message: 'Kamida 3 ta lotin harf/raqam' }]}
            >
              <Input autoComplete="off" />
            </Form.Item>
            {editing ? (
              <p className="m-0 text-xs text-muted">Parolni jadvaldagi kalit tugmasi orqali tiklash mumkin.</p>
            ) : (
              <Form.Item name="password" label="Parol" className="mb-0" rules={[{ required: true, message: 'Parolni kiriting' }, { min: 6, message: 'Kamida 6 ta belgi' }]}>
                <Input.Password autoComplete="new-password" />
              </Form.Item>
            )}
          </Group>

          <Group title="Rol va xodim">
            <Form.Item
              name="role"
              label="Rol"
              rules={[{ required: true, message: 'Rolni tanlang' }]}
              extra={
                formRole &&
                (isFullAccess(formRole)
                  ? 'Barcha bo‘limlarga to‘liq ruxsat'
                  : `${permCount(formRole)} / ${TOTAL_PERMS} ruxsat · “Rollar va ruxsatlar” sahifasida o‘zgartiriladi`)
              }
            >
              <Select options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} />
            </Form.Item>
            <Form.Item name="staffId" label="Bog‘langan xodim" className="mb-0" rules={[{ required: true, message: 'Xodimni tanlang' }]}>
              <Select showSearch optionFilterProp="label" placeholder="Xodimni tanlang" options={staff.map((s) => ({ value: s.id, label: s.fullName }))} />
            </Form.Item>
          </Group>

          <Group title="Holat">
            <label htmlFor="user-active" className="flex cursor-pointer items-center justify-between gap-4 rounded-md bg-subtle px-4 py-3">
              <span className="leading-tight">
                <span className="block text-sm">Faol</span>
                <span className="block text-xs text-muted">Nofaol foydalanuvchi tizimga kira olmaydi</span>
              </span>
              <Form.Item name="isActive" valuePropName="checked" noStyle>
                <Switch id="user-active" />
              </Form.Item>
            </label>
          </Group>
        </Form>
      </Drawer>
    </>
  );
};
