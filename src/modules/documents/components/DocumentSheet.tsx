import { PrintHeader } from '@/shared/components/ui';
import { formatDate, formatDateTime, formatPhone } from '@/shared/utils/format';
import type { DocumentContext } from '../types';

export interface PrintableDoc {
  title: string;
  number?: string;
  body: string;
  date: string;
  patientName: string;
  doctorName: string;
  signer: 'patient' | 'doctor';
  signature?: string;
  signedAt?: string;
  ctx: DocumentContext;
}

const SignLine = ({ caption, signature }: { caption: string; signature?: string }) => (
  <div>
    <div className="flex h-16 items-end border-b border-ink">{signature && <img src={signature} alt="Imzo" className="h-16 max-w-full object-contain" />}</div>
    <div className="mt-1 text-xs text-muted">{caption}</div>
  </div>
);

/** Hujjat varag‘i — chop etish uchun va drawer'dagi ko‘rinish uchun bir xil */
export const DocumentSheet = ({ doc: d }: { doc: PrintableDoc }) => (
  <div className="text-ink">
    <PrintHeader
      clinic={d.ctx.clinicName}
      title={d.title}
      subtitle={
        <>
          {d.number && <div>{d.number}</div>}
          <div>{formatDate(d.date)}</div>
        </>
      }
    />
    <div className="mb-4 text-xs text-muted">
      {d.ctx.clinicAddress} · {formatPhone(d.ctx.clinicPhone)}
    </div>
    <div className="whitespace-pre-line text-sm leading-6">{d.body}</div>
    <div className="mt-10 grid grid-cols-2 gap-8 text-sm">
      {d.signer === 'patient' ? (
        <>
          <SignLine caption={`Bemor: ${d.patientName}`} signature={d.signature} />
          <SignLine caption={`Shifokor: ${d.doctorName}`} />
        </>
      ) : (
        <>
          <span />
          <SignLine caption={`Shifokor: ${d.doctorName}`} signature={d.signature} />
        </>
      )}
    </div>
    {d.signedAt && <div className="mt-4 text-xs text-muted">Elektron imzolangan: {formatDateTime(d.signedAt)}</div>}
  </div>
);
