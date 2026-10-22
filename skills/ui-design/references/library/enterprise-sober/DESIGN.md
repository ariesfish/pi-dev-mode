---
origin: "style-level distillation from awesome-design-md site analyses (VoltAgent, MIT) + typeui design-skills (Bergside, MIT); a genre abstraction, not any single site's spec"
version: 1
name: enterprise-sober
description: White-canvas enterprise sobriety — grey tonal ladders carry all structure, hairlines separate, one steel corporate blue acts. Dense data tables, application-frame chrome, light display type, square controls. Clarity over charm, on purpose.
dimensions:
  palette: light_clean
  accent: electric_blue
  typography: inter
  display: same_as_body
  layout: two_column
  mood: professional_minimal
  density: compact
  exclude: []
aliases: [ibm, sap, oracle, hp, bmw, cohere, ant, enterprise, stitch, material]
colors:
  background: "#ffffff"
  surface: "#f3f4f5"
  text-primary: "#212529"
  text-secondary: "#555a60"
  accent: "#1a5ec2"
  accent-hover: "#12489b"
  hairline: "#d9dde2"
  on-accent: "#ffffff"
typography:
  display: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "clamp(2rem, 4.5vw, 3.25rem)", fontWeight: 400, lineHeight: 1.15 }
  body: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.5 }
  mono: { fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "0.875rem", lineHeight: 1.5 }
rounded: { sm: 0px, md: 4px, lg: 8px, pill: 9999px }
spacing:
  section-gap: 64px
  content-padding: 24px
  scale: "4/8/12/16/24/32"
---

## What it is
The visual language of serious software bought by committees. Everything sits on white; structure
comes from a shallow ladder of grey tonal steps, 1px hairlines, and full-width square-cornered
bands — never from decoration or shadow. One steel corporate blue is the only color permitted to
act: it fills the primary button, colors links, and underlines focus. Content is packed dense by
design (tabs, breadcrumbs, spec rows, data tables), a single family carries every size at sober
weights, and at most one ink-dark slab per page — hero or footer — flips the polarity.

## Distinguishing moves
- Ground stays pure white; every other light surface is a rung on a 3–5 step grey ladder whose
  adjacent rungs differ by only a few points of lightness. Check: desaturate the page — all
  structure survives untouched.
- Depth without shadow: hierarchy comes from surface change (canvas → grey rung → ink slab) and
  1px hairlines; box-shadow is allowed only on transient overlays (menus, modals, toasts).
  Check: no static card or section casts a shadow.
- One acting hue: `accent` fills the primary CTA, colors inline links, and draws the 2px focus
  underline on inputs and tabs; if the wordmark hue differs, it appears once — on the logo —
  and touches nothing interactive. Check: exactly one saturated hue on screen, ≤2 filled
  instances per viewport.
- Application-frame chrome: a utility or breadcrumb strip above the main nav, plus a product
  tab rail or left rail beneath it. Check: ≥2 stacked navigation zones before content begins.
- Tables are first-class: rows ≤48px, 12–14px cell type, hairline row rules, header cells one
  rung up the ladder, tabular numerals in mono for IDs and currency. Check: the primary content
  path passes through such a table.
- Grids separate by rule, not card edge: paired features sit in two columns divided by a 1px
  hairline and run edge to edge. Check: equal-rung neighbors use dividers, never double cards.
- Display type stays light: h1 computed weight ≤500 at ≥32px; weights 600–800 are reserved for
  labels under 24px. Check: no heavy marketing headline anywhere on the page.
- Corner discipline: buttons and inputs 0–4px, cards ≤8px, full-width bands 0px; a pill radius
  appears only on status badges and filter chips. Check: no CTA is a pill.

## Accent and color budget
One chromatic hue, total — steel blue is the declared default, not a doctrine; any single
corporate hue serves. The acting hue may fill the primary CTA, color links, underline focus,
mark the active tab, and paint at most one full-bleed CTA band per page; ≤2 filled elements per
viewport otherwise. Semantic success/warning/error sit outside the budget and appear only in
tables, toasts, and validation. Nothing ambient gets tinted: no colored hover washes, no
gradient buttons, no accent section rules — one pale band at ≤5% saturation per page is the
ceiling, and the ink slab stays neutral, never hue-tinted.

## Keep / Change / Do-not-copy
- Keep: white ground with grey-ladder bands, the one-hue action budget, hairline table chrome,
  two-storey navigation, a single family at sober weights, squared controls, the lone ink slab.
- Change: swap the blue for the adopting brand's own acting hue; warm or cool the grey ladder;
  step body sizes up for accessibility-first audiences; loosen density on marketing surfaces.
- Do-not-copy: logos, literal screenshots, exact trade dress, or any single source's full token
  set; also no borrowed wordmark colors as UI accents, no ultra-heavy stencil campaign
  headlines, and no loud poster-scale overrides — this genre stays quiet even when the logo is
  loud.

## Where it fits
Strongest on dashboards, desktop apps, and docs pages — anywhere tables, specs, and
configuration flows outweigh storytelling. Serves a saas-landing whose buyer is procurement,
IT, or compliance: institutional, dependable, deliberately unglamorous. Not for consumer
warmth, launch-page drama, or editorial narrative — pick a livelier profile rather than
decorating this one.

## Blends
- Atop bento-grid: a marketing surface that needs feature tiles can keep this profile's surface
  and color discipline while bento-grid supplies the asymmetric composition.
- With institutional-fintech: same restraint plus heavier regulatory semantics — borrow its
  table manners when the numbers themselves are the product.
- quiet-saas is the nearest sibling: borrow its airier rhythm when the page must sell rather
  than administer.

## Sources
Distilled from ibm, sap, oracle, hp, bmw, cohere analyses (awesome-design-md, MIT) + ant, enterprise, stitch, material cards (typeui, MIT).
