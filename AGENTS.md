# Oq Tabassum Dental — CRM

Stomatologiya klinikasi uchun boshqaruv paneli: React 19 + Vite + TypeScript, antd 5, Tailwind 4, TanStack Query, zustand, react-router 7.
Backend hozircha mock (`src/shared/lib/mock`). UI matnlari va kod izohlari — o'zbek tilida.

## Buyruqlar

```bash
npm run dev            # dev server
npm run typecheck      # tsc
npm run check:design   # dizayn tizimi qoidalari (scripts/check-design.mjs)
npx oxlint src         # lint
npm run build
```

`npm run format` / prettier'ni mavjud fayllarga ishlatmang — sozlamasi loyiha uslubiga mos emas, qatorlarni bo'lib keraksiz diff beradi.

## Tuzilma

- `src/app` — provayderlar (`AppProvider`), router, sahifalar ro'yxati.
- `src/modules/<bo'lim>/{api,components,hooks,pages,store,types}` — har bir bo'lim mustaqil, tashqariga `index.ts` orqali.
- `src/shared/{components/ui,components/layout,hooks,constants,lib,utils,theme,icons}` — umumiy qism.

## Dizayn tizimi — Lime Health (MAJBURIY)

Har qanday UI ishida (yangi sahifa, komponent, qayta dizayn, rang/shrift/ikonka tanlash) avval
**`docs/design-system/README.md`** ni to'liq o'qing va unga amal qiling. Batafsil manba: `docs/design-system/reference/`.

Asosiy qoidalar (to'liq ro'yxat — README'da):
- Tokenlar faqat `src/shared/theme/tokens.ts` (+ qo'lda sinxron `src/styles/variables.css`). Boshqa joyda hex rang, `style={{ color }}` yo'q — Tailwind token klasslari (`bg-surface`, `bg-panel`, `bg-subtle`, `bg-lime`, `text-ink`, `text-muted`…).
- antd mavzusi global (`src/shared/theme/antdTheme.ts`) — ichki `ConfigProvider theme` qo'shmang. `type="primary"` = qora pill; lime CTA = `className="btn-lime"`, ekranda bittadan ko'p emas.
- Ikonkalar faqat `@/shared/icons` (Hugeicons), 20px, `strokeWidth={1.5}`, iloji boricha doira ichida.
- Lime — sirt rangi, hech qachon och fonda matn emas; bir qatorda bitta lime blok.
- Aksent rang — yumshoq yalpiz #A8DDBF (token nomlari tarixiy: `lime`, `bg-lime`, `btn-lime` = yalpiz); neon lime ishlatilmaydi.
- Sidebar sokin kulrang-yashil (`bg-sidebar` = #34504D, `<Menu theme="dark">`), oyna chetlariga yopishgan, aktiv bo'lim yalpiz pill, menyu 4 guruhda (`navItems.ts`); blur/glass yo'q.
- Rollar 7 ta (`src/shared/constants/roles.ts`): OWNER, ADMIN (ikkalasi to'liq ruxsat), DOCTOR, ASSISTANT, RECEPTIONIST, CASHIER, STOREKEEPER. Rol tekshiruvi — `usePermission('…')`, rol nomi bilan emas. Demo: owner, admin, dr.aziz, assistant, reception, kassa, ombor (parol 123456).
- Yangi qabul — tezkor oyna (`appointments/components/quick/QuickBookingDrawer`): `useNewAppointment().show(prefill)`; to'liq shakl — `prefill.full = true`.
- Kartalar och kulrang panel (#F2F2F2) ustida oq, chegarasiz va soyasiz (`rounded-card bg-surface p-5`); boshqaruv elementlari pill; o'tkir burchak yo'q.
- Shrift Lexend (hero sarlavhalar — Inter Tight), og'irlik 300–500, bold yo'q; gradient, glass/blur yo'q.
- Klinika varianti: kalendar bloklari status rangida (`TONE_BLOCK_CLASS`, lime faqat "Qabulda") + `StatusLegend`; ish jadvallari zich — `<Table size="middle">`, hujayra bir qatorda. Namuna — Qabullar sahifasi.
- Avval umumiy komponentlar: `Panel`, `StatCard`, `StatusTag`, `EmptyState`, `Squiggle`, `PageHeader` (`src/shared/components/ui`).
- Faqat vizual qatlamni o'zgartiring — funksiya, maydon va route'lar saqlanadi.

UI ishidan keyin: `npm run typecheck && npm run check:design && npx oxlint src`, so'ng brauzerda 1440px va 390px'da ko'ring
(demo kirish: `admin` / `123456`). Sahifani yangi tizimga o'tkazganda README'ning "Holat" bo'limini yangilang.

"Light Lime Glass", binafsha palitra, Manrope/Urbanist, lucide ikonkalari — eski uslub, ishlatilmaydi.
