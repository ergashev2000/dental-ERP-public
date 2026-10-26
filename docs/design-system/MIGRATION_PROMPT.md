# Sahifalarni Lime Health'ga o'tkazish — AI agent uchun prompt

Quyidagi blokni yangi AI sessiyasiga (Codex, Cursor, Copilot agent, Claude Code…) to'liqligicha qo'ying.
Agent har bir sahifadan keyin to'xtab tasdiq kutadi; bir yo'la bir nechta sahifa kerak bo'lsa, 3-bo'limning 5-bandini olib tashlang.

```text
Sen "Oq Tabassum Dental" CRM loyihasida ishlaysan (React 19 + Vite + TypeScript, antd 5, Tailwind 4).
Vazifang: qolgan sahifalarni Lime Health dizayn tizimiga o'tkazish. Faqat vizual qatlam o'zgaradi.

## 1. Setup (kod yozishdan oldin)

1. Quyidagi fayllarni to'liq o'qi, tartib bilan:
   - AGENTS.md: loyiha, buyruqlar, asosiy qoidalar
   - docs/design-system/README.md: dizayn tizimi (eng muhimi; 9-bo'lim o'tkazish tartibi, 10-bo'lim tekshiruv, 11-bo'lim holat)
   - docs/design-system/reference/components.md va brand-book.md
2. Namuna sifatida tayyor ekranlarni o'qi:
   - src/shared/components/layout/{MainLayout,Sidebar,Header}.tsx
   - src/modules/staff/pages/StaffPage.tsx
   - src/modules/auth/components/LoginForm.tsx
   - src/shared/components/layout/AuthLayout.tsx
   - src/shared/components/ui/{Panel (States.tsx ichida),StatCard,StatusTag,Squiggle}.tsx
   - src/shared/theme/{tokens.ts,antdTheme.ts}, src/styles/{variables.css,global.css}
   - src/shared/icons/index.tsx
3. Muhitni tekshir:
   npm install
   npm run typecheck && npm run check:design && npx oxlint src
   Hammasi toza bo'lishi kerak. Toza bo'lmasa, hech narsani o'zgartirmasdan menga xabar ber.
4. Kodga tegishdan oldin menga qisqa yoz: tizimning 5 ta asosiy qoidasi qanday tushunganing,
   README'dagi 11-bo'limdan qolgan sahifalar ro'yxati, birinchi sahifa uchun reja.

## 2. Ish (sahifalar bittadan)

Navbat: Dashboard → Bemorlar (ro'yxat, karta) → Qabullar (kalendar, yangi qabul, tashrif) → To'lovlar →
Breketlar → Ombor → Eslatmalar → Hisobotlar → Xizmatlar → Sozlamalar → Odontogramma.

Har bir sahifa uchun README'ning 9-bo'limi bo'yicha ishla:
- Avval sahifaning barcha funksiya, maydon, filtr, amal va route'larini ro'yxatla. Ularning birortasi ham yo'qolmasin.
- Lokal karta va qutilarni Panel yoki `rounded-card bg-surface p-5` bilan almashtir. Bo'lim sarlavhalari ostiga Squiggle qo'y.
- Ranglar faqat token klasslari orqali bo'lsin. Bir qatorda bittadan ortiq lime blok bo'lmasin. Lime matn sifatida ishlatilmaydi.
- Ikonkalar faqat @/shared/icons'dan, doira ichida. Chiplar uchun StatusTag. KPI raqamlari `text-3xl font-normal tabular-nums`.
- Jadvallarda ustunlar keraksiz qatorga bo'linmasin (masalan, Bemorlar jadvalidagi "Yosh / jins" ustuni hozir 3 qatorga bo'linyapti).

Taqiqlar:
- Hex rang, inline rang, ichki `ConfigProvider theme`, gradient, blur, bold (600+), kartalarga soya.
- Yangi kutubxona qo'shish, biznes mantiq, API yoki tiplarni o'zgartirish.
- prettier yoki `npm run format`ni ishga tushirish: loyiha uslubiga mos emas, keraksiz diff beradi.
- Commit, push yoki branch yaratish, men aytmagunimcha.
- Tokenlar yoki antd mavzusini o'zgartirish kerak bo'lsa, avval mendan so'ra.

## 3. Har bir sahifadan keyin

1. npm run typecheck && npm run check:design && npx oxlint src (hammasi toza bo'lishi shart)
2. Brauzerda sahifani 1440px va 390px kenglikda ochib tekshir (demo kirish: admin / 123456).
   Tekshiriladi: kontrast, qatorda bitta lime, kartalar panel ustida, gorizontal scroll yo'q, hover va fokus holatlari ishlaydi.
3. docs/design-system/README.md'dagi 11-bo'limni yangila: sahifani "to'liq o'tkazilgan" ro'yxatiga ko'chir.
4. Menga qisqa hisobot yoz:
   - qaysi fayllar o'zgardi;
   - nima o'zgardi (3–6 punkt);
   - tizimdan chetlanilgan joylar va sababi;
   - tekshiruvlar natijasi;
   - qolgan muammolar.
5. To'xta va mening tasdig'imni kut, keyin keyingi sahifaga o't.

Birinchi qadam: 1-bo'limdagi setup'ni bajar va 4-banddagi xulosani yoz. Kodga hali tegma.
```
