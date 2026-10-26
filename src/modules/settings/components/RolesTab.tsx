import { App, Button, Skeleton, Switch } from 'antd';
import { useState } from 'react';
import { Building2, HeartPulse, Package, PhoneCall, RotateCcw, ShieldCheck, Stethoscope, UserCog, Wallet, type AppIcon } from '@/shared/icons';
import { Panel } from '@/shared/components/ui';
import {
  defaultMatrix,
  isFullAccess,
  PERMISSION_GROUPS,
  ROLE_LABELS,
  ROLES,
  type Permission,
  type PermissionMatrix,
  type Role,
} from '@/shared/constants/roles';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { cn } from '@/shared/utils/cn';
import { useRolePermissions, useSaveRolePermissions, useUsers } from '../hooks/useSettings';

const ROLE_ICON: Record<Role, AppIcon> = {
  OWNER: Building2,
  ADMIN: UserCog,
  DOCTOR: Stethoscope,
  ASSISTANT: HeartPulse,
  RECEPTIONIST: PhoneCall,
  CASHIER: Wallet,
  STOREKEEPER: Package,
};

const ROLE_HINT: Record<Role, string> = {
  OWNER: 'Barcha filiallar, moliya va sozlamalar',
  ADMIN: 'Filialdagi barcha ish jarayoni',
  DOCTOR: 'O‘z bemorlari, tish sxemasi va davolash rejasi',
  ASSISTANT: 'Shifokorga yordam: qabullar va ombordan chiqim',
  RECEPTIONIST: 'Qabulga yozish, bemorlar, to‘lov va eslatmalar',
  CASHIER: 'To‘lov qabul qilish va kassa hisobotlari',
  STOREKEEPER: 'Ombor: kirim, chiqim va inventarizatsiya',
};

const ALL_PERMS = PERMISSION_GROUPS.flatMap((g) => g.items.map((it) => it.key));

const has = (m: PermissionMatrix, p: Permission, r: Role) => isFullAccess(r) || m[p].includes(r);
const permCount = (m: PermissionMatrix, r: Role) => ALL_PERMS.filter((p) => has(m, p, r)).length;
/** Saqlanmagan farqlar (ruxsat × rol juftliklari) */
const diffOf = (a: PermissionMatrix, b: PermissionMatrix, r?: Role) =>
  (Object.keys(a) as Permission[]).reduce((n, p) => n + ROLES.filter((x) => (!r || x === r) && a[p].includes(x) !== b[p].includes(x)).length, 0);

/** Rollar va ruxsatlar: rolni tanlab, uning ruxsatlarini guruhlar bo'yicha yoqish/o'chirish. Egasi va boshqaruvchi — hamma ruxsat (qulflangan). */
export const RolesTab = () => {
  const { data } = useRolePermissions();
  const { data: users = [] } = useUsers();
  const save = useSaveRolePermissions();
  const { message, modal } = App.useApp();
  /** Saqlanmagan o'zgarishlar (null — serverdagi holat) */
  const [edited, setEdited] = useState<PermissionMatrix | null>(null);
  const [role, setRole] = useState<Role>('DOCTOR');

  if (!data)
    return (
      <div className="rounded-card bg-surface p-5">
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );

  const draft = edited ?? data;
  const changes = diffOf(draft, data);
  const locked = isFullAccess(role);

  const set = (perms: Permission[], on: boolean) => {
    const next = { ...draft };
    for (const p of perms) next[p] = on ? (next[p].includes(role) ? next[p] : [...next[p], role]) : next[p].filter((r) => r !== role);
    setEdited(next);
  };

  const submit = () =>
    save.mutate(draft, {
      onSuccess: () => {
        setEdited(null);
        message.success('Ruxsatlar saqlandi');
      },
      onError: (e) => message.error(errorMessage(e)),
    });

  const RoleIcon = ROLE_ICON[role];

  return (
    <>
      {/* Rollar qatori — tanlangan rol yagona lime karta; mobil'da gorizontal aylantiriladi */}
      <div role="group" aria-label="Rolni tanlang" className="flex snap-x gap-1.5 overflow-x-auto pb-1 xl:grid xl:grid-cols-7 xl:overflow-visible">
        {ROLES.map((r) => {
          const Icon = ROLE_ICON[r];
          const active = r === role;
          const n = users.filter((u) => u.role === r && u.isActive).length;
          const dirty = diffOf(draft, data, r) > 0;
          return (
            <button
              key={r}
              type="button"
              aria-pressed={active}
              onClick={() => setRole(r)}
              className={cn(
                'flex min-h-36 w-40 shrink-0 snap-start cursor-pointer flex-col justify-between gap-4 rounded-card border-0 p-4 text-left font-sans transition-[transform,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-[0.98] xl:w-auto',
                active ? 'bg-lime text-on-lime' : 'bg-surface text-ink ring-inset ring-line hover:ring-1',
              )}
            >
              <span className="flex w-full items-start justify-between gap-2">
                <span className={cn('grid size-10 place-items-center rounded-full', active ? 'bg-surface' : 'bg-subtle')} aria-hidden>
                  <Icon size={20} strokeWidth={1.5} />
                </span>
                {isFullAccess(r) ? (
                  <ShieldCheck size={18} strokeWidth={1.5} className="mt-1" aria-label="To‘liq ruxsat" />
                ) : (
                  dirty && (
                    <span className="mt-2 inline-flex items-center gap-1 text-xs">
                      <span className="size-1.5 rounded-full bg-warning" aria-hidden />
                      o‘zgardi
                    </span>
                  )
                )}
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-sm leading-tight">{ROLE_LABELS[r]}</span>
                <span className={cn('text-xs tabular-nums', active ? 'text-on-lime' : 'text-muted')}>
                  {n} xodim · {permCount(draft, r)}/{ALL_PERMS.length}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <Panel
        title={ROLE_LABELS[role]}
        extra={
          <span className="inline-flex h-7.5 items-center rounded-pill bg-subtle px-3 text-xs tabular-nums">
            {permCount(draft, role)} / {ALL_PERMS.length} ruxsat
          </span>
        }
        bodyClassName="flex flex-col gap-4 p-5 pt-3"
      >
        <p className="m-0 text-sm text-muted">{ROLE_HINT[role]}</p>

        {locked && (
          <div className="flex items-start gap-3 rounded-md bg-subtle p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface" aria-hidden>
              <RoleIcon size={20} strokeWidth={1.5} />
            </span>
            <p className="m-0 text-sm">
              {ROLE_LABELS[role]} har doim barcha ruxsatlarga ega — klinika tizimdan o‘zini bloklab qo‘ymasligi uchun. Bu rolning ruxsatlarini
              o‘zgartirib bo‘lmaydi; kimgadir kamroq huquq kerak bo‘lsa, unga boshqa rol bering.
            </p>
          </div>
        )}

        <div className="grid items-start gap-3 lg:grid-cols-2">
          {PERMISSION_GROUPS.map((g) => {
            const keys = g.items.map((it) => it.key);
            const on = keys.filter((p) => has(draft, p, role)).length;
            const all = on === keys.length;
            return (
              <section key={g.title} className="flex flex-col gap-1 rounded-sheet bg-panel p-2">
                <header className="flex items-center justify-between gap-2 py-1 pl-3 pr-1">
                  <h4 className="m-0 text-sm font-normal">
                    {g.title} <span className="ml-1 text-xs text-muted tabular-nums">{on}/{keys.length}</span>
                  </h4>
                  {!locked && (
                    <Button type="text" size="small" onClick={() => set(keys, !all)}>
                      {all ? 'Hech biri' : 'Hammasi'}
                    </Button>
                  )}
                </header>
                {g.items.map((it) => {
                  const id = `perm-${role}-${it.key}`;
                  const checked = has(draft, it.key, role);
                  const changed = !locked && checked !== data[it.key].includes(role);
                  return (
                    <label
                      key={it.key}
                      htmlFor={id}
                      className={cn('flex items-center justify-between gap-3 rounded-md bg-surface px-4 py-2.5', locked ? 'cursor-default' : 'cursor-pointer')}
                    >
                      <span className={cn('flex min-w-0 items-center gap-2 text-sm', !checked && 'text-muted')}>
                        {changed && (
                          <span className="size-1.5 shrink-0 rounded-full bg-warning" title="Saqlanmagan">
                            <span className="sr-only">Saqlanmagan:</span>
                          </span>
                        )}
                        {it.label}
                      </span>
                      <Switch id={id} size="small" checked={checked} disabled={locked} onChange={(v) => set([it.key], v)} />
                    </label>
                  );
                })}
              </section>
            );
          })}
        </div>
      </Panel>

      {/* Saqlash qatori: o'zgarish bo'lsa pastda suzib turadi */}
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 rounded-card bg-surface p-3 pl-5',
          changes > 0 && 'sticky bottom-2 z-10 shadow-float',
        )}
      >
        <span className="mr-auto flex items-center gap-2 text-sm">
          {changes > 0 ? (
            <>
              <span className="size-1.5 rounded-full bg-warning" aria-hidden />
              <span className="tabular-nums">{changes} ta o‘zgarish saqlanmagan</span>
            </>
          ) : (
            <span className="text-muted">Barcha o‘zgarishlar saqlangan</span>
          )}
        </span>
        <Button
          type="text"
          icon={<RotateCcw size={18} strokeWidth={1.5} />}
          onClick={() =>
            modal.confirm({
              title: 'Standart ruxsatlarga qaytarish',
              content: 'Barcha rollar ruxsatlari boshlang‘ich holatiga qaytadi. Saqlash tugmasini bosgandan keyin kuchga kiradi.',
              okText: 'Qaytarish',
              cancelText: 'Bekor qilish',
              onOk: () => setEdited(defaultMatrix()),
            })
          }
        >
          Standartga qaytarish
        </Button>
        <Button disabled={!changes} onClick={() => setEdited(null)}>
          Bekor qilish
        </Button>
        <Button type="primary" disabled={!changes} loading={save.isPending} onClick={submit}>
          Saqlash
        </Button>
      </div>
    </>
  );
};
