import { App, Button, Form, Input, Skeleton, Switch } from 'antd';
import { DoorClosed, DoorOpen, Plus } from '@/shared/icons';
import { EmptyState, StatusTag } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { cn } from '@/shared/utils/cn';
import { useChairs, useSaveChair } from '../hooks/useSettings';
import type { Chair } from '../types';
import { SettingsSection } from './SettingsSection';

/** Bitta kabinet qatori: nomi joyida tahrirlanadi (fokusdan chiqqanda saqlanadi), o'ngda faollik */
const ChairRow = ({ chair, onSave }: { chair: Chair; onSave: (c: Chair) => void }) => {
  const Icon = chair.isActive ? DoorOpen : DoorClosed;
  return (
    <li className={cn('flex items-center gap-3 rounded-card bg-surface py-2 pl-2 pr-4', !chair.isActive && 'text-muted')}>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-subtle" aria-hidden>
        <Icon size={20} strokeWidth={1.5} />
      </span>
      <Input
        key={chair.name}
        defaultValue={chair.name}
        variant="borderless"
        aria-label="Kabinet nomi"
        className="min-w-0 flex-1 px-1"
        onPressEnter={(e) => e.currentTarget.blur()}
        onBlur={(e) => {
          const name = e.target.value.trim();
          if (name && name !== chair.name) onSave({ ...chair, name });
          else e.target.value = chair.name;
        }}
      />
      <StatusTag tone={chair.isActive ? 'success' : 'neutral'} className="hidden sm:inline-flex">
        {chair.isActive ? 'Faol' : 'Nofaol'}
      </StatusTag>
      <Switch size="small" aria-label={`${chair.name}: faol`} checked={chair.isActive} onChange={(isActive) => onSave({ ...chair, isActive })} />
    </li>
  );
};

export const ChairsTab = () => {
  const { data = [], isLoading } = useChairs();
  const save = useSaveChair();
  // Qo'shish alohida — qator saqlanayotganda "Qo'shish" tugmasi aylanmasin
  const add = useSaveChair();
  const { message } = App.useApp();
  const [form] = Form.useForm<{ name: string }>();
  const active = data.filter((c) => c.isActive).length;

  const update = (c: Chair) => save.mutate(c, { onError: (e) => message.error(errorMessage(e)) });

  return (
    <SettingsSection
      title="Kabinetlar"
      description="Har bir kabinet (kreslo) qabullar kalendarida alohida ustun bo‘ladi. Nofaol kabinet kalendarda ko‘rinmaydi va unga yangi qabul yozilmaydi. Nomini o‘zgartirish uchun ustiga bosing."
      extra={
        data.length > 0 && (
          <span className="inline-flex h-7.5 shrink-0 items-center rounded-pill bg-subtle px-3 text-xs tabular-nums">
            {active} / {data.length} faol
          </span>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <Form
          form={form}
          requiredMark={false}
          className="flex flex-col gap-2 sm:flex-row sm:items-start"
          onFinish={(v) =>
            add.mutate(
              { name: v.name.trim(), isActive: true },
              {
                onSuccess: () => {
                  message.success('Kabinet qo‘shildi');
                  form.resetFields();
                },
                onError: (e) => message.error(errorMessage(e)),
              },
            )
          }
        >
          <Form.Item name="name" rules={[{ required: true, whitespace: true, message: 'Nomini kiriting' }]} className="mb-0 min-w-0 flex-1">
            <Input placeholder="Yangi kabinet, masalan: 4-kabinet" aria-label="Yangi kabinet nomi" maxLength={60} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={add.isPending} icon={<Plus size={18} strokeWidth={1.5} />}>
            Qo‘shish
          </Button>
        </Form>

        {isLoading ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : data.length === 0 ? (
          <EmptyState compact icon={DoorClosed} title="Kabinetlar hali yo‘q" description="Yuqoridagi maydonga birinchi kabinet nomini yozing" />
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1.5 rounded-sheet bg-panel p-2">
            {data.map((c) => (
              <ChairRow key={c.id} chair={c} onSave={update} />
            ))}
          </ul>
        )}
      </div>
    </SettingsSection>
  );
};
