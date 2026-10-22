---
origin: "style-level distillation from awesome-design-md site analyses (VoltAgent, MIT) + typeui design-skills (Bergside, MIT); a genre abstraction, not any single site's spec"
version: 1
name: atmospheric-wash
description: Emotion-led gradients drive the design — sky, sunset, aurora, or pastel-mesh washes open and close every page, product imagery floats dreamlike in soft frames, and controls stay quiet so the light tells the story. Optimistic, cinematic, and calm, never loud chrome.
dimensions:
  palette: light_clean
  accent: "custom: gradient-led pair"
  typography: inter
  display: same_as_body
  layout: single_column
  mood: editorial
  density: spacious
  exclude: []
aliases: [mistral.ai, superhuman, mintlify, together.ai, slack, gradient, colorful]
colors:
  background: "#ffffff"
  surface: "#faf6ee"
  text-primary: "#1f2229"
  text-secondary: "#5d6270"
  accent: "#e8623c"
  accent-hover: "#c74d2c"
  hairline: "#e7e0d4"
  on-accent: "#ffffff"
typography:
  display: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "clamp(2.25rem, 5vw, 3.75rem)", fontWeight: 500, lineHeight: 1.05 }
  body: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.5 }
  mono: { fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "0.875rem", lineHeight: 1.5 }
rounded: { sm: 4px, md: 8px, lg: 16px, pill: 9999px }
spacing:
  section-gap: 96px
  content-padding: 32px
  scale: "4/8/12/16/24/32"
---

## What it is
A landing language where light does the emotional labor. Pages open on a full-bleed gradient
wash — dawn, dusk, aurora, or a blurred pastel mesh — diffused softly across photography or a
gentle 3D render, with the product floating dreamlike above it. Below the hero everything goes
quiet and paper-toned, punctuated only by pastel stat tiles, and every page closes on a second
wash or a deep brand-toned band so the atmosphere returns once before the end. Chrome stays
nearly colorless on purpose: neutral controls, hairline cards, mid-weight type — the wash is
the brand.

## Distinguishing moves
- The hero is a wash, never a flat fill: two to four stops (or a blurred mesh) covering ≥60% of
  the first viewport, as pure CSS or as light diffused across photography or a 3D render, and
  free to bleed past the content container's edge. Check: the hero surface is a gradient that
  reads diffused, not striped.
- Washes stay harmonious: saturated stops walk one direction around the hue wheel — sunset
  (red-ochre to cream), aurora (teal to mint), or a spectral ribbon (orange to magenta to
  periwinkle) — while hue-spanning washes desaturate into a pastel mesh of peach, lavender,
  and dusty green blurred at large radii. Check: no saturated complementary pairing on screen.
- A multi-stop ribbon is one object: it renders at hero scale in a fixed stop order, is never
  cropped to a single swatch, and is never miniaturized to badge or icon scale. Check: the
  ribbon appears once, large.
- Two structural washes per page: the hero opens on one, and the page closes on a gradient or
  deep brand-toned band holding exactly one CTA; surfaces between them are flat paper. A pastel
  mesh may persist as a page-wide ambient ground, never as a locally tinted card or section.
  Check: the closing band exists, holds one action, and no component-level gradients sit
  between the two washes.
- Controls are quiet in fill: CTAs default to ink or near-black, white inside dark washes;
  exactly one control per page may take a saturated fill — the wash's vivid edge or a deep
  brand ink. Generously padded pills and restrained 8px rectangles are both native; pick one
  geometry per product. Check: ≥2 of every 3 CTAs are neutral-filled, geometry consistent.
- Product framing floats above the wash: the hero mockup sits in a 12–16px rounded frame with
  at most one diffuse `0 24px 48px rgba(0, 0, 0, 0.12)` drop — never a hard-border cabinet; the
  wash does the lifting. Check: computed radius and shadow on the hero's product frame.
- Display type is mid-weight and tight: weight 400–600, tracking −0.5% to −2% em, line-height
  ≤1.1 at hero scale; technical eyebrows may run uppercase micro-mono with positive tracking.
  Check: the h1 meets all three numeric constraints.
- Pastel stat tiles: big numbers may sit on pale tinted tiles drawn from the wash's own pale
  end, at most three per page, never a new hue. Check: each tile tint maps to a desaturated
  wash stop.

## Accent and color budget
The wash is the accent and the chrome is nearly colorless. Budget per page: one hero wash, one
closing band (it may repeat the hero's stops), ≤3 pastel stat tiles, and one saturated control
(a CTA, badge, or focus ring). Declared defaults — light hero
`linear-gradient(180deg, #9db8d8 0%, #f7edda 100%)`; dusk hero
`linear-gradient(135deg, #232b4d 0%, #2e5148 100%)`; mesh hero `radial-gradient` blobs of
peach, lavender, and pale sage at low saturation; the `accent` token is the wash's vivid edge,
used for links and focus states. Photography beneath a wash may be as rich as the brand likes;
tinted UI fills may not.

## Keep / Change / Do-not-copy
- Keep: the open-and-close wash ritual, quiet CTA fills, warm paper body surfaces with pastel
  stat tiles, products floating above the wash, mid-weight tight display type, and the pill
  CTA's generous padding wherever the brand runs warm.
- Change: swap the wash family freely — dawn, dusk, aurora, spectral ribbon, or pastel mesh;
  flip hero polarity between paper and near-black, keeping the wash as the color; swap the
  display face for a brand voice at the same mid-weight.
- Do-not-copy: logos, literal screenshots, exact trade dress, or any single source's full token
  set; never reuse the source imagery — those mountains, portraits, and rocket launches are
  identities; and never lift a single brand's mark color wholesale as the deep band tone.
  Stage the brand's own dreamy scene instead.

## Where it fits
Best on mobile-app onboarding and saas-landing pages whose promise is felt rather than
compared, plus editorial launch pages and cinematic product reveals. Moods served: dreamy,
optimistic, calm, friendly, softly futuristic. Not for dashboards, docs pages, or any
data-dense surface — a wash behind a table reads as noise — and not when the brief wants
hard-edged, brutally clear conversion.

## Blends
- Over glassmorphic: frosted panels float beautifully on a wash; make the hero mockup glass
  over gradient and keep the rest hairline-flat.
- Atop bento-grid: when the body below the hero needs feature tiles, keep the wash above and
  let the grid carry the middle of the page.
- With black-cinematic: for dark end-to-end reveals, keep the dusk palette and borrow its
  full-bleed photography discipline, reserving the wash for openings and closings.

## Sources
Distilled from mistral.ai, superhuman, mintlify, together.ai, slack analyses (awesome-design-md, MIT) + gradient, colorful cards (typeui, MIT).
