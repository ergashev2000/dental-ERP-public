import { Dropdown } from 'antd';
import { Check, ChevronDown } from '@/shared/icons';
import { usePermission } from '@/shared/hooks/usePermission';
import { useBranches } from '../hooks/useBranches';
import { useBranchStore } from '../store/branchStore';

const ALL = 'all';

/**
 * Sidebar'dagi filial nomi va tanlagich (TZ 2-bo'lim: ruxsat filial bo'yicha cheklanadi).
 * Egasi barcha filiallarni ko'radi va almashtiradi; qolganlar faqat o'z filialini ko'radi.
 * Qora sidebar ustida — on-dark ranglar.
 */
export const BranchSwitcher = () => {
  const { data: branches = [] } = useBranches();
  const canAll = usePermission('branch.manage');
  const branchId = useBranchStore((s) => s.branchId);
  const setBranch = useBranchStore((s) => s.setBranch);
  const active = branches.filter((b) => b.isActive);
  const current = branchId === null && canAll ? null : (active.find((b) => b.id === branchId) ?? active.at(0));
  const label = current ? current.name : 'Barcha filiallar';

  if (!canAll || active.length < 2) return <div className="truncate text-xs text-on-dark-muted">{label}</div>;

  return (
    <Dropdown
      trigger={['click']}
      menu={{
        selectedKeys: [current?.id ?? ALL],
        onClick: ({ key }) => setBranch(key === ALL ? null : key),
        items: [
          { key: ALL, label: 'Barcha filiallar', icon: current ? undefined : <Check size={16} strokeWidth={1.5} /> },
          { type: 'divider' },
          ...active.map((b) => ({ key: b.id, label: b.name, icon: current?.id === b.id ? <Check size={16} strokeWidth={1.5} /> : undefined })),
        ],
      }}
    >
      <button
        type="button"
        aria-label={`Filial: ${label}`}
        className="flex max-w-full cursor-pointer items-center gap-1 bg-transparent p-0 text-xs text-on-dark-muted transition-colors duration-150 hover:text-on-dark"
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={14} strokeWidth={1.5} className="shrink-0" />
      </button>
    </Dropdown>
  );
};
