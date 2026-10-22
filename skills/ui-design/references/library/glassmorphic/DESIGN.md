---
origin: "style-level distillation from awesome-design-md site analyses (VoltAgent, MIT) + typeui design-skills (Bergside, MIT); a genre abstraction, not any single site's spec"
version: 1
name: glassmorphic
description: "Frosted glass panels float over a colorful base: each surface blurs whatever passes beneath it, edges catch a one-pixel luminous rim, and depth comes from layered translucency rather than shadows."
dimensions:
  palette: custom: deep or vivid base
  accent: custom: luminous hue
  typography: system_ui
  display: same_as_body
  layout: asymmetric
  mood: playful
  density: spacious
aliases: [glassmorphism]
colors:
  background: "#0D1526"
  surface: "#FFFFFF17"
  text-primary: "#F2F6FF"
  text-secondary: "#A9B4D6"
  accent: "#5B9DFF"
  accent-hover: "#82B6FF"
  hairline: "#FFFFFF47"
  on-accent: "#0A1224"
typography:
  display: { fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, lineHeight: 1.05 }
  body: { fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.6 }
  mono: { fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "0.875rem", lineHeight: 1.5 }
rounded: { sm: 12px, md: 16px, lg: 24px, pill: 9999px }
spacing:
  section-gap: 120px
  content-padding: 40px
  scale: "4/8/12/16/24/32"
---

## What it is
Panels of frosted glass drift over a colorful depth field: each surface is translucent (8–18% white) and blurs whatever passes behind it, so the base becomes soft color bleeding through every edge.
A one-pixel luminous rim catches the light along each panel — brighter at the top — and stacked translucency, not drop shadows, builds the depth.
The base under the glass must be worth blurring: gradient washes, vivid shapes, or imagery; frost over flat white renders nothing.
The register is airy, futuristic, and premium-playful rather than loud.

## Distinguishing moves
- Every floating panel is translucent at 8–18% white and applies `backdrop-filter` blur of at least 16px with a saturation boost of 1.2–1.8; opaque panels fail review.
- The page base beneath is chromatic — a gradient wash, vivid shapes, or imagery — checked by sample: no large flat white or grey region sits directly under glass.
- Each glass edge carries a 1px luminous rim (white at 25–45% alpha), with the top or leading edge at least as bright as the bottom.
- Depth comes from stacking and translucency order only: drop shadows are absent or nearly zero; hard shadows never appear in computed styles.
- Glass corners round at 16px minimum (cards 20px+); any square-corner frosted panel reads as a different genre.
- Text on glass is white or near-white and holds at least 4.5:1 contrast against its blurred backdrop; mid-grey body text on glass is off-language.
- Hover steps the material: fill and rim alpha each raise one notch (e.g. fill 10%→16%); nothing scales, jumps, or gains a hard shadow.
- The material covers every control — nav, pills, tabs, and toggles frost too; frosting only the hero cards reads as a sticker, not a system.

## Accent and color budget
Exactly one luminous accent hue speaks in UI chrome — links, CTA fill, active tab — with at most three events per viewport.
The base wash beneath the glass is the stage, not an accent: it may carry multiple hues, but chrome never picks them up.
Text and hairlines stay in the white family over the declared deep base; tinted body text is off-language.
The token surface (#FFFFFF17-class) is the working fill; adjust alpha within the 8–18% band rather than introducing new colors.
Deep bases and vivid bases are both legal; either way the accent stays one luminous hue over the glass.

## Keep / Change / Do-not-copy
**Keep**
- Real backdrop blur at 16px+ over a chromatic base — borders-only mimicry fails.
- The 1px luminous rim, 16px+ radii, and 8–18% translucent fills.
- One luminous accent, ≤3 events; white-family text at ≥4.5:1.
- Frosted treatment applied across all controls, not just hero panels.
- Spacious rhythm: sections breathe at a 120px-class gap so panels float in air, never edge-to-edge.

**Change**
- The base palette — deep navy, violet night, or vivid photo washes all work.
- The accent hue, keeping its luminous quality over the base.
- Blur strength and fill alpha within the band, to hardware budget or taste.
- Radius upward (20–28px cards) for a softer, more premium feel.

**Do-not-copy**
- Logos, literal screenshots, exact trade dress, any single source's full token set.
- Any single source's wallpaper imagery or exact gradient stops — rebuild the base for the product.

## Where it fits
- saas-landing — hero moments and section showcases floating over an illustrated base.
- mobile app — frosted sheets, tabs, and players over photo or graphic canvases.
- desktop app — floating toolbars, inspectors, and command palettes.
- onboarding — progress sheets sliding over color-field bases.
Serves brief language like modern, futuristic, premium, airy, dreamy.
Do not choose it for docs-page or long-form reading (translucency taxes sustained legibility), dense tables, or print/export contexts where blur cannot exist.

## Blends
- Atop bento-grid: frosted bento cells over a gradient field — the board floats.
- With sci-fi-horizon: its dark base and HUD chrome splice naturally; glass panels become cockpit instruments.
- With atmospheric-wash: adopt its gradient base as the thing worth blurring.

## Sources
Distilled from the glassmorphism card (typeui, MIT) — typeui-card-only; no site analysis anchors this genre.
