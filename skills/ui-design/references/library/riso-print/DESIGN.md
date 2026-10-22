---
origin: "style-level distillation from awesome-design-md site analyses (VoltAgent, MIT) + typeui design-skills (Bergside, MIT); a genre abstraction, not any single site's spec"
version: 1
name: riso-print
description: "A two-ink risograph print language: one warm paper surface runs under every section, a fluorescent ink drives all interaction, a deep second ink carries headings, and every tone is faked with dot screens."
dimensions:
  palette: earth_tones
  accent: custom: two-ink duotone
  typography: custom: space_grotesk-led
  display: same_as_body
  layout: asymmetric
  mood: playful
  density: balanced
  exclude: [gradients]
aliases: [riso, dithered]
colors:
  background: "#F8F1E2"
  surface: "#FCF7EA"
  text-primary: "#2B3E9C"
  text-secondary: "#6F6A9C"
  accent: "#F4379F"
  accent-hover: "#D41C85"
  hairline: "#E3D8BE"
  on-accent: "#FFFDF8"
typography:
  display: { fontFamily: "Space Grotesk, Inter, sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, lineHeight: 1.05 }
  body: { fontFamily: "Space Grotesk, Inter, sans-serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.6 }
  mono: { fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "0.875rem", lineHeight: 1.5 }
rounded: { sm: 0px, md: 0px, lg: 0px, pill: 9999px }
spacing:
  section-gap: 96px
  content-padding: 32px
  scale: "4/8/12/16/24/32"
---

## What it is
Every section is printed on the same warm off-white paper: a two-ink press job where one fluorescent ink carries all the interaction and one deep ink carries headings, rules, and running copy.
Tone is never inked as grey — it is faked with dot screens, halftones, and dither patterns, the way a real duplicator simulates shade with a limited palette.
The signature flaw is the tell: headings sit with a small offset shadow of the second ink, the visible misregistration of a cheap two-drum press.
Hard edges everywhere, paper forever, and a joyful zine energy set in a chunky grotesque.

## Distinguishing moves
- The whole interface uses exactly two ink hues — one fluorescent interaction ink (pink class) and one deep structural ink (federal-blue class) — plus paper; a third hue fails review.
- One continuous warm off-white paper surface runs under every section: no background flips, no dark sections; dividers are inked rules and solid color blocks, never new surfaces.
- Headings wear misregistration: deep-ink type with a 2–4px, zero-blur text-shadow in the fluorescent ink.
- Tone is dotted, never blended: halftone or dither dot patterns render imagery, shading, and large numerals; grey gradients are off-language (gradients are the declared exclude).
- Interaction is fluorescent-only: links, buttons, hover states, and focus rings use the accent ink; the deep ink never signals interactivity.
- Overlapping color shapes overprint — multiply blending or a pre-mixed duotone overlap swatch — so overlaps read as stacked ink, not opacity.
- Corners are sharp: 0px radii on cards, panels, and buttons; circles and pills appear only as stamps and badges.
- Mono caps annotations carry press artifacts — registration marks, ink chips, colophon lines — at small scale near section edges.

## Accent and color budget
The duotone is the budget: per viewport roughly 60% paper, 30% deep ink, 10% fluorescent ink.
Fluorescent events cap at four and always mark interaction or emphasis; structure and copy belong to the deep ink.
Any third hue — including status colors — is faked with dot overlay on the two inks or sacrificed outright.
Full-color photography is converted to two-ink halftone or removed; precise photographic color is not the genre's problem to solve.
Deep ink at reduced density (the secondary text token) is still the same ink — thinner dots, never a new grey.

## Keep / Change / Do-not-copy
**Keep**
- The two-ink economy: one fluorescent interaction ink, one deep structure ink, paper everywhere else.
- The single continuous paper surface and the misregistration shadow on headings.
- Dot-screened tones and fluorescent-as-interaction; the deep ink stays structural.
- Sharp 0px corners and the mono caps press annotations as part of the material.

**Change**
- Both ink roles to the brand: any fluorescent hue plus a deep counterpart (pink/blue default; orange/green, red/violet work).
- Dot scale, dot density, and the misregistration offset (2–4px).
- Paper warmth from cream to bone — off-white always, never pure white or cool grey.

**Do-not-copy**
- Logos, literal screenshots, exact trade dress, any single source's full token set.
- A specific press's exact ink pair or overprint recipe verbatim — re-derive the pair for the brand.

## Where it fits
- saas-landing — playful, crafty launches with print credibility.
- docs-page — zine-style article shells where two inks keep long reads calm.
- onboarding — poster-style walkthroughs and flip-card sequences.
- mobile app — sticker-and-stamp feed energy on paper ground.
Serves brief language like craft, handmade, joyful, zine, print, artful.
Do not choose it for dashboards or anything needing multi-hue status semantics — two inks cannot carry data color — or where photographic color must stay faithful.

## Blends
- With press-magazine: poster-scale editorial structure; riso supplies the ink system, press-magazine the layout discipline.
- With neobrutalist: shared hard edges and offset-shadow physics; riso swaps borders and vivid fills for duotone inks and paper grain.
- With arcade-retro: dithered dot screens are shared DNA for imagery conversions.
- With warm-editorial: shared paper warmth, but the serif swap costs the zine snap — pick one voice.

## Sources
Distilled from the riso and dithered cards (typeui, MIT) — typeui-card-only; no site analysis anchors this genre.
