import { App, Button, Form, Input, InputNumber, Select, Skeleton, Switch, TimePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import { Plus, Trash2 } from '@/shared/icons';
import { useEffect, type ReactNode } from 'react';
import dayjs from '@/shared/lib/dayjs';
import { usePermission } from '@/shared/hooks/usePermission';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { useReminderRules, useSaveRules } from '../hooks/useReminders';
import type { ReminderRule, ReminderSettings, RulesPayload } from '../types';

type RuleValues = Omit<ReminderRule, 'time'> & { time?: Dayjs };
interface Values {
  rules: RuleValues[];
  window: [Dayjs, Dayjs];
  skipSunday: boolean;
  smsFallback: boolean;
  recallEnabled: boolean;
  recallMonths: number;
}

const hm = (v: string) => dayjs(v, 'HH:mm');

/** Qoida nima qilishini oddiy so'z bilan */
const describeRule = (r?: Partial<RuleValues>) => {
  if (!r) return '';
  if (r.isActive === false) return 'O‘chirilgan — bu qoida bo‘yicha qo‘ng‘iroq qilinmaydi.';
  const when =
    r.kind === 'DAY_BEFORE_AT'
      ? `Qabuldan bir kun oldin soat ${r.time ? r.time.format('HH:mm') : '…'} da bemorga avtomatik qo‘ng‘iroq qilinadi.`
      : `Qabuldan ${r.hours ?? '…'} soat oldin bemorga avtomatik qo‘ng‘iroq qilinadi.`;
  const retry =
    (r.retries ?? 0) > 0
      ? ` Javob bo‘lmasa, ${r.retryIntervalMin ?? '…'} daqiqadan keyin yana urinadi (ko‘pi bilan ${r.retries} marta).`
      : ' Javob bo‘lmasa, qayta urinmaydi — bemor “Javob bermadi” bo‘lib navbatda qoladi.';
  return when + retry;
};

/** Sozlamalar bo'limi: chapda sarlavha va izoh, o'ngda maydonlar */
const Section = ({ title, description, children }: { title: string; description: ReactNode; children: ReactNode }) => (
  <section className="grid gap-4 py-6 first:pt-2 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] md:gap-8">
    <div>
      <h4 className="m-0 text-base font-normal text-ink">{title}</h4>
      <p className="mb-0 mt-1 text-sm text-muted">{description}</p>
    </div>
    <div className="min-w-0">{children}</div>
  </section>
);

/** Yoqish/o'chirish qatori: matn chapda, Switch o'ngda */
const ToggleRow = ({ name, label, hint }: { name: keyof Values; label: string; hint: string }) => (
  <label className="flex cursor-pointer items-start justify-between gap-4">
    <span>
      <span className="block text-sm text-ink">{label}</span>
      <span className="block text-xs text-muted">{hint}</span>
    </span>
    <Form.Item name={name} valuePropName="checked" noStyle>
      <Switch />
    </Form.Item>
  </label>
);

export const RulesTab = () => {
  const { data, isLoading } = useReminderRules();
  const save = useSaveRules();
  const canEdit = usePermission('reminder.rules');
  const { message } = App.useApp();
  const [form] = Form.useForm<Values>();
  const rules = (Form.useWatch('rules', form) ?? []) as Partial<RuleValues>[];

  const fill = (d: RulesPayload) => {
    const s = d.settings;
    form.setFieldsValue({
      rules: d.rules.map((r) => ({ ...r, time: r.time ? hm(r.time) : undefined })),
      window: [hm(s.callWindowStart), hm(s.callWindowEnd)],
      skipSunday: s.skipSunday,
      smsFallback: s.smsFallback,
      recallEnabled: s.recallEnabled,
      recallMonths: s.recallMonths,
    });
  };

  useEffect(() => {
    if (data) fill(data);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- server ma'lumoti kelganda formani to'ldirish
  }, [data]);

  if (isLoading) return <Skeleton active />;

  const submit = (v: Values) => {
    const settings: ReminderSettings = {
      callWindowStart: v.window[0].format('HH:mm'),
      callWindowEnd: v.window[1].format('HH:mm'),
      skipSunday: v.skipSunday,
      smsFallback: v.smsFallback,
      recallEnabled: v.recallEnabled,
      recallMonths: v.recallMonths,
    };
    save.mutate(
      { rules: v.rules.map((r) => ({ ...r, id: r.id ?? '', time: r.time?.format('HH:mm'), hours: r.kind === 'BEFORE_HOURS' ? r.hours : undefined })), settings },
      { onSuccess: () => message.success('Qoidalar saqlandi'), onError: (e) => message.error(errorMessage(e)) },
    );
  };

  return (
    <Form form={form} layout="vertical" disabled={!canEdit} onFinish={submit} requiredMark={false} className="max-w-5xl">
      <div className="divide-y divide-subtle">
        <Section
          title="Eslatma qoidalari"
          description="Har bir qoida qabulga yozilgan bemorga qachon qo‘ng‘iroq qilinishini belgilaydi. Bir nechta qoida bo‘lsa, har biri alohida qo‘ng‘iroq qiladi."
        >
          <Form.List name="rules">
            {(fields, { add, remove }) => (
              <div className="flex flex-col gap-3">
                {fields.map((f) => {
                  const r = rules[f.name];
                  const kind = r?.kind;
                  return (
                    <div key={f.key} className="flex flex-col gap-4 rounded-md p-4 ring-1 ring-inset ring-line">
                      <div className="flex items-start gap-3">
                        <Form.Item name={[f.name, 'name']} rules={[{ required: true, whitespace: true, message: 'Qoida nomini kiriting' }]} className="mb-0 min-w-0 flex-1">
                          <Input placeholder="Qoida nomi, masalan: 24 soat oldin" aria-label="Qoida nomi" />
                        </Form.Item>
                        <Form.Item name={[f.name, 'isActive']} valuePropName="checked" className="mb-0 pt-2.5">
                          <Switch aria-label="Qoida faol" />
                        </Form.Item>
                        <Button type="text" shape="circle" aria-label="Qoidani o‘chirish" icon={<Trash2 size={18} strokeWidth={1.5} />} onClick={() => remove(f.name)} />
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 md:grid-cols-4">
                        <Form.Item name={[f.name, 'kind']} label="Qachon" className="col-span-2 mb-3 md:col-span-1 md:mb-0">
                          <Select options={[{ value: 'BEFORE_HOURS', label: 'Qabuldan X soat oldin' }, { value: 'DAY_BEFORE_AT', label: 'Oldingi kuni, soatda' }]} />
                        </Form.Item>
                        {kind === 'DAY_BEFORE_AT' ? (
                          <Form.Item name={[f.name, 'time']} label="Soat" rules={[{ required: true, message: 'Vaqtni kiriting' }]} className="col-span-2 mb-3 md:col-span-1 md:mb-0">
                            <TimePicker format="HH:mm" minuteStep={15} className="w-full" />
                          </Form.Item>
                        ) : (
                          <Form.Item name={[f.name, 'hours']} label="Necha soat oldin" rules={[{ required: true, message: 'Soatni kiriting' }]} className="col-span-2 mb-3 md:col-span-1 md:mb-0">
                            <InputNumber min={1} max={72} suffix="soat" className="w-full" />
                          </Form.Item>
                        )}
                        <Form.Item name={[f.name, 'retries']} label="Qayta urinish" className="mb-0">
                          <InputNumber min={0} max={3} suffix="marta" className="w-full" />
                        </Form.Item>
                        <Form.Item name={[f.name, 'retryIntervalMin']} label="Oraliq" className="mb-0">
                          <InputNumber min={5} max={240} step={5} suffix="daq" className="w-full" />
                        </Form.Item>
                      </div>
                      <p className="m-0 rounded-md bg-panel px-4 py-3 text-sm text-ink">{describeRule(r)}</p>
                    </div>
                  );
                })}
                {fields.length === 0 && <p className="m-0 text-sm text-muted">Qoida yo‘q — qabul oldidan avtomatik qo‘ng‘iroq qilinmaydi.</p>}
                <Button className="self-start" icon={<Plus size={18} strokeWidth={1.5} />} onClick={() => add({ name: '', kind: 'BEFORE_HOURS', hours: 3, retries: 1, retryIntervalMin: 15, isActive: true })}>
                  Qoida qo‘shish
                </Button>
              </div>
            )}
          </Form.List>
        </Section>

        <Section title="Qo‘ng‘iroq vaqti" description="Bemorlarni bezovta qilmaslik uchun avtomatik qo‘ng‘iroqlar faqat shu oraliqda bo‘ladi.">
          <Form.Item
            name="window"
            label="Ruxsat etilgan oraliq"
            extra="Oraliqdan tashqariga tushgan qo‘ng‘iroq keyingi ruxsat etilgan vaqtga suriladi"
            rules={[{ required: true, message: 'Oraliqni tanlang' }]}
          >
            <TimePicker.RangePicker format="HH:mm" minuteStep={30} className="w-full sm:w-72" />
          </Form.Item>
          <div className="flex flex-col gap-4">
            <ToggleRow name="skipSunday" label="Yakshanba kuni qo‘ng‘iroq qilinmasin" hint="Dam olish kuni bemorlarga avtomatik qo‘ng‘iroq bo‘lmaydi" />
            <ToggleRow name="smsFallback" label="Javob bo‘lmasa SMS yuborilsin" hint="Barcha urinishlardan keyin ham javob bo‘lmasa, bemorga SMS eslatma (keyingi bosqichda ulanadi)" />
          </div>
        </Section>

        <Section title="Profilaktik ko‘rik" description="Uzoq vaqt kelmagan bemorlarni ko‘rikka chaqirish uchun alohida qo‘ng‘iroq.">
          <div className="flex flex-col gap-4">
            <ToggleRow name="recallEnabled" label="Profilaktik ko‘rikka chaqirish" hint="O‘chirilsa, bunday qo‘ng‘iroqlar navbatga qo‘shilmaydi" />
            <div className="flex flex-wrap items-center gap-3 text-sm text-ink">
              <span>Oxirgi tashrifdan</span>
              <Form.Item name="recallMonths" className="mb-0" rules={[{ required: true, message: 'Kiriting' }]}>
                <InputNumber min={1} max={24} className="w-28" suffix="oy" aria-label="Oylar soni" />
              </Form.Item>
              <span>o‘tgan bemorlarga qo‘ng‘iroq qilinadi</span>
            </div>
          </div>
        </Section>
      </div>

      {canEdit && (
        <div className="mt-2 flex flex-wrap justify-end gap-2 border-t border-subtle pt-4">
          <Button onClick={() => data && fill(data)}>Qaytarish</Button>
          <Button type="primary" htmlType="submit" loading={save.isPending}>
            Saqlash
          </Button>
        </div>
      )}
    </Form>
  );
};
