import { Dropdown } from 'antd';
import { ChevronDown, LogOut, UserCog } from '@/shared/icons';
import { useNavigate } from 'react-router';
import { ROLE_SHORT } from '@/shared/constants/roles';
import { useSession } from '@/shared/hooks/usePermission';
import { useDoctors } from '@/modules/staff';
import { useIsMobile, useIsTablet } from '@/shared/hooks/useMediaQuery';
import { queryClient } from '@/shared/lib/react-query';
import { useAuthStore } from '@/modules/auth';
import { UserAvatar } from '../ui/UserAvatar';

/** Header'dagi foydalanuvchi bloki: avatar, ism, rol va "Chiqish" */
export const UserMenu = () => {
  const session = useSession();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const compact = isMobile || isTablet;
  // "Ish jadvalim" faqat jadvali bor xodimlar (shifokorlar) uchun
  const { data: doctors = [] } = useDoctors();
  const hasSchedule = doctors.some((d) => d.id === session?.user.staffId && d.schedule.length > 0);
  if (!session) return null;

  const signOut = () => {
    logout();
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      menu={{
        items: [
          {
            key: 'me',
            disabled: true,
            label: (
              <div className="py-1 leading-tight">
                <div className="font-semibold text-ink">{session.staffName}</div>
                <div className="text-xs text-muted">
                  {session.user.username} · {ROLE_SHORT[session.user.role]}
                </div>
              </div>
            ),
          },
          { type: 'divider' },
          ...(hasSchedule ? [{ key: 'staff', icon: <UserCog size={16} strokeWidth={1.75} />, label: 'Ish jadvalim', onClick: () => navigate('/settings/staff?me=true') }] : []),
          { key: 'logout', danger: true, icon: <LogOut size={16} strokeWidth={1.75} />, label: 'Chiqish', onClick: signOut },
        ],
      }}
    >
      <button
        type="button"
        aria-label="Foydalanuvchi menyusi"
        className="flex h-12 cursor-pointer items-center gap-2.5 rounded-pill border-0 bg-surface p-1 font-sans transition-colors duration-150 hover:bg-subtle md:pr-3"
      >
        <UserAvatar name={session.staffName} size={40} />
        {!compact && (
          <span className="text-left leading-tight">
            <span className="block max-w-[160px] truncate text-sm text-ink">{session.staffName}</span>
            <span className="block text-xs text-muted">{ROLE_SHORT[session.user.role]}</span>
          </span>
        )}
        {!compact && <ChevronDown size={16} strokeWidth={1.5} className="text-muted" />}
      </button>
    </Dropdown>
  );
};
