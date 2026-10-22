---
origin: "style-level distillation from awesome-design-md site analyses (VoltAgent, MIT) + typeui design-skills (Bergside, MIT); a genre abstraction, not any single site's spec"
version: 1
name: showroom-gallery
description: "A photography-first product museum on a near-white canvas: studio-perfect renders hang in edge-to-edge exhibit bands, chrome recedes behind one desaturated interaction hue and quiet pill CTAs. The gallery stays silent so the artifact alone speaks."
dimensions:
  palette: light_clean
  accent: slate
  typography: system_ui
  display: same_as_body
  layout: asymmetric
  mood: professional_minimal
  density: balanced
aliases: [apple, dji, meta, premium]
colors:
  background: "#ffffff"
  surface: "#f4f5f7"
  text-primary: "#1a1c1f"
  text-secondary: "#5f6368"
  accent: "#475569"
  accent-hover: "#334155"
  hairline: "#e3e4e8"
  on-accent: "#ffffff"
typography:
  display: { fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 600, lineHeight: 1.05 }
  body: { fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.5 }
  mono: { fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "0.875rem", lineHeight: 1.5 }
rounded: { sm: 8px, md: 16px, lg: 32px, pill: 9999px }
spacing:
  section-gap: 64
  content-padding: 32
  scale: "4/8/12/16/24/32"
---

## What it is
A museum of studio-lit product renders: pages stack full-bleed exhibit bands on a near-white canvas,
each holding one large quiet headline, a one-line tagline, at most two compact pill actions, and a
single crisp render mounted on a pedestal of air, with nothing crowding within roughly 40px of the
artifact; asymmetric two-up halls and ~60/40 shop splits keep the layout from reading like slides.
Canvas-tone changes — white to off-white to an occasional near-black band — are the only section
dividers: no border rules between bands, no resting shadows, no gradient chrome. Interaction recedes
to one desaturated hue and a reading-pace body setting, so the artifact, never the interface, stays
the subject.

## Distinguishing moves
- Every band leads with product imagery covering at least 60% of the band's visual area; copy slots
  beneath or beside the render, never above it.
- Major sections separate by canvas-tone change only; a border rule, divider strip, or resting
  section shadow between bands fails review.
- One desaturated slate hue owns every interactive moment — pill fills, inline links, focus rings,
  selection rings; any second hue appears only as tiny rank or eyebrow text, never as a fill.
- Every CTA is a full pill; squared or lightly chamfered action buttons fail review.
- Type discipline: headline weight caps at 600 (button labels may reach 700), body runs 16–17px at
  regular weight with ~1.5 leading, and letter-spacing never goes positive.
- Comparison and spec surfaces render values as large, calm numerals at regular weight — never as
  heavy-weight data tables.
- Resting cards sit flat with hairline borders; soft shadows are reserved for sticky purchase rails
  and floating controls.
- Radius has exactly three regimes: sharp 0px full-bleed tiles, 8–32px inset cards, and fully
  circular icons and swatches — nothing in between.

## Accent and color budget
Expect two to five chromatic events per viewport, all in the single desaturated interaction hue:
primary pill fills, inline links, focus rings, and selection rings. An optional warm micro-accent
may label product rank, but only as small eyebrow text — never a fill or button color. Canvas,
tiles, hairlines, and chrome are never tinted; every other color arrives inside the photography.

## Keep / Change / Do-not-copy

| | |
|---|---|
| **Keep** | Full-bleed exhibit-band rhythm; tone-change-only dividers; the single desaturated action hue; full-pill CTAs; flat hairline cards; calm large spec numerals; the reading-pace body setting. |
| **Change** | Retune the interaction hue to the client's brand, keeping it desaturated; the exhibit column mix (1-up hero halls, 2- and 3-up grids, ~60/40 shop splits); card radius anywhere in 8–32px; near-black band frequency from zero to one in three. |
| **Do-not-copy** | Logos, literal screenshots, exact trade dress, any single source's full token set — including its proprietary typefaces, its exact off-white, its nav chrome proportions, and its commerce-tier accent colors. |

## Where it fits
Serves saas-landing for product showcases and launches, mobile app product galleries, and onboarding
built as walkthrough exhibits. Brief moods it carries: engineered calm, meticulous spec-forward
confidence, gallery stillness, quiet high-end polish. Do not choose it for dashboard or docs-page —
both need navigation chrome and data density this style deliberately removes — nor when studio-grade
isolated product renders do not exist, because brochure-grade photography breaks the museum illusion.

## Blends
- Atop bento-grid for the content layout: museum exhibit bands up top, denser utility cards below
  the fold when a brief needs light data surfaces.
- With black-cinematic: open with one full-bleed dark cinematic hero band, then return to the white
  gallery; more than one dark band in three tips the canvas from museum into cinema.
- With brand-voltage: swap slate for the client's saturated signature hue when a brief needs louder
  energy — keep the chromatic budget, change only the hue's intensity.

## Sources
Distilled from apple, dji and meta analyses (awesome-design-md, MIT) + premium card (typeui, MIT).
