import dayjs from '@/shared/lib/dayjs';

export const DATE_FORMAT = 'DD.MM.YYYY';
export const TIME_FORMAT = 'HH:mm';
export const DATETIME_FORMAT = 'DD.MM.YYYY HH:mm';
export const ISO_DATE = 'YYYY-MM-DD';

const groupThousands = (n: number) =>
  Math.abs(Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** 350000 → "350 000 so'm" */
export const formatMoney = (n: number, withCurrency = true) =>
  `${n < 0 ? '−' : ''}${groupThousands(n)}${withCurrency ? " so‘m" : ''}`;

export const formatNumber = (n: number, digits = 0) =>
  digits > 0 && !Number.isInteger(n)
    ? `${n < 0 ? '−' : ''}${groupThousands(Math.trunc(n))},${Math.abs(n).toFixed(digits).split('.')[1]}`
    : `${n < 0 ? '−' : ''}${groupThousands(n)}`;

/** Istalgan kiritishdan faqat raqamlar; 9 xonali bo'lsa +998 qo'shiladi */
export const normalizePhone = (input: string): string => {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 9) return `+998${digits}`;
  if (digits.length === 12 && digits.startsWith('998')) return `+${digits}`;
  return digits ? `+${digits}` : '';
};

/** "+998901234567" → "+998 90 123 45 67" */
export const formatPhone = (phone?: string): string => {
  if (!phone) return '—';
  const d = phone.replace(/\D/g, '');
  const m = d.match(/^998(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return m ? `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone;
};

export const isValidUzPhone = (phone: string) => /^\+998\d{9}$/.test(normalizePhone(phone));

export const formatDate = (v?: string | null) => (v ? dayjs(v).format(DATE_FORMAT) : '—');
export const formatTime = (v?: string | null) => (v ? dayjs(v).format(TIME_FORMAT) : '—');
export const formatDateTime = (v?: string | null) => (v ? dayjs(v).format(DATETIME_FORMAT) : '—');

/** "Bugun, 14:30" / "Ertaga, 09:00" / "12.10.2026, 11:00" */
export const formatRelativeDay = (v?: string | null) => {
  if (!v) return '—';
  const d = dayjs(v);
  const today = dayjs().startOf('day');
  const diff = d.startOf('day').diff(today, 'day');
  const label = diff === 0 ? 'Bugun' : diff === 1 ? 'Ertaga' : diff === -1 ? 'Kecha' : d.format(DATE_FORMAT);
  return `${label}, ${d.format(TIME_FORMAT)}`;
};

export const ageFrom = (birthDate?: string) => (birthDate ? dayjs().diff(dayjs(birthDate), 'year') : 0);

export const formatAge = (birthDate?: string) => (birthDate ? `${ageFrom(birthDate)} yosh` : 'Yoshi kiritilmagan');

export const genderLabel = (g?: 'M' | 'F', short = false) => (g === 'M' ? (short ? 'E' : 'Erkak') : g === 'F' ? (short ? 'A' : 'Ayol') : '');

interface Named {
  lastName: string;
  firstName: string;
  middleName?: string;
}

export const fullName = (p?: Named | null) =>
  p ? [p.lastName, p.firstName, p.middleName].filter(Boolean).join(' ') : '—';

/** "Umarov Sardor" */
export const shortName = (p?: Named | null) => (p ? `${p.lastName} ${p.firstName}` : '—');

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

export const formatDuration = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} daq.`;
  return m ? `${h} soat ${m} daq.` : `${h} soat`;
};

export const formatFileSize = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const formatPercent = (n: number) => `${Math.round(n)}%`;
