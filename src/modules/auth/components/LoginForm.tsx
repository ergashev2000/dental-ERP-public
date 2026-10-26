import { Alert, Button, Checkbox, Form, Input } from 'antd';
import { useState } from 'react';
import { ArrowRight, KeyRound, UserRound } from '@/shared/icons';
import { ROLE_LABELS, ROLE_SHORT, type Role } from '@/shared/constants/roles';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { cn } from '@/shared/utils/cn';
import { useLogin } from '../hooks/useLogin';
import type { LoginPayload } from '../types';

const DEMO: { login: string; role: Role; name: string }[] = [
  { login: 'owner', role: 'OWNER', name: 'Bahrom Qodirov' },
  { login: 'admin', role: 'ADMIN', name: 'Dilshod Ergashev' },
  { login: 'dr.aziz', role: 'DOCTOR', name: 'Aziz Rahimov' },
  { login: 'assistant', role: 'ASSISTANT', name: 'Malika Usmonova' },
  { login: 'reception', role: 'RECEPTIONIST', name: 'Gulnora Saidova' },
  { login: 'kassa', role: 'CASHIER', name: 'Sardor Yusupov' },
  { login: 'ombor', role: 'STOREKEEPER', name: 'Rustam Karimov' },
];

const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

const fieldIcon = { size: 20, strokeWidth: 1.5, className: 'text-muted' };

export const LoginForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [form] = Form.useForm<LoginPayload>();
  const login = useLogin();
  /** Oxirgi tanlangan demo akkaunt (login) */
  const [picked, setPicked] = useState<string | null>(null);
  const pickedDemo = DEMO.find((d) => d.login === picked);

  return (
    <div className="w-full">
      <h2 className="m-0 font-display text-[40px] font-normal leading-[1.02] tracking-[-0.035em]">
        Xush kelibsiz
        <br />
        <span className="text-muted">tizimga kiring</span>
      </h2>
      <p className="mb-8 mt-3 text-sm text-muted">Login (yoki telefon) va parolingizni kiriting</p>

      {login.isError && <Alert type="error" showIcon className="mb-5" message={errorMessage(login.error)} />}

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{ remember: true }}
        onValuesChange={(c: Partial<LoginPayload>) => c.login !== undefined && c.login !== picked && setPicked(null)}
        onFinish={(v) => login.mutate(v, { onSuccess })}
      >
        <Form.Item name="login" label="Login yoki telefon" rules={[{ required: true, message: 'Loginni kiriting' }]}>
          <Input size="large" autoFocus autoComplete="username" prefix={<UserRound {...fieldIcon} />} />
        </Form.Item>
        <Form.Item
          name="password"
          label="Parol"
          rules={[
            { required: true, message: 'Parolni kiriting' },
            { min: 6, message: 'Parol kamida 6 ta belgi' },
          ]}
        >
          <Input.Password size="large" autoComplete="current-password" prefix={<KeyRound {...fieldIcon} />} />
        </Form.Item>
        <Form.Item name="remember" valuePropName="checked" className="mb-6 pl-1">
          <Checkbox>Eslab qolish</Checkbox>
        </Form.Item>
        <Button
          type="primary"
          size="large"
          htmlType="submit"
          block
          loading={login.isPending}
          icon={<ArrowRight size={18} strokeWidth={1.5} />}
          iconPosition="end"
          className="btn-lime"
        >
          Kirish
        </Button>
      </Form>

      {/* Demo akkauntlar — ixcham: rol chiplari; bosilganda login va parol to'ldiriladi */}
      <section className="mt-8 rounded-sheet bg-panel p-4" aria-labelledby="demo-title">
        <div className="mb-3 flex items-center justify-between gap-3 pl-1">
          <h3 id="demo-title" className="m-0 text-sm font-normal">
            Demo akkauntlar
          </h3>
          <span className="inline-flex h-7.5 items-center rounded-pill bg-surface px-3 text-xs tabular-nums">parol 123456</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {DEMO.map((d) => {
            const active = picked === d.login;
            return (
              <button
                key={d.login}
                type="button"
                aria-pressed={active}
                title={`${d.name} · ${d.login}`}
                onClick={() => {
                  setPicked(d.login);
                  form.setFieldsValue({ login: d.login, password: '123456' });
                }}
                className={cn(
                  'flex min-w-0 cursor-pointer items-center gap-2 rounded-pill border-0 py-1 pl-1 pr-3 text-left font-sans transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-[0.97]',
                  active ? 'bg-ink text-on-ink' : 'bg-surface text-ink ring-inset ring-line hover:ring-1',
                )}
              >
                <span
                  className={cn('grid size-8 shrink-0 place-items-center rounded-full text-xs', active ? 'bg-on-dark-subtle' : 'bg-subtle')}
                  aria-hidden
                >
                  {initials(d.name)}
                </span>
                <span className="min-w-0 truncate text-xs">{ROLE_SHORT[d.role]}</span>
              </button>
            );
          })}
        </div>
        <p className="mb-0 mt-3 min-h-4 pl-1 text-xs text-muted" aria-live="polite">
          {pickedDemo ? `${pickedDemo.name} · ${ROLE_LABELS[pickedDemo.role]} — endi “Kirish”ni bosing` : 'Rolni tanlang — login va parol avtomatik to‘ldiriladi'}
        </p>
      </section>
    </div>
  );
};
