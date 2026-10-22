---
origin: "style-level distillation from awesome-design-md site analyses (VoltAgent, MIT) + typeui design-skills (Bergside, MIT); a genre abstraction, not any single site's spec"
version: 1
name: black-cinematic
description: "Pure-black luxury and mission cinema as interface: full-viewport photographic and video heroes, uppercase tracked display type floating on darkness, near-zero chrome, at most one scarce accent hue. Pages read like films, revealed one band at a time."
dimensions:
  palette: monochrome_dark
  accent: "custom: mono-led, ≤1 accent"
  typography: system_ui
  display: "custom: uppercase tracked display"
  layout: single_column
  mood: editorial
  density: spacious
  exclude: [gradients]
aliases: [ferrari, lamborghini, bugatti, bmw-m, tesla, spacex, nike, playstation, renault, shopify, runwayml, power, bold]
colors:
  background: "#000000"
  surface: "#161616"
  text-primary: "#ffffff"
  text-secondary: "#999999"
  accent: "#ffffff"
  accent-hover: "#e6e6e6"
  hairline: "#262626"
  on-accent: "#000000"
typography:
  display: { fontFamily: "Oswald, Inter, system-ui, sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, lineHeight: 1.05 }
  body: { fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.6 }
  mono: { fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "0.875rem", lineHeight: 1.5 }
rounded: { sm: 0px, md: 0px, lg: 0px, pill: 9999px }
spacing:
  section-gap: 120
  content-padding: 24
  scale: "4/8/12/16/24/32"
---

## What it is
A black frame with a film playing inside it: every major band is one full-viewport photograph or
autoplaying video carrying a single uppercase, letter-spaced headline and at most one action. UI
chrome nearly vanishes — the nav floats transparently over the imagery, dividers are 1px near-black
hairlines, and body copy stays small, sentence-case, and quiet. Empty black space is the whitespace;
depth comes from the photograph, never from shadows or gradient chrome. Sanctioned variants: white
"chapter" bands may alternate with the black (at most one in three) behind dense content; athletic
campaign pages can burn near-100px uppercase lockups straight into full-bleed photography; commerce
builds run a second transactional track on white or cream, tinted only by pastel tier fills — never
saturated conversion hues — and creative-studio builds go hueless outright, letting the photography
supply every hue on the page while chrome stays colorless.

## Distinguishing moves
- Every hero band is a full-bleed photograph or video covering at least 90% of viewport height; a
  hero assembled from type over a solid fill fails review.
- All display type is uppercase, tracked neutral-to-positive and never tightened below zero; button,
  nav-label, and eyebrow caps always carry at least 1px letter-spacing.
- The top nav overlays the hero with no bar background, border, or shadow until the page scrolls.
- Border radius is binary: 0px on every container, tile, input, and image; rounding appears only as
  fully circular icon buttons or one full-pill ghost CTA.
- Zero box shadows and zero gradient chrome anywhere in the UI — glow and gradient live inside the
  photography, which is graded darker where type must land; elevation is a step between near-blacks,
  never a blur.
- Body copy is sentence-case at 14–16px and weight ≤400 — display tiers do the shouting, body text
  never gains weight.
- Each band carries one primary action (white fill or ghost outline) plus at most one outline
  secondary; a third button fails review.
- Scroll rhythm alternates photo band, quiet text band, photo band; two consecutive text-only bands
  fail the test.

## Accent and color budget
Monochrome is the default: black, white, grays, and photography — zero hue is a valid build, with
white fill or outline carrying every action. If chroma is required, exactly one saturated hue (any
hue — racing red, gold, electric blue, a loud signature yellow) exists for primary CTAs, the
wordmark, and one data highlight: at most two events per viewport. Commerce-variant transactional
tracks may use pastel tier fills — a surface treatment, never a signature hue. Hairlines, body copy,
nav labels, and the canvas are never tinted; imagery supplies every other color.

## Keep / Change / Do-not-copy

| | |
|---|---|
| **Keep** | Full-viewport photographic bands; uppercase tracked display; transparent overlay nav; binary 0-or-fully-round radius; hairline-only separation; near-black surface steps; the one-accent-or-none discipline; the photo-band ↔ quiet-band rhythm. |
| **Change** | The accent hue — or drop it so white stays the only action color; the display register (default heavy condensed cut ↔ a thin 300–330 grotesque at larger sizes); whether the headline overlays the graded photo or sits in clean negative space beside it; white-band frequency; hero subjects and footage per product. |
| **Do-not-copy** | Logos, literal screenshots, exact trade dress, any single source's full token set — including its proprietary display faces, its exact canvas off-black, its pastel palette, and its scoped sub-brand accent hues. |

## Where it fits
Serves saas-landing for launches, high-end brand pages, commerce storefront campaigns, and
creative-studio reels; onboarding as a sequence of one-message reveals; and mobile app splash and
intro screens. Brief moods it
carries: luxury, mission-critical confidence, film-trailer anticipation, flagship showcase. Do not
choose it for dashboard, docs-page, or long-form reading surfaces — heavy uppercase on black
fatigues, and dense data needs chrome this style forbids — nor when genuine product or mission
photography does not exist, because without real imagery the style has nothing left to say.

## Blends
- Atop noir-technical for the dark-technical body: cinematic heroes above a compact, mono-labeled
  interface — one shared darkness, two speeds of density.
- With showroom-gallery: alternate white exhibit-grid chapters inside the black reel; keep black at
  roughly two of every three bands so the canvas reads as cinema, not catalog.
- With warm-editorial: set body copy in a serif beneath the uppercase display for a
  heritage-documentary flavor; story pages only, never utility screens.

## Sources
Distilled from ferrari, lamborghini, bugatti, bmw-m, tesla, spacex, nike, playstation, renault, shopify and runwayml analyses (awesome-design-md, MIT) + power and bold cards (typeui, MIT).
