---
origin: "style-level distillation from awesome-design-md site analyses (VoltAgent, MIT) + typeui design-skills (Bergside, MIT); a genre abstraction, not any single site's spec"
version: 1
name: neumorphic
description: "A soft, quiet practice where controls appear extruded out of — or pressed into — one grey surface, using paired light and dark shadows instead of borders or color; tactile and sculptural, nearly monochrome."
dimensions:
  palette: custom: soft monochrome greys
  accent: muted_sage
  typography: system_ui
  display: same_as_body
  layout: single_column
  mood: professional_minimal
  density: balanced
aliases: [neumorphism]
colors:
  background: "#E3E8F0"
  surface: "#E3E8F0"
  text-primary: "#3B4358"
  text-secondary: "#6C7A93"
  accent: "#8FAE8B"
  accent-hover: "#7E9D7A"
  hairline: "#CBD3E0"
  on-accent: "#233227"
typography:
  display: { fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, lineHeight: 1.05 }
  body: { fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.6 }
  mono: { fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "0.875rem", lineHeight: 1.5 }
rounded: { sm: 12px, md: 16px, lg: 24px, pill: 9999px }
spacing:
  section-gap: 96px
  content-padding: 32px
  scale: "4/8/12/16/24/32"
---

## What it is
Controls look sculpted out of one grey surface: a light highlight above-left and a dark shade below-right make each element read as physically raised — and with the same pair flipped inset, pressed into the material.
Nearly all color leaves the interface: background and surfaces share one low-chroma grey, so a single muted accent reads loud.
The starring components are the physical ones — toggles, sliders, radio discs, steppers, dials — each rendered as an extruded or embedded form.
The register is quiet, soft, and tactile: a paper-grey electronics device rather than a poster.

## Distinguishing moves
- Page background, card surfaces, and control surfaces share one low-chroma grey within ~5% lightness; separation comes from shadows, never from differently colored layers.
- Every raised element pairs two shadows — dark offset down-right plus light offset up-left (6–12px offsets, blur ≈ 2× the offset) — in greys only.
- Pressed and active states flip the same pair inset instead of repainting: text inputs, off-toggles, and pressed buttons dip into the surface.
- Sliders, toggles, radio discs, steppers, and dials are installed as first-class components; every interactive control exists as a raised or embedded physical form.
- Radii stay generous and uniform — cards 16px+, controls 12px+ — and any sharp-cornered element inside the page breaks the material.
- Shadow lists contain only greys: hue in a shadow, gradients on controls, or hard 1px borders on raised elements all flatten the extrusion and fail review.
- Exactly one muted accent hue (sage class) with at most three chromatic events per viewport — toggle-on fill, slider travel, focus ring — never body text, never large fills.
- Body text blocks rest on flat, unshadowed grey and hold ≥4.5:1 (aim near-ink primary text, since the soft field already spends contrast).

## Accent and color budget
One muted hue, at most three events per viewport, spent only on state: toggle-on, slider travel, focus.
Shadows, surfaces, and chrome stay grey — the entire chroma budget belongs to those controls.
Body text is never tinted; emphasis is weight and size, and links can underline instead of coloring.
Semantic states use deeper greys or the accent's darker shades before any second hue is considered.
The hairline token appears only on flat dividers and table rules — never on raised controls.

## Keep / Change / Do-not-copy
**Keep**
- The single-grey field with paired light/dark extrusions and inset flips.
- Grey-only shadows, generous uniform radii, and embedded physical controls.
- One muted accent, ≤3 events, held back for state.
- Generous single-column rhythm where each control group breathes at the 96px-class section gap.

**Change**
- The grey's temperature (cool putty vs warm bone), keeping chroma near zero.
- The accent hue within muted ranges (sage class default).
- Shadow offset scale within 6–12px to tune softness.
- Density of embedded controls to the product's setting-heavy needs.
- A whisper-soft base gradient behind the field is allowed; never on the controls themselves.

**Do-not-copy**
- Logos, literal screenshots, exact trade dress, any single source's full token set.
- Any exact published grey-and-shadow recipe — recompute offsets from your own base grey.

## Where it fits
- onboarding — gentle sequences where calm beats wow.
- mobile app — settings screens, tools, remotes, and media controls.
- desktop app — control peripherals and settings inspectors.
- saas-landing — soft single-column product pages for quiet positioning.
Serves brief language like soft, calm, tactile, minimal, friendly-quiet.
Do not choose it for dashboards or data-dense views (the low figure-ground costs scanning), docs-page, or error-critical flows — the genre's weak contrast is a real liability there.

## Blends
- With quiet-saas: shares the one-muted-accent restraint for credible, soft product pages.
- Claymorphic is the chromatic sibling — same soft-shadow logic with saturation and bigger radii; pick one per surface, not both.
- Border- and glow-driven styles (neobrutalist, sci-fi-horizon) do not blend here; both flatten the extrusion.

## Sources
Distilled from the neumorphism card (typeui, MIT) — typeui-card-only; no site analysis anchors this genre.
