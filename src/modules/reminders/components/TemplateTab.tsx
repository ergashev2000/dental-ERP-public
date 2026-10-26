import { App, Button, Input, Segmented, Skeleton, Space } from 'antd';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { PhoneOutgoing, Volume2 } from '@/shared/icons';
import { useEffect, useRef, useState } from 'react';
import dayjs from '@/shared/lib/dayjs';
import { PhoneInput } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { useSaveTemplate, useTemplates, useTestCall } from '../hooks/useReminders';
import type { TemplateLang } from '../types';

const VARS = [
  { key: '{ism}', label: 'Bemor ismi' },
  { key: '{sana}', label: 'Qabul sanasi' },
  { key: '{vaqt}', label: 'Qabul vaqti' },
  { key: '{shifokor}', label: 'Shifokor' },
  { key: '{klinika}', label: 'Klinika nomi' },
  { key: '{manzil}', label: 'Manzil' },
] as const;

const KEYS = [
  { key: '1', label: 'Tasdiqlaydi — qabul tasdiqlanadi' },
  { key: '2', label: 'Bekor qiladi — qabul bekor bo‘ladi, sizga vazifa keladi' },
  { key: '3', label: 'Operatorni so‘raydi — sizga vazifa keladi, navbatda “Qo‘ng‘iroq kerak”da ko‘rinadi' },
];

const Heading = ({ title, hint }: { title: string; hint?: string }) => (
  <div className="mb-3">
    <div className="text-base text-ink">{title}</div>
    {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
  </div>
);

export const TemplateTab = () => {
  const { data, isLoading } = useTemplates();
  const save = useSaveTemplate();
  const test = useTestCall();
  const { message, modal } = App.useApp();
  const [lang, setLang] = useState<TemplateLang>('uz');
  const [text, setText] = useState('');
  const [phone, setPhone] = useState('');
  const ref = useRef<TextAreaRef>(null);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- server matnini tahrir maydoniga sinxronlash (til almashganda)
    if (data) setText(data.templates[lang]);
  }, [data, lang]);

  if (isLoading || !data) return <Skeleton active />;

  const sample: Record<string, string> = {
    '{ism}': 'Sardor',
    '{sana}': dayjs().add(1, 'day').format('DD.MM.YYYY'),
    '{vaqt}': '10:30',
    '{shifokor}': 'Aziz Rahimov',
    '{klinika}': data.clinic.name,
    '{manzil}': data.clinic.address,
  };
  const preview = VARS.reduce((t, v) => t.split(v.key).join(sample[v.key]), text);
  const changed = text !== data.templates[lang];

  const insert = (v: string) => {
    const el = ref.current?.resizableTextArea?.textArea;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const next = text.slice(0, start) + v + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + v.length, start + v.length);
    });
  };

  return (
    <div className="grid gap-8 pt-2 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-5">
        <p className="m-0 text-sm text-muted">
          Avtomatik qo‘ng‘iroqda bemorga shu matn o‘qib beriladi. Qavsdagi so‘zlar har bir bemor uchun o‘zining ma’lumoti bilan almashtiriladi.
        </p>
        <Segmented<TemplateLang> value={lang} onChange={setLang} options={[{ value: 'uz', label: 'O‘zbek' }, { value: 'ru', label: 'Rus' }]} className="self-start" />
        <div>
          <Heading title="O‘zgaruvchilar" hint="Bosing — kursor turgan joyga qo‘shiladi" />
          <div className="flex flex-wrap gap-2">
            {VARS.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => insert(v.key)}
                className="inline-flex h-7.5 cursor-pointer items-center gap-1.5 rounded-pill border-0 bg-subtle px-3 text-xs text-ink transition-colors duration-150 hover:bg-subtle-strong"
              >
                <span>{v.key}</span>
                <span className="text-muted">{v.label}</span>
              </button>
            ))}
          </div>
        </div>
        <Input.TextArea ref={ref} rows={7} value={text} onChange={(e) => setText(e.target.value)} maxLength={600} showCount aria-label="Shablon matni" />
        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="primary" loading={save.isPending} onClick={() => save.mutate({ lang, text }, { onSuccess: () => message.success('Shablon saqlandi'), onError: (e) => message.error(errorMessage(e)) })}>
            Saqlash
          </Button>
          <Button disabled={!changed} onClick={() => setText(data.templates[lang])}>
            Qaytarish
          </Button>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <div>
          <Heading title="Bemor shunday eshitadi" hint="Namunaviy bemor ma’lumoti bilan" />
          <div className="flex gap-3 rounded-md bg-panel p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink">
              <Volume2 size={20} strokeWidth={1.5} />
            </span>
            <p className="m-0 min-w-0 text-sm leading-6 text-ink">{preview}</p>
          </div>
        </div>
        <div>
          <Heading title="Bemor tugma bosib javob beradi" />
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {KEYS.map((k) => (
              <li key={k.key} className="flex items-center gap-3 text-sm text-ink">
                <span className="grid size-7.5 shrink-0 place-items-center rounded-full bg-subtle text-xs tabular-nums">{k.key}</span>
                {k.label}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Heading title="Test qo‘ng‘iroq" hint="O‘zingizning raqamingizga qo‘ng‘iroq qilib, matnni eshitib ko‘ring" />
          <Space.Compact className="w-full sm:max-w-md">
            <PhoneInput value={phone} onChange={setPhone} />
            <Button
              icon={<PhoneOutgoing size={18} strokeWidth={1.5} />}
              loading={test.isPending}
              onClick={() =>
                test.mutate(
                  { phone, lang },
                  {
                    onSuccess: (r) => (r.ok ? modal.success({ title: 'Test qo‘ng‘iroq', content: r.message }) : modal.warning({ title: 'Test qo‘ng‘iroq', content: r.message })),
                    onError: (e) => message.error(errorMessage(e)),
                  },
                )
              }
            >
              Qo‘ng‘iroq
            </Button>
          </Space.Compact>
        </div>
      </div>
    </div>
  );
};
