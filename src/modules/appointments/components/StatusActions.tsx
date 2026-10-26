import { App, Button, type ButtonProps } from 'antd';
import { ArrowRightLeft, CalendarX2, CheckCheck, CircleCheck, DoorOpen, PanelsTopLeft, Stethoscope, UserX } from '@/shared/icons';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/shared/constants/routes';
import dayjs from '@/shared/lib/dayjs';
import { usePermission, useCurrentUser } from '@/shared/hooks/usePermission';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { useSetAppointmentStatus } from '../hooks/useAppointments';
import { useNewAppointment } from '../store/appointmentModalStore';
import type { AppointmentStatus, AppointmentView } from '../types';

interface Props {
  a: AppointmentView;
  onCancel: () => void;
  onComplete: () => void;
  size?: 'small' | 'middle';
  /** Dashboard timeline uchun: faqat asosiy tez amal */
  compact?: boolean;
  /** Qabul sahifasining o'zida — "Yakunlash" va "Qabul sahifasi" tugmalari kerak emas */
  hideComplete?: boolean;
}

const I = { size: 16, strokeWidth: 1.75 };

/** Qabul statusiga qarab mumkin bo'lgan amallar */
export const StatusActions = ({ a, onCancel, onComplete, size = 'middle', compact, hideComplete }: Props) => {
  const navigate = useNavigate();
  const set = useSetAppointmentStatus();
  const { message, modal } = App.useApp();
  const user = useCurrentUser();
  const manageAll = usePermission('appointment.manageAll');
  const canComplete = usePermission('appointment.complete');
  const showMove = useNewAppointment((s) => s.showMove);
  const own = manageAll || a.doctorId === user?.staffId;
  if (!own || a.masked) return null;

  const go = (status: AppointmentStatus, ok: string, after?: () => void) =>
    set.mutate(
      { id: a.id, status },
      {
        onSuccess: () => {
          message.success(ok);
          after?.();
        },
        onError: (e) => message.error(errorMessage(e)),
      },
    );
  const openVisit = () => navigate(ROUTES.visit(a.id));
  const past = dayjs(a.start).isBefore(dayjs());
  const loading = (s: AppointmentStatus) => set.isPending && set.variables?.status === s;

  const list: { key: string; node: ReactNode }[] = [];
  const add = (key: string, label: string, icon: ReactNode, onClick: () => void, primary = false, extra: ButtonProps = {}) =>
    list.push({
      key,
      node: (
        <Button
          key={key}
          size={size}
          type={primary && !compact ? 'primary' : 'default'}
          icon={icon}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          {...extra}
        >
          {label}
        </Button>
      ),
    });

  if (a.status === 'SCHEDULED') add('confirm', 'Tasdiqlash', <CheckCheck {...I} />, () => go('CONFIRMED', 'Qabul tasdiqlandi'), false, { loading: loading('CONFIRMED') });
  if (a.status === 'SCHEDULED' || a.status === 'CONFIRMED') {
    add('arrived', 'Keldi', <DoorOpen {...I} />, () => go('ARRIVED', 'Bemor keldi'), true, { loading: loading('ARRIVED') });
    if (past)
      add('noshow', 'Kelmadi', <UserX {...I} />, () =>
        modal.confirm({ title: 'Bemor kelmadi deb belgilansinmi?', okText: 'Ha, kelmadi', cancelText: 'Yopish', onOk: () => go('NO_SHOW', 'Belgilandi: kelmadi') }),
      );
    add('move', 'Ko‘chirish', <ArrowRightLeft {...I} />, () => showMove(a));
  }
  // "Qabulga" — status o'zgaradi va qabul sahifasi (tish sxemasi bilan) ochiladi
  if (a.status === 'ARRIVED')
    add('start', 'Qabulga', <Stethoscope {...I} />, () => go('IN_PROGRESS', 'Qabul boshlandi', hideComplete ? undefined : openVisit), true, {
      loading: loading('IN_PROGRESS'),
    });
  if (a.status === 'IN_PROGRESS' && !hideComplete) add('visit', 'Qabul sahifasi', <PanelsTopLeft {...I} />, openVisit, true);
  if ((a.status === 'ARRIVED' || a.status === 'IN_PROGRESS') && canComplete && !hideComplete)
    add('complete', 'Yakunlash', <CircleCheck {...I} />, onComplete);
  if (['SCHEDULED', 'CONFIRMED', 'ARRIVED'].includes(a.status))
    add('cancel', 'Bekor qilish', <CalendarX2 {...I} />, onCancel, false, { danger: true, type: 'text' });

  if (compact) {
    // Dashboard: faqat asosiy tez amal — Keldi / Qabulga / Yakunlash
    const quick = list.find((x) => ['arrived', 'start', 'visit', 'complete'].includes(x.key));
    return quick ? <>{quick.node}</> : null;
  }
  return <div className="flex flex-wrap gap-2">{list.map((x) => x.node)}</div>;
};
