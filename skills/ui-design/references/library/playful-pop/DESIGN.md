---
origin: "style-level distillation from awesome-design-md site analyses (VoltAgent, MIT) + typeui design-skills (Bergside, MIT); a genre abstraction, not any single site's spec"
version: 1
name: playful-pop
description: Warm cream paper, chunky rounded cards, one warm saturated action hue, character mascots in every section, hard offset shadows, and motion that bounces — picture-book optimism over a working product UI.
dimensions:
  palette: light_clean
  accent: coral
  typography: dm_sans
  display: "custom: rounded friendly display"
  layout: single_column
  mood: playful
  density: balanced
  exclude: [stock_photos]
aliases: [notion, posthog, fiction, lingo, doodle, sketch, creative, expressive, friendly, immersive]
colors:
  background: "#FAF5EC"
  surface: "#FFFFFF"
  text-primary: "#23201B"
  text-secondary: "#6B675C"
  accent: "#F25C3A"
  accent-hover: "#D94E30"
  hairline: "#E9E2D6"
  on-accent: "#FFFFFF"
typography:
  display: { fontFamily: "Baloo 2, Nunito, DM Sans, sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, lineHeight: 1.05 }
  body: { fontFamily: "DM Sans, system-ui, sans-serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.6 }
  mono: { fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "0.875rem", lineHeight: 1.5 }
rounded: { sm: 8px, md: 12px, lg: 20px, pill: 9999px }
spacing:
  section-gap: 88px
  content-padding: 24px
  scale: "4/8/12/16/24/32"
---

## What it is
Illustration-led friendliness: the page is a warm cream sheet (never pure
white) carrying generously rounded white cards, one saturated warm hue doing
all the asking, and a cast of hand-drawn characters living in the margins of
every section, reacting to the copy. Depth is tactile rather than atmospheric
— thick ink outlines or hard offset shadows, never blur — and motion springs:
elements overshoot and settle instead of fading.

## Distinguishing moves
- Page canvas is warm cream, measurably off-white with a warm bias (R ≥ B);
  pure white appears only on cards, chips, and imagery.
- A character mascot or hand-drawn illustration appears in the hero and in the
  margin of every feature band — flat vector or pencil sketch, never photography.
- Cards and tiles use ≥ 16px radii with either a 2px ink outline or a hard
  4–6px offset shadow; blurred drop shadows are absent.
- Primary CTAs are pills (≥ 12px minimum elsewhere) with a physical press:
  2–4px downward translate plus shadow collapse, spring easing with overshoot,
  each neutralized under prefers-reduced-motion.
- Display headings set in a rounded friendly face at weight 700; the body stays
  in the humanist sans — one display face, never two.
- Feature sections alternate soft pastel tints (mint, peach, sky, lavender,
  lemon — one per section, muted saturation) behind white cards.
- Hover states grow rather than dim — scale 1.02–1.05 or a doubled shadow
  offset, never opacity fades.
- Microcopy stays playful and first-person on buttons, empty states, and
  errors, and the mascot reacts to success and failure.

## Accent and color budget
One interaction hue per product; coral is the declared default, but any single
warm saturated hue satisfies the rule. Budget ≤ 2 accent events per viewport
(hero CTA plus one repeat); secondary actions are ink-outline or cream-tinted,
never a second saturated fill. Pastel tints are ambience, not accent — they
never appear on buttons. Body text, navigation, and data are never tinted.

## Keep / Change / Do-not-copy
- **Keep** — cream canvas; the mascot-in-every-section rule; pill CTAs with
  physical press; hard offset shadows; one pastel tint per section; bounce.
- **Change** — recast the mascot for the client's domain; re-point the accent
  to the brand's own warm hue; swap illustration props for the product's
  artifacts.
- **Do-not-copy** — logos, literal screenshots, exact trade dress, any single
  source's full token set; never reuse a source's specific mascot character.

## Where it fits
Strongest on saas-landing, mobile app, and onboarding archetypes; serves
playful, creative, and friendly brief moods — consumer tools, ed-tech,
community and creator products — wherever warmth does the converting. Do not
choose it for data-dense dashboards, trust-critical finance/health/legal
surfaces, or long-form reading.

## Blends
Atop bento-grid when content needs scannability — pastel bento tiles keep the
friendliness while adding structure. With claymorphic when mascots should go
3D-puffy: keep the cream canvas and press physics, add the puff.

## Sources
Distilled from notion, posthog analyses (awesome-design-md, MIT) +
fiction, lingo, doodle, sketch, creative, expressive, friendly, immersive cards
(typeui, MIT).
