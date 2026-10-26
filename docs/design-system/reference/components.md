# Lime Health — komponent qo'llanmalari (asl manba)

Asl tizimdagi har bir komponentning qoidalari. Markup `bundle.css`dagi `lh-` klasslariga tegishli — bu loyihada ular Tailwind tokenlari bilan qayta yoziladi (SKILL.md, 6-bo'lim).

## Button

Pill button for text actions: lime primary, ink, and outline.

- Markup: `<button class="lh-btn lh-btn--lime|--ink|--outline [lh-btn--sm]">Label</button>`.
- Height `size-control`, `radius-pill`, Lexend 15/500, sentence case, an optional trailing `→`.
- One lime button per view. Use `--outline` for secondary actions such as "Edit profile".
- `--sm` (36px) only inside dense web cards.

## CircleButton

Round icon button used for every secondary action and the primary arrow CTA.

- Markup: `<button class="lh-circle [--sm|--lg] [--ink|--lime|--subtle|--outline]" aria-label="…">` + one 20px outline SVG.
- Sizes: `--sm` (`size-circle-sm`) inside cards, default (`size-circle`) in top bars, `--lg` (`size-circle-lg`) for the arrow CTA and nav.
- `--ink` is the primary action (one per card); `--lime` only on dark or photo grounds; white/`--subtle` for everything else.
- Always give an `aria-label`; the icon is the only visible content.
- Don't put text inside a circle or use two ink circles side by side.

## Chip

Small pill for states, IDs and filters, plus the lime check badge.

- `lh-chip` (grey) for neutral states and IDs, `--lime` for the active/primary state, `--ink` on map or photo grounds, `--outline` on lime blocks.
- `lh-check` = lime circle with ✓ followed by two lines of muted text.
- A coloured `lh-dot` always sits beside a word; colour alone never carries meaning.

## SegmentedTabs

Two or three equal segments; the active one is a white pill.

- Markup: `.lh-seg[role=tablist] > button[role=tab][aria-selected]`.
- Lime container on detail screens; `--grey` inside white cards and on the web.
- Two or three segments, never more.

## SearchBar

Segmented web search pill and the lime map search chip.

- Web: up to three fields split by hairlines (`line`) and a lime "Find →" button inside the pill.
- Map: a lime pill with a search icon and the current query floating over the map.
- Collapse to one field + button below 600px.

## Squiggle

Hand-drawn wave placed under section titles and stacked names.

- Markup: `<svg class="lh-squiggle" viewBox="0 0 26 6"><path d="M1 3c3-3 5 3 8 0s5 3 8 0 5 3 8 0"/></svg>`.
- Place it 4–6px under an app section title (`title`) or a stacked name (`title-stack`), left aligned.
- One per title. Never as a divider across the page.

## Meter

Barcode meter: striped used part, dotted remaining part.

- Markup: `.lh-meter > .lh-meter__used[style=width:N%] + .lh-meter__rest`; add `role="img"` and an `aria-label` with the value.
- Always print the numbers it shows (Total / Spent / Available, 90% / 10%) next to it; the texture is decoration.
- `--sm` (36px) inside coverage cards; default 56px in hero panels.

## Stat

Label-over-value number with a half-size currency sign.

- `lh-stat__label` (10px, `text-muted`) above `lh-stat__value` (22px). Hero values use `lh-num` (36px).
- Currency and units go in `lh-cur` (55% size, muted).
- Use tabular figures; never colour a number green or red, add a word instead.

## ServiceTile

Large tile in a 2-column grid for services or specialties.

- Grid: `.lh-tiles` (2 columns, `space-1.5` gap); tile height 150px.
- Icon circle top-right, label bottom-left on two lines.
- Only the first or selected tile is `--lime`.

## ProviderCard

Doctor or clinic card with acceptance badge, stacked name, rating and arrow CTA.

- Consumer provides: acceptance state, name (split into lines), rating, review count, the action.
- Sits on `surface-panel` or a map, never directly on white.
- Name in `title-stack`, one word per line, followed by the squiggle.
- The ink arrow opens the profile; the hint "Swipe to next" appears only in carousels.

## VisitCard

Claim/visit summary card: date, provider, amount, claim ID and arrow.

- Consumer provides: status, date, provider, amount + label, claim ID, the action.
- The active/most recent claim uses `lh-card--lime` (optionally `lh-stack-olive` for the stacked look); the rest are white `lh-card`.
- Status chip top-left, people circle top-right, arrow bottom-right — keep these positions in every list.

## CoverageCard

Insurance coverage card with split barcode meter.

- Consumer provides: service name, total, covered %, patient %.
- The striped part is what insurance pays, the dots what the patient pays; print both percentages.

## ChatMessage

Chat bubbles, lime approval card and composer.

- Messages are white `lh-msg` cards on `surface-panel`; system results (approvals, payments) are `lh-msg--lime` with big numbers.
- Composer: attach circle, text field, ink send circle.
- Attachments are white tiles with a document thumbnail and file name.

## BottomNav

Floating row of three circles with the black primary in the middle.

- Floats `space-4` above the bottom safe area, centred; never a full-width bar.
- Exactly three items; the centre `--ink` circle is the main action (search/book).
- A badge (`lh-badge`) marks new items; describe the count in `aria-label`.

## PhotoCaptionCard

Photo block with frosted caption and big white headline.

- Consumer provides: a real photo (people, neutral grey background), brand name, one headline sentence.
- The caption covers the bottom 40–50%, blurred, with white Inter Tight 44px.
- Use in marketing grids beside `ink` and `lime` blocks of the same size.

## FacePillHeadline

Big headline with an inline lime pill holding a portrait.

- Consumer provides: the headline text and a square portrait (set as `background-image` on `.lh-face`, with an `aria-label`).
- One face-pill per headline, placed after the 2nd–3rd word.
- Works in `ink` on white and white on `ink`.
