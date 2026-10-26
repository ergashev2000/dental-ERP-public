Lime Health is a bold, friendly healthcare UI language: electric lime, pure black and white on soft grey, giant rounded surfaces, circles everywhere and editorial grotesk headlines. It is built for patient apps (booking, claims, insurance, chat), their web landing pages and social/marketing blocks.

## Principles

- **Three colours carry everything.** `lime`, `ink`, `surface` (+ the grey `surface-panel`). Status reds and greens stay small and always come with a word.
- **Lime is a surface, not a text colour.** Fill whole cards, the active segment, the status chip, the face-pill or the CTA with `lime`; put `on-lime` text on it. Never set lime text on a light ground.
- **One lime block per row.** On app screens lime marks the hero item (the first service tile, the active claim, the approved message). If everything is lime, nothing is.
- **Round or circular, never sharp.** Cards `radius-card`, sheets `radius-sheet`, marketing blocks `radius-block`, every control `radius-pill`.
- **Calm data.** Numbers are big and light (`numeral`), labels small and muted, progress drawn as texture (the barcode meter), never as coloured charts.

## Content fundamentals

- Voice: warm, short, reassuring. Second person ("Book an appointment within seconds.", "Your healthcare information is securely stored.").
- Sentence case everywhere, including buttons ("Find", "Edit profile", "Type your message"). No ALL CAPS, no exclamation marks, no emoji.
- Headlines end with a full stop on marketing surfaces; UI labels do not.
- Names of people and clinics are stacked one word per line in `title-stack` ("Amelia / Stone / MD").
- Money: `$` sign at half size in `text-muted`, then the value (`$ 820`, `$ 1500`). Percentages with a small `%`.
- States are words in chips: "In progress", "Approved", "In-Network", "Accepting New Patients".

## Colour

- Page: `surface`. Grey hero panels and section blocks: `surface-panel`. Cards on top: `surface-card`.
- Inputs, chips, empty meter tracks: `surface-subtle`.
- Text: `text` for content, `text-muted` for labels and dates (passes 4.5:1 on panel and card), `text-subtle` for hints on white cards only.
- Primary action: an `action` circle with an `on-action` arrow (ink in light, white in dark; always ink on lime), or a `lime` pill with `on-lime` text.
- Stacked lime cards get an `olive` layer peeking out behind them.
- Focus: a solid 2px `focus` ring with 2px offset on every interactive element.
- Dark theme: same lime and ink; surfaces drop to near-black, cards to `surface-card` dark. Chat and stories often run dark.

## Typography

- Two faces from Google Fonts: **Inter Tight** (`--font-display`) for big marketing headlines, **Lexend** (`--font-ui`) for everything inside the app. Load: `https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500&family=Lexend:wght@300;400;500&display=swap`.
- Marketing: `display-xl` / `display` / `headline`, tight tracking, weight 400–500, never bold. A grey second line or word is allowed for emphasis (`text-muted`).
- App: `title-stack` for names, `numeral` for values, `title` for section titles, `body` / `body-sm` for copy, `label` / `micro` for meta.
- Every app section title is followed by the **squiggle** (`.lh-squiggle`, 26×6 wave in `text`).
- The **face-pill**: a lime pill holding a small portrait, placed inline between headline words ("Book local [face] doctors").

## Spacing and layout

- 4px base: `space-1` … `space-12`. Screen side padding `space-5`; card padding `space-5`; app sections `space-8` apart.
- Service tiles and bento blocks sit almost touching: `space-1.5` (app) or `space-1` (marketing).
- App home: grey photo hero with two `size-circle` buttons in the corners → stats + meter → "Services" title → 2-column tiles (first `lime`) → floating bottom nav.
- Web: left-aligned hero, segmented search pill (3 fields + lime "Find →"), specialty tiles, alternating image/text rows, 2-column bento of `ink` / `lime` / photo blocks.

## Shape, depth and imagery

- No borders on cards; separation comes from the `surface-panel` behind them. The only shadow is `shadow-float`, for floating nav and map cards.
- Photos: real people, neutral grey backgrounds, soft daylight. Portrait cut-outs sit on `surface-panel`. Marketing photo cards carry a frosted caption panel at the bottom (`.lh-caption`) with white `display` text.
- Textures: barcode stripes + dot grain (`.lh-meter`) and the squiggle are the only decorative marks.

## Iconography

- Thin outline icons, 1.5px stroke, 20px, in `text` or `on-ink` (Lucide matches well). Always centred in a circle (`size-circle-sm` inside cards, `size-circle` in bars).
- Specialty tiles use playful hand-drawn doodles in `lime` + `ink`; commission or draw your own, do not reuse the reference set.
- No emoji, no filled multicolour icons.

## Components

Circle button, Button (pill), Chip, Squiggle, Meter, Stat, Provider card, Visit card, Coverage card, Service tile, Segmented tabs, Bottom nav, Search bar, Chat message, Photo caption card, Face-pill headline. Styles live in `components/bundle.css` (classes prefixed `lh-`); each component's README lists the markup it expects.

## Using this system with AI

Give the agent this README, `tokens.json` (or `tokens.css`) and `components/bundle.css`, plus the Reference images. Then ask: "Redesign my [screen/app] with the Lime Health design system. Keep every feature and data field; change only the visual layer; use only its tokens and `lh-` components."
