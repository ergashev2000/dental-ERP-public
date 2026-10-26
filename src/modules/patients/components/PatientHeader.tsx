import { Button, Tooltip } from 'antd';
import type { ReactNode } from 'react';
import { CalendarPlus, Pencil, Phone, Wallet } from '@/shared/icons';
import { Can, MedicalAlert, PhoneText, StatusTag, UserAvatar } from '@/shared/components/ui';
import { tagLabel } from '@/shared/constants/options';
import { formatAge, formatMoney, formatPhone, fullName, genderLabel } from '@/shared/utils/format';
import { useNewAppointment } from '@/modules/appointments';
import { usePaymentModal } from '@/modules/billing';
import type { PatientRow } from '../types';

/** Neytral chip (30px pill) */
const Chip = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex h-7.5 items-center whitespace-nowrap rounded-pill bg-subtle px-3 text-xs text-ink">{children}</span>
);

/** Bemor kartasining yuqori qismi: ism, chiplar, aloqa, tibbiy ogohlantirish va amallar */
export const PatientHeader = ({ patient, onEdit }: { patient: PatientRow; onEdit: () => void }) => {
  const openNew = useNewAppointment((s) => s.show);
  const openPayment = usePaymentModal((s) => s.show);
  const hasDebt = patient.debt > 0;

  return (
    <section className="mb-4 flex flex-col gap-5 rounded-card bg-surface p-5 md:p-6">
      <div className="flex flex-wrap items-start gap-4">
        <UserAvatar name={`${patient.lastName} ${patient.firstName}`} size={56} />

        <div className="flex min-w-0 flex-1 basis-64 flex-col gap-3">
          <h2 className="m-0 text-2xl font-normal leading-tight tracking-[-0.01em] text-ink">{fullName(patient)}</h2>
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip>
              <span className="mr-1 text-muted">Karta</span>
              <span className="tabular-nums">{patient.cardNo}</span>
            </Chip>
            <Chip>{formatAge(patient.birthDate)}</Chip>
            {patient.gender && <Chip>{genderLabel(patient.gender)}</Chip>}
            {patient.tags.map((t) => (
              <Chip key={t}>{tagLabel(t)}</Chip>
            ))}
            {hasDebt ? (
              <StatusTag tone="danger">
                Qarz: <span className="tabular-nums">{formatMoney(patient.debt)}</span>
              </StatusTag>
            ) : (
              <StatusTag tone="success">Qarz yo‘q</StatusTag>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
            <span>
              Telefon <PhoneText phone={patient.phone} className="ml-1 text-base" />
            </span>
            {patient.phone2 && (
              <span>
                Qo‘shimcha <PhoneText phone={patient.phone2} className="ml-1" />
              </span>
            )}
            {patient.guardian && (
              <span className="min-w-0">
                Vasiy <span className="text-ink">{patient.guardian.name}</span>, <span className="tabular-nums">{formatPhone(patient.guardian.phone)}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
          <Tooltip title="Qo‘ng‘iroq qilish">
            <Button shape="circle" href={`tel:${patient.phone}`} aria-label="Qo‘ng‘iroq qilish" icon={<Phone size={20} strokeWidth={1.5} />} />
          </Tooltip>
          <Can perm="payment.receive">
            <Tooltip title={hasDebt ? 'To‘lov qabul qilish' : 'Qarz yo‘q — to‘lov kerak emas'}>
              <Button
                shape="circle"
                aria-label="To‘lov qabul qilish"
                disabled={!hasDebt}
                icon={<Wallet size={20} strokeWidth={1.5} />}
                onClick={() => openPayment({ patientId: patient.id })}
              />
            </Tooltip>
          </Can>
          <Can perm="patient.edit">
            <Tooltip title="Tahrirlash">
              <Button shape="circle" aria-label="Tahrirlash" icon={<Pencil size={20} strokeWidth={1.5} />} onClick={onEdit} />
            </Tooltip>
          </Can>
          <Can perm="appointment.manage">
            <Button
              type="primary"
              className="ml-auto md:ml-2"
              icon={<CalendarPlus size={20} strokeWidth={1.5} />}
              onClick={() => openNew({ patientId: patient.id })}
            >
              Qabulga yozish
            </Button>
          </Can>
        </div>
      </div>

      <MedicalAlert patient={patient} />
    </section>
  );
};
