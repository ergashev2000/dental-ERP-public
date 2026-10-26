# Oq Tabassum Dental — klinika boshqaruv paneli (MVP, frontend)

Vite + React 19 + TypeScript (strict) · Ant Design v5 · Tailwind v4 · nuqs · TanStack Query · zustand · dayjs.
Backend yo'q — barcha ma'lumot `src/shared/lib/mock` dagi in-memory mock API orqali (sahifa yangilansa seed holatiga qaytadi).

## Ishga tushirish

```bash
npm install
npm run dev            # http://localhost:5173
npm run typecheck      # tsc --noEmit
npm run lint           # oxlint
npm run check:design   # dizayn tizimi qoidalari: gradient, blur, hex rang, lime matn, bold, ikonka importi
npm run build
```

Demo akkauntlar (parol `123456`): `admin` (boshqaruvchi), `dr.aziz`, `dr.nilufar` (shifokor), `reception` (registratura).

`.env` → `VITE_MOCK_CALLS=true` — eslatma qo'ng'iroqlari simulyatsiyasi (har 20 s da navbatdagi qo'ng'iroq, 5 s da natija).

## Tuzilma

```
src/app/            AppProvider, router, global UI store
src/modules/<m>/    api/ hooks/ components/ pages/ types/ store/ index.ts  (tashqariga faqat index.ts)
src/shared/         theme/tokens.ts (yagona rang manbasi), theme/antdTheme.ts, icons/ (Hugeicons), components/ui, components/layout,
                    lib/mock (seed, mockDb, biznes qoidalar ops/, callSimulator), utils (fdi, schedule, format)
src/styles/         global.css (layer tartibi, print), variables.css (Tailwind tokenlari)
```

Real backendga o'tishda faqat `modules/*/api/*.ts` fayllari `shared/lib/axios.ts` ga almashtiriladi — har funksiya ustida endpoint izohi bor.

## Dizayn tizimi

UI — **Lime Health** dizayn tizimi: [docs/design-system/README.md](docs/design-system/README.md) (tokenlar, antd, komponentlar, sahifa namunalari, tekshiruv).
AI vositalari uchun: `AGENTS.md` (Codex, Cursor, Copilot va boshqalar), `CLAUDE.md` + `.claude/skills/lime-health-design-system`,
`.cursor/rules/design-system.mdc`, `.github/copilot-instructions.md` — hammasi shu hujjatga yo'naltiradi.
Qolgan sahifalarni o'tkazishni boshqa AI agentga topshirish uchun tayyor prompt: [docs/design-system/MIGRATION_PROMPT.md](docs/design-system/MIGRATION_PROMPT.md).

## Spetsifikatsiyadan ongli farqlar

- **Rang**: Lime Health tizimi — lime sirt, ink asosiy amal, oq/kulrang sirtlar; ilovaga xos kengaytmalar `docs/design-system/README.md` 12-bo'limida.
- **Linter**: loyihada ESLint o'rniga oxlint (ESLint-mos qoidalar) + Prettier.
- **Material normasi**: T104 ga "Vaqtinchalik plomba 1 g", D003 ga "Rentgen plyonkasi 1 dona" qo'shildi — seed tekshiruv holatlari (tugagan material ogohlantirishi, muddati o'tgan partiya FEFO'da o'tkazib yuborilishi) ishlashi uchun.
- **Profilaktika eslatmasi** alohida qoida emas, "Qoidalar → Profilaktik ko'rik" sozlamasi sifatida.
- **Bo'sh slotlar** Select ichida emas, forma ichida chiplar ko'rinishida (bir bosishda tanlanadi).
