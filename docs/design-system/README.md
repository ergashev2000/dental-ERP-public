# Lime Health — Oq Tabassum Dental dizayn tizimi

Manba: claude.ai'dagi "Lime Health" Design System artifact (https://claude.ai/artifact/VPGSR9b8UNLaM1XQTkP915).
Asl hujjatlar `docs/design-system/reference/` ichida: `brand-book.md` (brend kitobi), `tokens.json`, `components.md`
(16 komponent qoidasi), `bundle.css` (asl `lh-` markup — faqat namuna, loyihaga ulanmaydi).
Bu fayl — o'sha tizimning **shu kod bazasiga** tatbiqi va AI vositalari (Claude, Codex, Cursor, Copilot…) hamda dasturchilar uchun yagona manba. Ziddiyat bo'lsa, shu fayl ustun.

> Eski uslublar ishlatilmaydi: binafsha palitra, Manrope, Light Lime Glass (glass, mesh gradient,
> Urbanist). Ularni ko'rsangiz — shu tizimga o'tkazing.

## 1. Asosiy g'oya (5 qoida)

1. **Uch rang hamma narsani ko'taradi:** `lime`, `ink`, oq/kulrang sirtlar. Status qizil/yashil kichik va har doim so'z bilan.
2. **Lime — sirt, matn emas.** Lime bilan karta, aktiv segment, status chip, CTA'ni to'ldiring; ustiga `on-lime` matn. Och fonda lime matn — taqiqlangan.
3. **Bir qatorda bitta lime blok.** Lime — qatordagi "hero" element (birinchi plitka, aktiv qator, asosiy CTA). Hamma narsa lime bo'lsa, hech narsa ajralmaydi.
4. **Yumaloq yoki doira, hech qachon o'tkir burchak.** Kartalar 32px, panel/modal 40px, marketing 48px, boshqaruv elementlari pill.
5. **Sokin ma'lumot.** Raqamlar katta va yengil, labellar kichik va xira; rangli diagrammalar o'rniga ink/tekstura.

## 2. Tokenlar qayerda

| Fayl | Nima |
| --- | --- |
| `src/shared/theme/tokens.ts` | **YAGONA MANBA**: `brand`, `palette`, `radius`, `size`, `shadow`, `font`, `staffColors`, `toneColors`, `toothColors` |
| `src/styles/variables.css` | Tailwind `@theme` — tokens.ts bilan **qo'lda sinxron** (birini o'zgartirsangiz, ikkinchisini ham) |
| `src/shared/theme/antdTheme.ts` | Butun ilova uchun yagona antd mavzusi (AppProvider ulaydi). Ichki `ConfigProvider theme` qo'shmang |
| `src/styles/global.css` | `.btn-lime`, global fokus halqasi, bosish effekti |
| `src/shared/icons/index.tsx` | Ikonkalar (Hugeicons) — yagona import nuqtasi |

Hex rang faqat `tokens.ts` va `variables.css`da. Boshqa joyda — Tailwind token klassi yoki `palette`/`brand` importi.

### Ranglar (Tailwind klassi → qiymat → ishlatilishi)

| Klass | Qiymat | Qachon |
| --- | --- | --- |
| `bg-lime` / `text-on-lime` | #A8DDBF / #0A0A0A | **Aksent (yalpiz)** — hero karta, aktiv menyu, CTA, primary status chip. Nomi tarixiy: klinika variantida neon lime (#E0FF33) ko'zni charchatgani uchun yalpizga almashtirilgan |
| `bg-lime-press` | #8FD0AD | Aksent hover/pressed |
| `bg-lime-soft` (= `primary-50`) | #E6F4EC | *Ilova kengaytmasi*: tanlangan qator, kalendar hover, yengil urg'u foni |
| `bg-olive` | #4E8A6C | Aksent kartalar ortidagi qatlam. Faqat dekor |
| `bg-ink` / `text-on-ink` | #0A0A0A / #FFF | Asosiy amal (primary tugma, doira CTA), qora bloklar |
| `bg-sidebar` | #34504D | **Sidebar foni** — sokin kulrang-yashil (oq matn 8.7:1, xira matn 5.1:1, yalpiz pill 5.7:1) |
| `text-on-dark-muted` / `bg-on-dark-subtle` | oq 68% / oq 12% | To'q sidebar ustida: ikkilamchi matn; karta va hover foni |
| `bg-surface` | #FFF | Sahifa foni va kartalar |
| `bg-panel` | #F2F2F2 | Kartalar ortidagi och panel (ilovada — kontent maydoni). *Klinika varianti*: asl #DDDDDD kun bo'yi ishlashda og'ir edi |
| `bg-subtle` | #EBEBEB | Input, chip, ikonka doirasi, qator hover, bo'sh meter |
| `bg-subtle-strong` (= `neutral-200`) | #DDDDDD | Subtle elementlarning hover/bosilgan holati (ikkilamchi tugma hover) |
| `border-line` / `ring-line` | #D4D4D4 | Ingichka ajratgich, outline tugma/doira |
| `text-ink` | #0A0A0A | Asosiy matn |
| `text-muted` | #5C5C5C | Label, sana, meta (panel va kartada 4.5:1) |
| `text-hint` | #767676 | Faqat **oq** fonda maslahat matni; panel ustida emas |
| `success/warning/danger/info` + `-soft` | | Status chip: `-soft` fon + base matn, har doim so'z bilan |

**Eski nomlar saqlangan va Lime Health'ga qayta bog'langan** — yangi kodda semantik nomlarni afzal ko'ring:
- `primary-50/100` → lime tus fon · `primary-200/300` → lime / lime-press · `primary-400` → olive · `primary-500…900` → ink (`text-primary-600` = qora matn).
- `neutral-100` = subtle, `neutral-200` = subtle-strong (#DDDDDD; panel endi `neutral-50` bilan bir xil), `neutral-300` = line, `neutral-400` = hint, `neutral-500` = muted, `neutral-900` = ink.
- `line-soft` = subtle; `canvas` = oq. `sidebar` — sokin kulrang-yashil sidebar foni.

### Tipografiya

- **Lexend** (`font-sans`, standart) — ilovadagi hamma narsa. **Inter Tight** (`font-display`) — faqat katta hero/marketing sarlavhalar (login chap paneli kabi).
- Og'irlik **300–500**, hech qachon bold. `font-bold`/`font-semibold` token darajasida 500 ga tenglangan, lekin yangi kodda `font-normal` (400) yoki `font-medium` (500) yozing. `check:design` `font-bold`ni rad etadi.
- Shkala: `text-xs` 12 (label, chip) · `text-sm` 14 (body-sm: input, tugma, jadval) · `text-base` 16 (body) · `text-lg` 18 (*kengaytma*) · `text-xl` 22 (**title** — bo'lim sarlavhasi) · `text-2xl` 28 (**title-stack** — ism) · `text-3xl` 36 (**numeral** — KPI) · `text-4xl` 40 (headline).
- Raqamlar `tabular-nums`. Valyuta/birlik raqamdan kichik va `text-muted` (`<span className="text-[0.55em] text-muted">so‘m</span>`).
- Sentence case hamma joyda. ALL CAPS, undov belgisi, emoji yo'q. UI labellari nuqtasiz; marketing sarlavhalari nuqta bilan tugaydi.

### Shakl, o'lcham, soya

- Radius (`rounded-*`): `xs` 10 (*kengaytma* — zich elementlar: kalendar bloki) · `sm` 16 (kichik blok, hujjat) · `md` 24 (input, plitka, alert, chat) · `lg`/`card` 32 (**har bir karta**) · `sheet` 40 (panel, modal, drawer bo'limi) · `block` 48 (marketing) · `pill` (tugma, chip, segment, doira).
- Balandlik: tugma/input 44 (`size.control`), katta 52 (`size="large"`, login/hero), kichik 36. Doira tugmalar: 40 (`size-10`, karta ichida), 48 (`size-12`, bar'larda), 56 (`size-14`, ink strelka CTA).
- **Kartalarda chegara va soya yo'q** — ajralish `bg-panel` fonidan. Yagona soya `shadow-float`: dropdown, popover, suzuvchi nav.
- Bo'shliq 4px asosida. Karta padding `p-5` (20); karta ichida bo'limlar `gap-6`; plitkalar orasida `gap-1.5`; sahifa bo'limlari `gap-8`.

## 3. antd bilan ishlash

Mavzu global — komponentlar avtomatik Lime Health ko'rinishida. Qoidalar:
- `type="primary"` → **ink** pill (oq matn). Bu standart asosiy amal (Saqlash, Qo'shish).
- **Lime CTA**: `<Button type="primary" className="btn-lime">` — ekranda/qatorda **bittadan ko'p emas** (masalan, header'dagi "Yangi qabul", login'dagi "Kirish").
- Ikkilamchi: oddiy `<Button>` (subtle fon, chegarasiz). Outline kerak bo'lsa `className="bg-transparent ring-1 ring-inset ring-line"`.
- Ikonka tugma: `<Button shape="circle" icon={<X size={20} strokeWidth={1.5} />} aria-label="…" />`. Kulrang panel ustida oq bo'lsin: `className="bg-surface"`.
- Inputlar `variant="filled"` (AppProvider'da global): subtle fon, chegarasiz, 24px radius, fokusda 2px ink halqa. Panel ustidagi qidiruv — `className="rounded-pill bg-surface hover:bg-surface"`.
- Katta forma (login, onboarding): `size="large"`ni **har bir Input/Button'ga** bering, `<Form size="large">` emas (label balandligini 52px qilib yuboradi).
- Form labellari 12px `muted` — token orqali, qo'lda stil bermang.
- Modal radius 40, Drawer, Popover, Dropdown — tokenlardan. `styles`/`style` bilan rang bermang.
- Tailwind klassi antd stilini **yengadi** (`@layer antd` < utilities) — `!` kerak emas, faqat antd inline stil bergan joyda.
- Jadval: sarlavha shaffof, 12px muted; zebra va vertikal chiziq yo'q; summa o'ngda tekislangan.
  - **Zich rejim** — ish jadvallari (ko'p qatorli, kun bo'yi ishlatiladigan ro'yxatlar): `<Table size="middle">` → qator ~48–52px. Sarlavha va hujayra bir qatorda — `global.css` buni `size="middle"` jadvallar uchun avtomatik qiladi; uzun matnli ustunga `block max-w-* truncate` + `title` bering. Qalin emas — `font-medium` (`<b>`, `font-semibold` emas). Jadval kartasi paddingi `p-3 md:p-4` (tablar bilan — `px-3 pb-4 md:px-4`). Namuna: `appointments/components/ListView.tsx`, `patients/pages/PatientsPage.tsx`.
  - Zich: Qabullar ro'yxati, Bemorlar, To'lovlar (hisob-faktura, to'lov, qarzdorlar), Ombor (mahsulotlar, harakatlar, yetkazib beruvchilar), Eslatmalar (navbat, qo'ng'iroqlar). Drawer ichidagi jadvallar — `size="small"`. Ko'p qatorli izohli jadvallar (bemor kartasidagi "Tashriflar") — oddiy rejim.
  - Oddiy rejim (standart o'lcham, qator 56–64px) — kam qatorli, ko'rib chiqish jadvallari.

## 4. Ikonkalar

- Faqat `import { Plus, CalendarDays } from '@/shared/icons'` (Hugeicons stroke-rounded). `lucide-react`, `@hugeicons/core-free-icons`, `@ant-design/icons`ni komponentda import qilmang — `check:design` rad etadi.
- O'lcham 20px, `strokeWidth={1.5}`, rang `currentColor` (`text-ink` / `text-on-ink`). Kichik joyda 16–18.
- Ikonka iloji boricha **doira ichida**: karta ichida `size-10 rounded-full bg-subtle`, bar'larda `size-12`.
- Yangi ikonka kerak bo'lsa: `@hugeicons/core-free-icons`dan mos `*Icon`ni topib, `src/shared/icons/index.tsx`ga `export const Nomi = make(XIcon, 'Nomi')` qo'shing (raqamli nomlarni afzal ko'ring: `Calendar03Icon`, `Tick02Icon`).
- Emoji, rangli/filled ikonkalar yo'q.

## 5. Ilova shell'i (tayyor — o'zgartirmang, faqat ishlating)

`MainLayout`: chapda **kulrang-yashil sidebar** (`bg-sidebar`, oynaning chap/yuqori/pastki chetiga yopishgan, `h-screen`; antd `<Menu theme="dark">`: oq matn, aktiv bo'lim — yalpiz pill, logo oq doirada, ostida filial; pastki karta yo'q; yig'ilganda guruh nomlari o'rniga ajratgich), o'ngda **och panel** (`bg-panel md:rounded-l-sheet`, o'ng/yuqori chetga yopishgan) — barcha sahifa kontenti shu panel ichida, ya'ni **sahifadagi kartalar oq (`bg-surface`) va soyasiz** bo'ladi. Header panelning yuqori qatori: oq doira tugmalar, `title` sarlavha + breadcrumb, oq qidiruv pill, yalpiz "Yangi qabul".

Sahifa sarlavhasi `PageHeader` orqali (title Header'ga ketadi; sahifada faqat izoh + amallar qatori).

## 6. Komponent retseptlari (Tailwind)

Umumiy komponentlar `src/shared/components/ui` ichida — avval ularni ishlating:
`Panel` (karta + title + squiggle), `StatCard` (KPI), `StatusTag` (status chip), `EmptyState`/`ErrorState`/`CardSkeleton`, `Squiggle`, `UserAvatar`, `PageHeader`.

```tsx
// Karta (panel ustida)
<section className="flex flex-col gap-3 rounded-card bg-surface p-5">…</section>

// Hero karta — qatordagi yagona lime blok
<section className="flex flex-col gap-3 rounded-card bg-lime p-5 text-on-lime">…</section>

// Bo'lim sarlavhasi + squiggle (har bir bo'lim title'idan keyin)
<div><h3 className="m-0 text-xl font-normal">Bugungi qabullar</h3><Squiggle /></div>

// Kulrang guruh (kartalar to'plami, masalan ro'yxat) — oq kartalar ichida
<div className="flex flex-col gap-2 rounded-sheet bg-panel p-2">{items.map(… <div className="rounded-card bg-surface p-4">…</div>)}</div>

// Chip (30px pill) — neytral / aktiv / qora
<span className="inline-flex h-7.5 items-center gap-2 rounded-pill bg-subtle px-3 text-xs">ID 201983</span>
<span className="inline-flex h-7.5 items-center rounded-pill bg-lime px-3 text-xs text-on-lime">Jarayonda</span>
// status uchun — <StatusTag tone="success">Faol</StatusTag> (nuqta har doim so'z bilan)

// Ikonka doirasi (karta ichida)
<span className="grid size-10 place-items-center rounded-full bg-subtle"><Users size={20} strokeWidth={1.5} /></span>

// Stat: label tepada, qiymat pastda; hero qiymat text-3xl
<div><div className="text-xs text-muted">Jami</div><div className="text-xl tabular-nums">1 500 000 <span className="text-[0.55em] text-muted">so‘m</span></div></div>

// Ink strelka CTA (kartada bitta)
<Button type="primary" shape="circle" className="size-14" aria-label="Ochish" icon={<ArrowRight size={20} strokeWidth={1.5} />} />

// Segment (2–3 ta) — antd <Segmented> (trackBg subtle, aktiv — oq pill). Lime konteyner kerak bo'lsa: className="bg-lime"

// Xizmat plitkalari: 2 ustun, gap-1.5, h-36, rounded-card; ikonka doirasi o'ng tepada, label chap pastda; faqat birinchi/tanlangani lime
```

Reyting/ulush ro'yxati (shifokorlar, top xizmatlar) — chart emas, `BarList` naqshi (`reports/components/ReportViews.tsx`): nom va qiymat tepada, ingichka ink chiziq pastda — uzun nomlar kesilmaydi. Chart kerak bo'lsa `Simple*` (`Charts.tsx`): `axis` umumiy sozlamaga qo'shiladi, o'q yozuvlari aylantirilmaydi.
Ish jadvalidagi amal tugmalari: bajarib bo'lmaydigan amalni o'chiq holda ko'rsatmang — yashiring.
Ikki ustunli sahifa grid'i: `grid grid-cols-1 … xl:grid-cols-[minmax(0,1fr)_400px]` — `grid-cols-1`siz mobil'da keng kontent (Segmented, jadval) sahifani toshirib yuboradi.

Meter (progress) — tekstura: ishlatilgan qism chiziqli, qolgani nuqtali, yonida **raqam yozilgan** (`docs/design-system/reference/components.md` → Meter). Oddiy holatda antd `Progress` (ink, subtle trek) yetarli.
Ism kartalari (shifokor, bemor): ism `text-2xl` (title-stack), kerak bo'lsa so'zma-so'z qatorga bo'lingan + squiggle.

### Kalendar va status ranglari (klinika varianti)

Qabul bloklari statusni rang bilan ko'rsatadi — registratura bir qarashda kim kelgani, kim kresloda ekanini ko'rishi kerak.
- Blok: `TONE_BLOCK_CLASS[tone]` (`@/shared/components/ui`) — status `-soft` fon + chap 3px chiziq `base` rangida, `rounded-xs`, matn `text-ink`, izoh `text-muted`.
- **Lime faqat "Qabulda"** (`IN_PROGRESS`, hozir kresloda) — kalendardagi yagona lime blok. Yakunlangan — oq blok, ingichka `ring-line` chegara (sokin). Kelmadi — `danger-soft`, 70% shaffoflik; bekor — 40% + chizilgan.
- Ish vaqtidan tashqari — `bg-neutral-50`, bo'sh slot hover — `lime-soft`.
- Rang har doim so'z bilan: kalendar ustida `StatusLegend` (`TONE_DOT_CLASS` nuqtalari + status nomi), blokda tooltip va `aria-label`.
- Status → ohang xaritasi bitta joyda: `APPOINTMENT_STATUS` (`src/shared/constants/status.ts`). Yangi status qo'shsangiz — legend avtomatik.
- Kalendar konteyneri `rounded-md bg-surface` (zich ekran — 24px).

## 7. Sahifa namunalari (CRM)

- **Dashboard**: KPI qatori (`StatCard` × 4, `grid gap-4 sm:grid-cols-2 xl:grid-cols-4`) → bento: chapda katta ro'yxat karta, o'ngda 1–2 kichik karta; eng muhim bitta element lime.
- **Ro'yxat/jadval sahifasi**: `PageHeader` (izoh + ink "Qo'shish") → filtr qatori (oq pill inputlar, `Segmented`) → oq karta ichida `Table`.
- **Detal sahifa** (bemor, ortho holat): tepada ism `text-2xl` + chiplar + doira amallar; ostida `Tabs`; har bir bo'lim `Panel`.
- **Forma**: Drawer/Modal ichida vertikal `Form`, labellar 12px muted, footer'da o'ngda "Bekor qilish" (default) + "Saqlash" (primary ink).
- **Bo'sh holat**: `EmptyState` — do'stona matn, doira ikonka, bitta amal.

## 8. Taqiqlar

- Gradient, glass/blur, 1px chegaralar har joyda, o'tkir burchak, 15% dan qora soya, kartaga soya.
- Lime matn och fonda; bitta qatorda bir nechta lime blok; lime + boshqa yorqin aksent.
- Bold (600+) sarlavha, ALL CAPS, emoji, undov.
- Rangli chartlar (ko'p rang) — ink ustunlar / tekstura; raqamni yashil/qizil bo'yamang — so'z qo'shing.
- Qarz summasi: `<MoneyText debt />` — raqam ink, oldida kichik danger nuqta; "qarz" so'zi ustun sarlavhasi/labelda.
- ALL CAPS (`uppercase`) va 12px dan kichik matn (`text-[10px]`, `text-[11px]`) — eng kichigi `text-xs`.
- Hex rang, `style={{ color }}`, antd ichida qo'shimcha `ConfigProvider theme`.
- `npm run format` yoki prettier'ni butun faylga ishlatmang — loyiha uslubiga mos emas, keraksiz diff hosil qiladi.

## 9. Mavjud ekranni o'tkazish tartibi

1. Sahifani o'qing, barcha funksiya, maydon va route'larni ro'yxatlang — **faqat vizual qatlam o'zgaradi**.
2. Lokal `rounded-md bg-surface shadow-card p-6` kabi qutilarni `Panel` yoki `rounded-card bg-surface p-5`ga almashtiring; sarlavhalarga `Squiggle`.
3. Rangli fon/matnlarni semantik tokenlarga o'tkazing (`primary-*` → `lime`/`ink`/`lime-soft`), qatorga bitta lime.
4. Ikonka konteynerlari → doira; chiplar → pill (`StatusTag`).
5. Raqamlar: KPI `text-3xl font-normal tabular-nums`, label `text-xs text-muted`.
6. Tekshiring (10-bo'lim), keyin 11-bo'limdagi holatni yangilang.

## 10. Tekshiruv (har bir UI ishidan keyin)

```bash
npm run typecheck && npm run check:design && npx oxlint src
```
`check:design` (scripts/check-design.mjs): gradient, blur, hardcode hex, lime matn, bold, ikonka importi.
Keyin sahifani brauzerda 1440px va 390px'da ko'ring: kontrast (body 4.5:1, `text-hint` faqat oq fonda), qatorda bitta lime, kartalar panel ustida, mobil'da gorizontal scroll yo'q, har bir interaktiv elementda hover/fokus/bosish holati.
Demo kirish: login `admin`, parol `123456` (login sahifasidagi demo ro'yxatdan).

## 11. Holat (2026-10-24)

**Barcha sahifalar klinika variantiga o'tkazilgan** (och panel, kulrang-yashil sidebar, yalpiz aksent, status ranglari, zich jadval):
ilova shell'i (sidebar 4 guruh, filial tanlagich logo ostida), Login (7 demo rol), Bosh sahifa (rolga qarab: Registratura — "Bugun", Shifokor — "Mening kunim", Assistent, Egasi — "Tahlil"),
Qabullar (kalendar, ro'yxat, **tezkor qabul oynasi**, so'rovlar va kutish ro'yxati, to'liq shakl, shifokorning qabul sahifasi + AI diktovka mock),
Bemorlar (ro'yxat, karta: Hujjatlar va Laboratoriya tablari), Odontogramma va Davolash rejasi (2D + **3D ko'rinish**, "Bemorga ko'rsatish"), Breketlar, Laboratoriya (yangi), To'lovlar, Hisobotlar, Ombor, Eslatmalar,
Sozlamalar (Klinika, Filiallar — yangi, Kabinetlar, Xizmatlar, Xodimlar, Foydalanuvchilar, Rollar — 7 rol, To'lov turlari, Chek).

Umumiy komponent qo'shimchalari: `StatCard` — `variant="hero"` (qatordagi yagona lime karta), `onClick` + `active` (filtr sifatida); `MoneyText strong` — `font-medium`; chartlar standart rangi — ink.
3D (`@/modules/dental-chart` → `Jaw3DView`, `JawPresentationModal`): faqat tushuntirish va ko'rish uchun, ma'lumot kiritish 2D'da; three.js alohida chunk'da, faqat ochilganda yuklanadi; WebGL bo'lmasa — 2D ishlayveradi.
Yangi sahifa yoki komponent qo'shganda shu ro'yxatni yangilang.

## 12. Ilova kengaytmalari (asl tizimda yo'q — ataylab qo'shilgan)

- `lime-soft` / `primary-50` #E6F4EC — yengil tanlov/hover foni (CRM'da ko'p tanlanadigan qatorlar uchun).
- `danger` #B3261E (asl #D93025 soft fonda 4.0:1 — chip matni uchun to'qroq).
- `warning`, `info` palitralari — CRM statuslari uchun (asl tizimda yo'q).
- Och panel #F2F2F2 va `subtle-strong` #DDDDDD (asl panel) — klinika varianti, kun bo'yi ishlash uchun.
- Kulrang-yashil sidebar (asl tizimda oq): menyu ranglari `antdTheme.ts`dagi `dark*` tokenlarida; aktiv guruh sarlavhasi rangi `global.css`da (antd uni pill matni rangiga bog'laydi). Blur ishlatilmaydi.
- `radius.xs` 10px, `TONE_BLOCK_CLASS` / `TONE_DOT_CLASS`, zich jadval (`size="middle"`, `cellPaddingBlockMD: 8`) — 6-bo'limdagi "Kalendar va status ranglari".
- `text-lg` 18px — oraliq o'lcham (eski kod uchun); yangi kodda `text-base` yoki `text-xl`.
- Boshqaruv balandligi 44px (asl 52) — zich CRM ekranlari uchun; hero formalarda `size="large"` = 52.
- Shifokor (xodim) ranglari — `staffColors`: Zaytun, Indigo, Feruza, Terrakota, Malina, Grafit. Status tuslaridan (ko'k, yashil, sariq, qizil, yalpiz) ataylab farqli, aks holda "qizil shifokor" "Kelmadi" bilan adashadi. Kalendar sarlavhasida shifokor — rangli bosh harfli avatar (nuqta emas, status nuqtalaridan shakli ham farq qiladi). Kalitlar (`primary`, `info`…) tarixiy, ma'lumotlarda saqlangan.
- Aksent yalpiz #A8DDBF (asl neon lime o'rniga): ko'z charchamasligi uchun; ink matn ustida 13:1. Status "Tasdiqlangan" (success-soft) ham yashil oilasida — farq: yalpiz to'qroq va ink matnli, success — och va yashil matnli.
- Dark tema yo'q (ilovada qorong'i rejim yo'q); `docs/design-system/reference/tokens.json`da dark qiymatlar bor — kerak bo'lsa shu yerdan oling.
