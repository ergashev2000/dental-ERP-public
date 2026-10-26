# Copilot uchun yo'riqnoma

Loyiha qoidalari: `AGENTS.md` (buyruqlar, tuzilma, asosiy qoidalar).
UI bilan bog'liq har qanday ishda `docs/design-system/README.md` (Lime Health dizayn tizimi) ga amal qiling;
batafsil manba — `docs/design-system/reference/`.

Eng muhimlari:
- Rang/radius/soya qiymatlari faqat `src/shared/theme/tokens.ts` va `src/styles/variables.css`da; komponentlarda Tailwind token klasslari (`bg-surface`, `bg-panel`, `bg-subtle`, `bg-lime`, `text-ink`, `text-muted`), hex va inline rang yo'q.
- antd mavzusi global (`src/shared/theme/antdTheme.ts`); ichki `ConfigProvider theme` qo'shmang. `type="primary"` — qora pill; lime CTA — `className="btn-lime"`, ekranda bitta.
- Ikonkalar faqat `@/shared/icons` (Hugeicons), 20px, `strokeWidth={1.5}`.
- Lime — sirt rangi, matn emas; qatorda bitta lime blok. Kartalar panel ustida oq, chegarasiz va soyasiz; elementlar pill; bold (600+), gradient, blur yo'q.
- Mavjud ekranni qayta dizayn qilganda funksiya va maydonlarni saqlang — faqat vizual qatlam o'zgaradi.
- Tekshiruv: `npm run typecheck && npm run check:design && npx oxlint src`.
