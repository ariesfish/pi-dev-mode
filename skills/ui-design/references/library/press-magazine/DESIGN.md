---
origin: "style-level distillation from awesome-design-md site analyses (VoltAgent, MIT) + typeui design-skills (Bergside, MIT); a genre abstraction, not any single site's spec"
version: 1
name: press-magazine
description: A wire-service broadsheet on the web: white paper, black ink, one saturated marker accent. Heavy masthead-class display heads a dense asymmetric grid; hairline rules do all separation; controls invert to black pills while imagery stays square-cropped.
dimensions:
  palette: light_clean
  accent: "custom: B/W-led, ~1 accent"
  typography: inter
  display: "custom: heavy editorial display"
  layout: asymmetric
  mood: editorial
  density: compact
  exclude: [gradients]
aliases: [theverge, wired, aljazeera, elevenlabs, figma, minimax, editorial, artistic, basic]
colors:
  background: "#ffffff"
  surface: "#f4f4f4"
  text-primary: "#0d0d0d"
  text-secondary: "#5f5f5f"
  accent: "#e85d00"
  accent-hover: "#c44a00"
  hairline: "#dcdcdc"
  on-accent: "#ffffff"
typography:
  display: { fontFamily: "Archivo Black, Oswald, Impact, sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, lineHeight: 1.05 }
  body: { fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.6 }
  mono: { fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "0.875rem", lineHeight: 1.5 }
rounded: { sm: 0px, md: 2px, lg: 4px, pill: 9999px }
spacing:
  section-gap: 48px
  content-padding: 24px
  scale: "4/8/12/16/24/32"
---

## What it is
A news front page rendered as an interface: stark white paper set with near-black ink, where
hierarchy comes from type weight, column structure, and 1px hairline rules — never from shadows,
tonal cards, or gradients. A masthead-class display face carries the wordmark and lead headlines
at sizes marketing sites never reach, while one sans family (plus a mono for wire-style labels)
handles everything else. The grid is dense and asymmetric — lead story, secondary columns, a rail
of metadata — packed like column inches, separated by rules instead of cards. Controls invert to
black pills, the only soft shapes in a hard-edged system, and a single saturated accent works as
a marker pen, never as a theme.

## Distinguishing moves
- Canvas is pure white (at most ~4% off-white) with near-black ink; no mid-tone fills except one flat grey panel per view.
- The display/wordmark face runs ≥ 64px at the page top, never drops below ~48px, and never appears in body, label, or button roles.
- Kickers, section labels, bylines, and timestamps are uppercase with 0.5–2px tracking in the body sans or mono — a third type family is a violation.
- The news grid is asymmetric and dense (lead + secondary column + rail); rows separate by 1px hairline rules, and no resting card casts a shadow.
- Every button is a black pill or its white-outline twin (the black-pill duality); imagery and content containers stay square (≤ 4px radius).
- Story hierarchy is weight-stacked inside one sans family (300 eyebrows / 700 headlines / 900 urgent labels); no second display face at body scale.
- Accent usage: ≤ 2 chromatic events per viewport from one saturated hue — masthead mark + eyebrow bar, or one promo pill, or one link style.
- Variant: one oversized solid pastel color-block panel per scroll may replace the grey section — flat fill only, page returns to white between blocks.

## Accent and color budget
Color is rationed like a marker pen. One saturated hue — any hue — fills at most two small events
per viewport: logo block, section-eyebrow bar, a single promo CTA, or one link style. Live or
urgency red is a semantic state reserved for live coverage, not decoration. Never tinted: body
text, hairline rules, buttons (black pills only), and mid-tone panels. The pastel color-block
variant carries no accent at all — pastel panels are surfaces, not markers.

## Keep / Change / Do-not-copy
**Keep** — the black-on-white duet; masthead-class display type; the dense hairline grid; black-pill
controls; the one-marker accent budget; square-cropped photography.
**Change** — the accent hue (any single saturated hue); the display school (heavy condensed grotesque
at weight 700–900, or a tall high-contrast serif at 400); the marker accent's role (logo block,
eyebrow bar, or link style); whether pastel color-blocks appear at all; image-frame radius within
0–10px.
**Do-not-copy** — logos, literal screenshots, exact trade dress, any single source's full token set.

## Where it fits
Archetypes: saas-landing where editorial authority is the pitch, and docs-page where the sidebar +
prose + TOC columns want newspaper density; mobile app for news-reader and live-coverage apps.
It is the natural genre for publication-shaped surfaces — news hubs, tech and culture magazines,
research and analyst brands, release notes, model and product catalogs. Sell the wire voice with
uppercase section labels, byline rows, and timestamped rails. Data-dense tables ride comfortably
here when they read as printed listings — hairline rows, weight-stacked headers, no zebra fills.
Brief moods served: editorial, authoritative, pressing, rigorous, monochrome. Do not choose it
when a brief asks for warmth or human softness (warm-editorial owns that register), playful
energy, ambient gradients, or dark-led cinematic staging.

## Blends
Atop bento-grid for template galleries and feature grids — bento supplies the tessellation, the
white paper and hard rules stay in charge. With neobrutalist when the color-block variant should
get louder: borrow its flat vivid block set and bold rules for panel moments, but keep the
black-pill white-paper frame that separates this genre from it.

## Sources
Distilled from theverge, wired, aljazeera, elevenlabs, figma, minimax analyses (awesome-design-md, MIT) + editorial, artistic, basic cards (typeui, MIT).
