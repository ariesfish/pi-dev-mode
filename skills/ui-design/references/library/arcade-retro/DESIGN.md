---
origin: "style-level distillation from awesome-design-md site analyses (VoltAgent, MIT) + typeui design-skills (Bergside, MIT); a genre abstraction, not any single site's spec"
version: 1
name: arcade-retro
description: Era nostalgia as interface chrome — bitmap-pixel display type and terminal-mono text, CRT-dark or 90s-paper surfaces, period-quantized flat palettes, bevel-and-rule panel chrome, chunky buttons that physically press.
dimensions:
  palette: "custom: CRT dark or era paper"
  accent: electric_blue
  typography: "custom: pixel/terminal mono"
  display: "custom: pixel display"
  layout: single_column
  mood: playful
  density: compact
  exclude: [gradients]
aliases: [dell-1996, nintendo-2001, pacman, sega, tetris, retro, vintage]
colors:
  background: "#0A0C16"
  surface: "#131A2E"
  text-primary: "#E6EBFF"
  text-secondary: "#8D94B8"
  accent: "#2E6CFF"
  accent-hover: "#4D84FF"
  hairline: "#2A2F52"
  on-accent: "#FFFFFF"
typography:
  display: { fontFamily: "Press Start 2P, Silkscreen, VT323, monospace", fontSize: "clamp(1.75rem, 4vw, 3rem)", fontWeight: 700, lineHeight: 1.2 }
  body: { fontFamily: "VT323, Space Mono, ui-monospace, monospace", fontSize: "1.125rem", fontWeight: 400, lineHeight: 1.5 }
  mono: { fontFamily: "Space Mono, ui-monospace, monospace", fontSize: "0.875rem", lineHeight: 1.5 }
rounded: { sm: 0px, md: 0px, lg: 4px, pill: 9999px }
spacing:
  section-gap: 40px
  content-padding: 16px
  scale: "4/8/12/16/24/32"
---

## What it is
Interface chrome that remembers the arcade and the early web: bitmap-pixel
display type, terminal-mono UI text, surfaces built as either a dark CRT
screen or a period paper/metal panel, and flat color quantized to a small
era-true set. Nothing is soft — depth comes from bevel ridges, hard offset
shadows, and thick rules — and every button visibly presses into the page.
The payoff is instant nostalgia: a machine you played, not a document you read.

## Distinguishing moves
- Type is period-true throughout: display in a bitmap pixel face, everything
  else in a terminal mono — any modern humanist sans in a font stack fails
  the review.
- Exactly one era surface per build, never mixed: CRT dark (near-black with
  one phosphor hue; optional scanline or dither texture) or 90s paper/metal
  (flat fills, 1px ink borders, bevel ridges, a literal page frame).
- Buttons press physically: a 3–4px solid offset block under the button at
  rest; :active translates 3–4px and collapses it; no blurred shadow, no
  gradient anywhere.
- Chrome labels (nav words, section bars, button text) are uppercase with
  ≥ 0.5px tracking — silkscreened legends, never sentence case.
- Palette is a fixed quantized set: ≤ 5 chromatic era hues plus ink and paper
  in flat fills; dithering allowed for mid-tones, translucency kept minimal.
- One interactive accent (electric blue default) marks links, active states,
  and primary buttons; decorative hues never signal interactivity.
- Compact density: section gaps ≤ 48px, sections closed by hard 1–2px rules
  or banner bars — whitespace is never the primary separator.
- Pill radius is spent only on arcade-style primary action buttons and radio
  dots; every other corner is 0px (4px ceiling on large panels).

## Accent and color budget
The interactive accent is one hue — electric blue is the declared default for
the CRT surface. All other chroma comes from the fixed era set and stays
decorative: one hue per tile or banner section at a time, no blends. Never
tinted: body text, the ink/paper base pair, and control geometry — meaning
comes from press physics, not color.

## Keep / Change / Do-not-copy
- **Keep** — the pixel-display + terminal-body type split; press-physics
  buttons; the single-era-surface rule; the quantized flat palette;
  uppercase tracked legends.
- **Change** — pick the era surface (CRT dark default ↔ 90s paper/bevel
  metal) and re-point the era hue set to that period; drop to a plainer
  terminal face when long copy demands legibility.
- **Do-not-copy** — logos, literal screenshots, exact trade dress, any single
  source's full token set; never reproduce trademarked console logos, rating
  badges, or mascot art.

## Where it fits
At home on saas-landing and mobile app onboarding for games, entertainment,
and creator products, plus event and promo pages; serves playful and
brutalist moods where nostalgia is the hook. Do not choose it for data-dense
dashboards, long-form docs, or trust-critical finance/health surfaces —
pixel type and compact density tax comprehension.

## Blends
Over neon-terminal when a game or data product needs dense terminal tables
inside CRT chrome. With playful-pop in paper mode — mascots and bounce motion
slot straight into the cream-paper variant.

## Sources
Distilled from dell-1996, nintendo-2001 analyses (awesome-design-md, MIT) +
pacman, sega, tetris, retro, vintage cards (typeui, MIT).
