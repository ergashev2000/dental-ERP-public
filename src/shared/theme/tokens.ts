/**
 * Design tokenlar — YAGONA MANBA. Dizayn tizimi: Lime Health
 * (qoidalar: docs/design-system/README.md).
 * Loyihada rang/radius/soya qiymatlari faqat shu faylda yoziladi.
 * `styles/variables.css` shu fayl bilan qo'lda sinxron tutiladi.
 *
 * Uchta rang hamma narsani ko'taradi: aksent (sirt), ink (matn va asosiy amal), oq/kulrang sirtlar.
 * Aksent — sirt rangi (karta, chip, CTA), hech qachon och fondagi matn emas.
 *
 * Klinika varianti: asl neon lime (#E0FF33) ko'zni charchatgani uchun yumshoq YALPIZ rangiga almashtirilgan.
 * Token nomlari (`lime`, `limePress`, `limeSoft`, `olive`, Tailwind `bg-lime` …) tarixiy — qiymati yalpiz.
 */
export const brand = {
  lime: '#A8DDBF', // aksent (yalpiz): hero karta, aktiv menyu, status chip, CTA — ustida ink matn 13:1
  limePress: '#8FD0AD', // aksent hover / pressed
  limeSoft: '#E6F4EC', // ilova kengaytmasi: tanlangan qator, hover fon (tizimda yo'q)
  olive: '#4E8A6C', // aksent kartalar ortidagi qatlam, dekorativ; matn emas
  onLime: '#0A0A0A',
  ink: '#0A0A0A', // asosiy amal (action), matn
  onInk: '#FFFFFF',
  surface: '#FFFFFF', // sahifa va kartalar
  panel: '#F2F2F2', // kartalar ortidagi och panel (klinika varianti: kun bo'yi ko'zni charchatmasin)
  subtle: '#EBEBEB', // input, chip, bo'sh meter, qator hover
  subtleStrong: '#DDDDDD', // subtle elementlarning hover/bosilgan holati
  sidebar: '#34504D', // sidebar foni — sokin kulrang-yashil (oq matn 8.7:1, xira matn 5.1:1, yalpiz pill 5.7:1)
  line: '#D4D4D4', // ingichka ajratgich va outline tugma
  text: '#0A0A0A',
  muted: '#5C5C5C', // label, sana, meta — panel va kartada 4.5:1
  hint: '#767676', // faqat oq fonda; panel ustida emas
  focus: '#0A0A0A', // 2px fokus halqasi, 2px oraliq
} as const;

/**
 * Eski nomlar saqlangan (bg-primary-50, text-neutral-500 ...), qiymatlar Lime Health'ga o'tkazilgan.
 * primary: 50–100 lime tus (fon), 200–300 lime, 400 olive (dekor), 500+ ink (matn, asosiy amal).
 */
export const palette = {
  primary: {
    50: brand.limeSoft,
    100: '#CFEBDB',
    200: brand.lime,
    300: brand.limePress,
    400: brand.olive,
    500: brand.ink, // asosiy (action)
    600: brand.ink,
    700: brand.ink,
    800: '#1C1C1C',
    900: brand.ink,
  },
  sidebar: brand.sidebar,
  sidebarActive: brand.lime,
  neutral: {
    0: brand.surface, // karta
    25: '#F7F7F7',
    50: '#F2F2F2',
    100: brand.subtle, // input foni
    200: brand.subtleStrong, // subtle hover (panel endi och — neutral-50 bilan bir xil)
    300: brand.line, // border
    400: brand.hint, // uchinchi darajali matn (oq fonda)
    500: brand.muted, // ikkinchi darajali matn
    600: '#474747',
    700: '#333333',
    800: '#1C1C1C',
    900: brand.text, // asosiy matn
  },
  success: { base: '#187A41', soft: '#E3F1E8' },
  warning: { base: '#8F6400', soft: '#FFF1CC' },
  // Tizimdagi #D93025 soft fonda 4.0:1 — chip matni uchun to'qroq (5.5:1)
  danger: { base: '#B3261E', soft: '#FBE7E5' },
  info: { base: '#2F5F8A', soft: '#E4EDF5' },
} as const;

/** xs — zich elementlar (kalendar bloki); sm — hujjat/kichik bloklar, md — chat, plitka, input; lg — karta; sheet — modal/panel; block — marketing */
export const radius = { xs: 10, sm: 16, md: 24, lg: 32, sheet: 40, block: 48, pill: 999 } as const;

/** Balandliklar: control — pill tugma/input, circle — ikonka tugmalar */
export const size = { control: 44, controlLg: 52, controlSm: 36, circleSm: 40, circle: 48, circleLg: 56 } as const;

export const shadow = {
  // Tizimda yagona soya: suzuvchi nav, dropdown, popover. Paneldagi kartalarda soya yo'q.
  float: '0 12px 32px -12px rgba(0, 0, 0, 0.28)',
  card: 'none',
} as const;

export const font = {
  family: "'Lexend', system-ui, sans-serif", // ilova ichidagi hamma narsa
  display: "'Inter Tight', 'Helvetica Neue', Arial, sans-serif", // katta marketing/hero sarlavhalar
} as const;

/** Oq matn (ink va to'q fonlar ustida) */
export const onDark = {
  text: brand.onInk,
  muted: 'rgba(255,255,255,0.68)', // = --color-on-dark-muted
  subtle: 'rgba(255,255,255,0.12)', // = --color-on-dark-subtle (qora sidebar karta/hover)
} as const;

/** Shifokor kalendar ranglari — faqat shu 6 ta tayyor tonal rangdan tanlanadi */
/**
 * Shifokor (xodim) identifikatsiya ranglari — kalendar, avatar, hisobot.
 * Status ranglaridan (ko'k, yashil, sariq, qizil, yalpiz) ATAYLAB farqli tuslar:
 * aks holda "qizil shifokor" "Kelmadi" bilan adashadi.
 * Kalitlar tarixiy (ma'lumotlarda saqlangan) — nomi emas, `label` va qiymat muhim.
 * base — nuqta va avatar matni (soft ustida ≥ 5:1), soft — avatar foni.
 */
export const staffColors = {
  primary: { label: 'Zaytun', base: '#5E6B2A', soft: '#EEF0DC' },
  info: { label: 'Indigo', base: '#4A4FB5', soft: '#E8E9F7' },
  success: { label: 'Feruza', base: '#0E6E73', soft: '#DDF0F1' },
  warning: { label: 'Terrakota', base: '#9A4A24', soft: '#F6E6DD' },
  danger: { label: 'Malina', base: '#A3285E', soft: '#F7E1EB' },
  neutral: { label: 'Grafit', base: palette.neutral[600], soft: palette.neutral[100] }, // bemor avatarlari standarti
} as const;
export type StaffColor = keyof typeof staffColors;

/** Semantik ohanglar (status ranglari). primary = lime chip (on-lime matn) */
export type Tone = 'info' | 'success' | 'warning' | 'danger' | 'primary' | 'neutral';
export const toneColors: Record<Tone, { base: string; soft: string }> = {
  info: palette.info,
  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  primary: { base: brand.onLime, soft: brand.lime },
  neutral: { base: palette.neutral[600], soft: palette.neutral[100] },
};

/**
 * Odontogramma ranglari — mavjud tokenlardan olingan.
 * Toj oq, ildiz iliq suyak tusi (warning.soft), pulpa danger.soft; plomba — lime, kanal — ink.
 */
export const toothColors = {
  crown: palette.neutral[0],
  root: palette.warning.soft,
  pulp: palette.danger.soft,
  gum: palette.danger.base,
  stroke: palette.neutral[500],
  strokeHover: brand.ink,
  cell: palette.neutral[25],
  cellSelected: palette.primary[50],
  caries: palette.danger.base,
  cariesSoft: palette.danger.soft,
  filling: palette.primary[200],
  fillingSurface: palette.primary[300],
  rootCanal: palette.primary[500],
  crownStroke: palette.primary[600],
  crownFill: palette.primary[50],
  implant: palette.neutral[600],
  missing: palette.neutral[300],
  extraction: palette.danger.base,
  planned: palette.warning.base,
} as const;
