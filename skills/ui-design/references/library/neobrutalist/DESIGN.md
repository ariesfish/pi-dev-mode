---
origin: "style-level distillation from awesome-design-md site analyses (VoltAgent, MIT) + typeui design-skills (Bergside, MIT); a genre abstraction, not any single site's spec"
version: 1
name: neobrutalist
description: "Loud poster-style UI: 2–4px ink borders, hard offset block shadows that never blur, vivid flat fills on warm paper, and ultra-bold display type — raw, honest construction with friendly hype."
dimensions:
  palette: light_clean
  accent: custom: vivid flat set, rule-bound
  typography: inter
  display: custom: ultra-bold display
  layout: asymmetric
  mood: brutalist
  density: balanced
  exclude: [gradients]
aliases: [brutalism, neobrutalism, pulse, impeccable]
colors:
  background: "#FAF9F2"
  surface: "#FFFFFF"
  text-primary: "#111111"
  text-secondary: "#55524C"
  accent: "#FDC800"
  accent-hover: "#F0B400"
  hairline: "#111111"
  on-accent: "#111111"
typography:
  display: { fontFamily: "Archivo, Archivo Black, Inter, sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, lineHeight: 1.05 }
  body: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.6 }
  mono: { fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "0.875rem", lineHeight: 1.5 }
rounded: { sm: 0px, md: 4px, lg: 8px, pill: 9999px }
spacing:
  section-gap: 96px
  content-padding: 32px
  scale: "4/8/12/16/24/32"
---

## What it is
UI drawn in ink: every card, button, and media frame wears a thick near-black border and a solid offset shadow with zero blur, sitting on warm off-white paper while vivid single-color fills — yellow, blue, pink, orange — do the shouting.
Its honesty is the charm: construction is visible, nothing is glossy, and interaction is physical — you press buttons into their own shadows.
There are no gradients, no blurs, no translucency, and no soft shadows anywhere; one blended edge ruins the register.
Copy is blunt, confident hype, set in black-weight display type that admits no hedging.

## Distinguishing moves
- Every card, button, input, badge, and framed image wears a 2–4px solid ink border (#111-class); any borderless container on the page fails review.
- Every elevated element drops a hard offset shadow with zero blur (e.g. `4px 4px 0 #111111`); any blurred, ambient, or colored shadow in computed styles fails.
- Fills are single flat colors: each element's background computes to one solid value — no gradients (declared exclude), no translucency, no glow.
- The accent system is a declared set of 3–5 vivid flat hues (yellow, blue, pink, orange class); interactive elements each claim one hue outright while copy and structural lines stay ink.
- Display type is black weight (Archivo Black-class, 800–900) with H1 ≥3rem; headlines are short declarative boasts (≤6 words), never hedged clause-sentences.
- Press physics on every interactive element: hover/active translates the element 2–4px toward its shadow while the shadow steps toward zero — the block shadow is the state machine.
- Sections sit on warm paper or full-bleed vivid flat bands; at most two band hues per page, and paper always returns between bands.
- Sticker-style decorations (badge pills, arrows, solid highlighter underline bars) cap at three per viewport — spice, not structure.

## Accent and color budget
The vivid fills are the accent system: up to four flat-hue events per viewport, each covering a whole element (button, chip, card, band).
Ink and paper are unlimited neutrals — structural lines, copy, icons, borders all run ink.
Colored running text is off-limits: type is ink on paper or paper on a vivid fill, never tinted mid-tone.
When a full-bleed section band is vivid, elements inside it go paper or outline to hold the four-event count.
Warm paper over pure white is the floor rule — cool grey paper reads as a different genre.

## Keep / Change / Do-not-copy
**Keep**
- 2–4px ink borders plus zero-blur offset shadows on every container and control.
- The declared 3–5 vivid flat hues on warm paper — saturation is the voltage.
- Black-weight display type with boast-sized, ultra-condensed-voice headlines.
- Press physics — translate-and-collapse shadow on every button.

**Change**
- The specific vivid hues per brand, keeping 3–5 of them and keeping them flat.
- Radius within 0–8px; zero is the default, small rounds read as zine technique.
- Border ink can shift toward a brand-near black, but stays darker than #333.
- Band rhythm and decoration count to match content volume.

**Do-not-copy**
- Logos, literal screenshots, exact trade dress, any single source's full token set.
- A source page's sticker copy, marquee text, or exact hue run verbatim — rewrite and re-pick.

## Where it fits
- saas-landing — loud launches, developer tools with attitude, community products.
- onboarding — playful walkthroughs with sticker energy and oversized tap targets.
- mobile app — thick borders and press physics read beautifully on touch.
- dashboard — alert walls and status boards in the thick-border vivid-status variant.
Serves brief language like bold, loud, raw, playful, anti-corporate, poster.
Do not choose it for institutional trust contexts (finance, health, legal), docs-page reading, or dense data work where every border and shadow adds noise.

## Blends
- Atop bento-grid for the content layout: ink borders and block shadows on bento spans is a proven pairing.
- With riso-print: shared hard edges, offset-shadow physics, and poster type; riso swaps the flat fills for two-ink duotone and paper grain.
- With arcade-retro: the press physics and chunky pill forms port straight onto pixel-type cabinets.

## Sources
Distilled from the brutalism, neobrutalism, pulse, and impeccable cards (typeui, MIT) — typeui-card-only; no site analysis anchors this genre.
