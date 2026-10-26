export const APPOINTMENT_SOURCES = [
  { value: 'PHONE', label: "Qo‘ng‘iroq" },
  { value: 'WALK_IN', label: "O‘zi keldi" },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'REFERRAL', label: 'Tavsiya' },
  { value: 'OTHER', label: 'Boshqa' },
] as const;

export const sourceLabel = (v?: string) => APPOINTMENT_SOURCES.find((s) => s.value === v)?.label ?? v ?? '—';

export const SERVICE_CATEGORIES = [
  'Terapiya',
  'Xirurgiya',
  'Ortopediya',
  'Ortodontiya',
  'Gigiyena',
  'Bolalar stomatologiyasi',
  'Diagnostika',
] as const;

export const PRODUCT_CATEGORIES = [
  'Materiallar',
  'Anestetiklar',
  'Asboblar',
  'Bir martalik',
  'Dezinfeksiya',
  'Implantlar',
] as const;

export const PRODUCT_UNITS = ['dona', 'quti', 'g', 'ml', 'l', 'ampula', 'juft', "to‘plam"] as const;

export const PATIENT_TAGS = [
  { value: 'VIP', label: 'VIP' },
  { value: 'CHILD', label: 'Bola' },
  { value: 'DEBTOR', label: 'Qarzdor' },
  { value: 'ORTHO', label: 'Breket' },
] as const;

export const tagLabel = (v: string) => PATIENT_TAGS.find((t) => t.value === v)?.label ?? v;

export const SPECIALTIES = ['Terapevt', 'Xirurg', 'Ortoped', 'Ortodont', 'Bolalar stomatologi'] as const;

export const POSITIONS = [
  { value: 'DOCTOR', label: 'Shifokor' },
  { value: 'ASSISTANT', label: 'Assistent' },
  { value: 'RECEPTIONIST', label: 'Registratura' },
  { value: 'CASHIER', label: 'Kassir' },
  { value: 'STOREKEEPER', label: 'Omborchi' },
  { value: 'ADMIN', label: 'Filial boshqaruvchisi' },
  { value: 'OWNER', label: 'Klinika egasi' },
] as const;

export const positionLabel = (v: string) => POSITIONS.find((p) => p.value === v)?.label ?? v;

/** ISO: 1 = dushanba */
export const WEEKDAYS = [
  { value: 1, short: 'Du', label: 'Dushanba' },
  { value: 2, short: 'Se', label: 'Seshanba' },
  { value: 3, short: 'Ch', label: 'Chorshanba' },
  { value: 4, short: 'Pa', label: 'Payshanba' },
  { value: 5, short: 'Ju', label: 'Juma' },
  { value: 6, short: 'Sh', label: 'Shanba' },
  { value: 7, short: 'Ya', label: 'Yakshanba' },
] as const;

export const DURATIONS = [15, 30, 45, 60, 90, 120] as const;

export const CANCEL_REASONS = [
  'Bemor iltimosi bilan',
  'Bemor kasal bo‘lib qoldi',
  'Shifokor band / kasal',
  'Boshqa vaqtga ko‘chirildi',
  'Boshqa sabab',
] as const;
