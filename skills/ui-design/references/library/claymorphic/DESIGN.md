---
origin: "style-level distillation from awesome-design-md site analyses (VoltAgent, MIT) + typeui design-skills (Bergside, MIT); a genre abstraction, not any single site's spec"
version: 1
name: claymorphic
description: "Chunky, puffy interfaces that feel molded from modeling clay — pillowy rounded cards with soft drop shadows and inner highlights, a warm cream floor, saturated pastel feature cells, and friendly rounded type."
dimensions:
  palette: light_clean
  accent: coral
  typography: dm_sans
  display: same_as_body
  layout: asymmetric
  mood: playful
  density: balanced
aliases: [clay, claymorphism]
colors:
  background: "#FFF6EC"
  surface: "#FFFFFF"
  text-primary: "#221A14"
  text-secondary: "#6F6355"
  accent: "#FF6552"
  accent-hover: "#EE5340"
  hairline: "#F0E4D4"
  on-accent: "#FFFFFF"
typography:
  display: { fontFamily: "DM Sans, system-ui, sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, lineHeight: 1.05 }
  body: { fontFamily: "DM Sans, system-ui, sans-serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.6 }
  mono: { fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "0.875rem", lineHeight: 1.5 }
rounded: { sm: 12px, md: 20px, lg: 32px, pill: 9999px }
spacing:
  section-gap: 96px
  content-padding: 32px
  scale: "4/8/12/16/24/32"
---

## What it is
Interfaces molded from soft modeling clay: cards are deeply rounded (30–40px-class radii), puffed outward by a big soft shadow and edged with a light inner highlight along the bottom, so every surface looks pinchable.
The floor is warm cream, feature cells are saturated single-hue fills — pink, teal, lavender, peach — and a friendly rounded grotesque carries the type.
Primary buttons stay warm near-black ink, letting the colored cells do the shouting, while stylized product fragments and chunky molded 3D artifacts live inside the cells.
The register is toy tactility at product scale: playful, warm, squeezable.

## Distinguishing moves
- Card construction is two-layer: one large soft drop shadow (0 18–36px spread, warm-ink tint at 15–20% alpha) plus an inset bottom highlight (near-white at 40–60% alpha) — the puffy molded read.
- Feature cells are flat single-hue fills from a declared set of 4–6 hues (pink, teal, lavender, peach, ochre class), cycled so adjacent cells never share a hue.
- Radius is generous everywhere: 24–40px on feature cards, 12–20px on buttons and inputs, pills for tabs and badges; square corners appear nowhere.
- The page floor is warm cream — never cool grey, never pure white — and stays warm through the footer; no dark closing band.
- Primary CTAs are warm near-black ink with paper text; vivid hues belong to cells and illustrations, not primary buttons.
- Display headings run the rounded grotesque at moderate weight (500–700, never beyond), with tracking tightened −0.5 to −2px at display sizes.
- Every hero band carries one molded 3D-looking artifact — characters, chunky landscapes, squeezable shapes; thin flat line art fails here.
- Stylized product fragments (generic UI mockups, agent-run logs, flow tiles) live inside the colored cells — the voltage is product-driven, never abstract.

## Accent and color budget
The hue set is the budget: up to four colored cells per viewport drawn from the 4–6 hue palette, cycled with no adjacent repeats.
One coral accent covers small interactive moments — badges, focus, hover — at ≤2 events per viewport.
Deep cells (ink or deep-teal class) flip to paper text; light pastels keep ink text — contrast picked per fill.
Floor, chrome, and copy stay cream and warm ink; no secondary accent hue beyond the cell set.
Buttons inside colored cells flip to paper fill with ink text — inversion, never a new hue.

## Keep / Change / Do-not-copy
**Keep**
- The two-layer puffy construction: soft drop shadow plus inset bottom highlight.
- The warm cream floor with warm-ink primary CTAs — warmth is the contract.
- The 4–6 hue cycled flat cells, no adjacent repeats.
- Rounded grotesque display at moderate weight with tightened tracking.

**Change**
- The specific hue set to the brand, keeping count (4–6), saturation, and flatness.
- Radius band (24–48px on feature cards) and shadow size together — they scale as one.
- Molded illustration subjects: claymation mascots are one flavor; chunky abstract puffs work too.
- Drop-shadow warmth: shadows tint toward warm ink, never cool grey.

**Do-not-copy**
- Logos, literal screenshots, exact trade dress, any single source's full token set.
- Any single source's exact hue run or its mascot characters — re-derive both for the brand.

## Where it fits
- saas-landing — warm, feel-good product storytelling pages.
- onboarding — friendly walkthroughs where even error states stay kind.
- mobile app — big touch cards that read as toys you can tap.
- dashboard — light summary boards only; not dense analytics.
- desktop app — playful creative tools where delight is part of the job.
Serves brief language like playful, warm, friendly, toy, approachable, delightful.
Do not choose it for institutional trust contexts, dense data products, or developer-terminal registers — the puff and warmth fight credibility there.

## Blends
- Atop bento-grid for the card layout: puffy colored cells fitted to bento spans.
- With playful-pop for extra character energy and illustrated garnish.
- Neumorphic is the grey-only ancestor: shared soft-shadow logic, but pick one surface language per page.

## Sources
Distilled from clay analysis (awesome-design-md, MIT) + claymorphism card (typeui, MIT).
