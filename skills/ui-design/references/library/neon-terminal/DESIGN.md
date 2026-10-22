---
origin: "style-level distillation from awesome-design-md site analyses (VoltAgent, MIT) + typeui design-skills (Bergside, MIT); a genre abstraction, not any single site's spec"
version: 1
name: neon-terminal
description: A trading-floor terminal on a flat near-black sheet — monospaced numerics everywhere, dense hairline quote tables, one neon hue driving every interaction, two-pixel corners, density over decoration.
dimensions:
  palette: monochrome_dark
  accent: emerald
  typography: system_ui (mono-led)
  display: same_as_body
  layout: two_column
  mood: brutalist
  density: compact
  exclude: [gradients]
aliases: [binance, 1win, opencode.ai, matrix, mono]
colors:
  background: "#0C0F12"
  surface: "#161C22"
  text-primary: "#E3E8EE"
  text-secondary: "#8A94A0"
  accent: "#00D68F"
  accent-hover: "#00EF9E"
  hairline: "#232A32"
  on-accent: "#05130C"
typography:
  display: { fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, lineHeight: 1.05 }
  body: { fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.6 }
  mono: { fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "0.875rem", lineHeight: 1.5 }
rounded: { sm: 0px, md: 2px, lg: 4px, pill: 9999px }
spacing:
  section-gap: 48px
  content-padding: 16px
  scale: "4/8/12/16/24/32"
---

## What it is
A trading floor compressed into a browser tab: one flat near-black sheet,
monospaced numerics in every cell of every table, hairline-separated quote
rows, corners clipped to ~2px, and a single neon hue that lights up each
interactive element and nothing else. Density is the aesthetic — rows, ticks,
and panels pack tightly, and the surface never decorates itself with
gradients, glows, or shadows. It should read as professional terminal
hardware, not as a website. One light manpage variant inverts the canvas —
warm cream paper, near-black ink, hairline-bordered text blocks, bracketed
ASCII marker bullets — for terminal-native reading surfaces.

## Distinguishing moves
- The canvas is one flat near-black tone end-to-end; elevation is exactly one
  surface step (canvas → surface) plus a 1px hairline — no shadows, no gradients.
- Every number (price, percent, size, timestamp, balance) renders in the mono
  face with tabular figures; body prose never does.
- One neon hue — emerald by default; any single saturated hue satisfies the
  rule — drives all interaction: primary CTA fill, active tab, links, focus ring.
- Data tables right-align numeric columns, keep rows ≤ 44px tall, divide with
  1px hairlines, and tint up/down direction as text color in cells only,
  never as row or badge fills.
- Controls and panels hold radius at ≤ 2px (4px ceiling on large containers);
  the only circle allowed is a ≤ 8px status LED.
- Sticky top chrome stays ≤ 64px tall and carries a live mono ticker strip.
- Hover and pressed states swap a solid brighter-or-darker value — no opacity
  washes, no blurred glow, no grow animations.

## Accent and color budget
Exactly one neon interaction hue (emerald default) with ≤ 3 chromatic events
per viewport: the primary CTA, one active-state indicator, the focus ring.
Up/down market semantics are the only other chroma and exist solely as text
color inside data cells. Never tinted: card surfaces, body prose, table row
backgrounds, and navigation chrome.

## Keep / Change / Do-not-copy
- **Keep** — the flat surface ladder; the mono-numerics rule; hairline table
  rhythm; ~2px corners; one-hue interaction; direction tints confined to data.
- **Change** — re-point the neon hue at the brand's single saturated color;
  re-column the tables to the product's own data; re-theme the ticker strip.
- **Do-not-copy** — logos, literal screenshots, exact trade dress, any single
  source's full token set — including any source's exact exchange chrome
  (order-book layouts, candle styling, brand-yellow-on-black CTAs).

## Where it fits
Built for dashboard and desktop app archetypes — trading, monitoring,
analytics, ops consoles; serves brutalist and technical moods where density
signals capability. Do not choose it for marketing storytelling, onboarding,
or any reading-heavy surface where monospace and density tax comprehension.

## Blends
With noir-technical for the marketing and docs pages around the terminal
product — same restraint, more air. Arcade-retro can ride the same dark
surface when the product wants CRT-era nostalgia instead of exchange
modernity.

## Sources
Distilled from binance, 1win, opencode.ai analyses (awesome-design-md,
MIT) + matrix, mono cards (typeui, MIT).
