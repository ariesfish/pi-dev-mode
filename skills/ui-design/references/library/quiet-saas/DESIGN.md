---
origin: "style-level distillation from awesome-design-md site analyses (VoltAgent, MIT) + typeui design-skills (Bergside, MIT); a genre abstraction, not any single site's spec"
version: 1
name: quiet-saas
description: "A near-white paper canvas with dark-ink type and air as the main material — one accent hue carries every conversion action while everything else stays neutral, flat, and undecorated; the product's own UI is the only imagery."
dimensions:
  palette: light_clean
  accent: electric_blue
  typography: inter
  display: same_as_body
  layout: single_column
  mood: professional_minimal
  density: balanced
  exclude: [gradients, stock_photos]
aliases: [airtable, expo, cal, supabase, vercel, ollama, clean, minimal, sleek, spacious, geometric, codex, levels, professional, flat, contemporary, square]
colors:
  background: "#FFFFFF"
  surface: "#F7F8FA"
  text-primary: "#17181C"
  text-secondary: "#4E5561"
  accent: "#3B82F6"
  accent-hover: "#2563EB"
  hairline: "#E5E7EB"
  on-accent: "#FFFFFF"
typography:
  display: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 600, lineHeight: 1.1 }
  body: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.6 }
  mono: { fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "0.875rem", lineHeight: 1.5 }
rounded: { sm: 6px, md: 8px, lg: 12px, pill: 9999px }
spacing:
  section-gap: 96px
  content-padding: 32px
  scale: "4/8/12/16/24/32"
---

## What it is

The quiet workhorse of B2B software marketing: a near-white paper canvas where dark-ink type does the work and empty space does the framing.
Color is scarce on purpose — one accent hue owns every conversion moment, and everything else sits on a gray ladder of canvas, surface, and hairline.
Nothing is decorative by design: no gradient washes, no glow, no illustration systems; the page shows real product UI and otherwise stays out of its own way.
Calm reads as competence — the bands run generous, the card interiors stay compact, restraint is the brand, and the whitespace is the design.

## Distinguishing moves

- **Canvas check:** the page background is white or a barely-cooler off-white, and the hero has no backdrop, wash, or imagery behind the headline.
- **Scarcity check:** at most one filled accent button per viewport; every secondary action is white-with-hairline or ink-dark, never a second colored fill.
- **Scope check:** the accent appears only on primary CTAs, inline links, and active/focus states — never on body copy, decorative icons, dividers, or section fills.
- **Type check:** display uses the body family at weight ≤600 with negative tracking above 32px (roughly −0.01em to −0.03em); no heading runs heavier than 600.
- **Rhythm check:** every major band is separated by the same section gap (96px) inside a centered ≤1280px column, with spacing snapped to a 4/8 base.
- **Depth check:** cards lift on 1px hairlines plus at most one faint shadow tier; no stacked elevation, no glow, no gradient chrome.
- **Imagery check:** every visual is real product UI — dashboards, data tables, code, terminal output set in the mono face — not illustrations or lifestyle photography.
- **Polarity check:** at most one dark surface per page (the featured pricing tier or the footer); the page never inverts twice in a row.

## Accent and color budget

≤2 chromatic events per viewport: one filled accent CTA plus accent links and active states — nothing else takes color.
Section bands alternate only between white and one off-white surface tone; two light steps, never a third.
Backgrounds, cards, icons, and borders stay on the gray ladder; extra hues live inside product-UI fragments and charts, never in the page chrome.
Avatar fills and status pastels stay under ~5% of viewport area — garnish, not theme.
Legal dialect: an ink-dark primary CTA with the accent scoped to links and focus states is in-genre — pick ink or accent for the fill, never both.

## Keep / Change / Do-not-copy

| Split | Pre-written guidance |
|---|---|
| **Keep** | The paper-canvas plus ink hierarchy; single-accent scarcity; the 96px band rhythm; hairline-only depth; real product UI as the only imagery; one dark moment per page. |
| **Change** | The accent hue (any single saturated hue — indigo, emerald, blue, violet — works); the neutral grotesque (the system stack is fine); the ink-vs-accent CTA dialect. |
| **Do-not-copy** | Logos, literal screenshots, exact trade dress, any single source's full token set — including its marketed gradient mesh, its full-bleed signature color cards, or its licensed custom typefaces. |

## Where it fits

- **saas-landing** — the home genre: calm hero, logo strip, feature grids, pricing, optional dark footer close.
- **docs-page** — fully native: one reading column, code-first fragments, the mono utility face, zero decoration.
- **dashboard** — light-mode product surfaces inherit the gray ladder and hairline chrome.
- **desktop app** — the developer-tool flavor: compact chrome, mono accents, ink actions.
- **onboarding** — light flows with one accent confirm action per screen.
- **mobile app** — the same restraint scaled down: gray ladders, ink actions, one accent.
- Moods served: professional_minimal, plus the clean, minimal, sleek, spacious, flat, geometric, contemporary asks.
- Conversion-trust briefs land here: clarity, speed, one obvious action per band.
- A defiantly-minimal docs-first dialect is in-genre: strip to a single reading column, make the install command the hero, keep the ink button — absorb it, do not branch a new style.
- Not for warm expressive storytelling (warm-editorial), dark-first products (noir-technical), or playful consumer moods (playful-pop).

## Blends

- Atop bento-grid for feature-dense layouts — shared white canvas and type; the grid supplies the content structure.
- Atop enterprise-sober when the same calm must carry two-column data density.
- With noir-technical as the dark sibling for the same product's app shell or docs.

## Sources

Distilled from airtable, expo, cal, supabase, vercel, ollama analyses (awesome-design-md, MIT) + clean, minimal, sleek, spacious, geometric, codex, levels, professional, flat, contemporary, square cards (typeui, MIT).
