import { App, Button, type ButtonProps } from 'antd';
import { PhoneOutgoing } from '@/shared/icons';
import { StatusTag } from '@/shared/components/ui';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { useOrthoAutoCall } from '../hooks/useOrtho';

interface Props extends Omit<ButtonProps, 'onClick'> {
  ids: string[];
  label?: string;
  /** Qo'ng'iroqdan keyin (masalan, oynani yopish) */
  onDone?: () => void;
}

/** Kechikkan bemor(lar)ga avtomatik qo'ng'iroq: tasdiqlash → natijalar ro'yxati */
export const AutoCallButton = ({ ids, label = 'Avtomatik qo‘ng‘iroq', onDone, ...rest }: Props) => {
  const { modal, message } = App.useApp();
  const call = useOrthoAutoCall();

  const run = () =>
    modal.confirm({
      title: ids.length > 1 ? `${ids.length} ta bemorga avtomatik qo‘ng‘iroq qilinsinmi?` : 'Bemorga avtomatik qo‘ng‘iroq qilinsinmi?',
      content: 'Ovozli xabar: «Breket korreksiyasi vaqti keldi. Qabulga yozilish uchun 1 ni bosing». Natija har bir bemor kartasiga yoziladi.',
      okText: 'Qo‘ng‘iroq qilish',
      cancelText: 'Bekor qilish',
      onOk: () =>
        call.mutateAsync(ids).then(
          (res) => {
            onDone?.();
            modal.info({
              title: 'Qo‘ng‘iroq natijalari',
              width: 520,
              okText: 'Yopish',
              content: (
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {res.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-ink">{r.patientName}</span>
                      <StatusTag tone={r.wants ? 'success' : 'warning'}>{r.result}</StatusTag>
                    </li>
                  ))}
                  {res.some((r) => r.wants) && <li className="text-xs text-muted">Tasdiqlaganlar bildirishnomalarda «qabulga yozing» vazifasi sifatida ko‘rinadi.</li>}
                </ul>
              ),
            });
          },
          (e: unknown) => message.error(errorMessage(e)),
        ),
    });

  return (
    <Button icon={<PhoneOutgoing size={18} strokeWidth={1.5} />} loading={call.isPending} disabled={!ids.length} onClick={run} {...rest}>
      {label}
    </Button>
  );
};
