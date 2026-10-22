---
origin: "style-level distillation from awesome-design-md site analyses (VoltAgent, MIT) + typeui design-skills (Bergside, MIT); a genre abstraction, not any single site's spec"
version: 1
name: bento-grid
description: "A modular grid of rounded cards in mixed sizes that packs an entire feature set into one scannable board; hierarchy comes from cell span and placement rather than applied decoration."
dimensions:
  palette: light_clean
  accent: electric_blue
  typography: inter
  display: same_as_body
  layout: asymmetric
  mood: professional_minimal
  density: balanced
aliases: [bento]
colors:
  background: "#F6F7F9"
  surface: "#FFFFFF"
  text-primary: "#111827"
  text-secondary: "#5B6472"
  accent: "#2563EB"
  accent-hover: "#1D4ED8"
  hairline: "#E4E7EC"
  on-accent: "#FFFFFF"
typography:
  display: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, lineHeight: 1.05 }
  body: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.6 }
  mono: { fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "0.875rem", lineHeight: 1.5 }
rounded: { sm: 8px, md: 12px, lg: 16px, pill: 9999px }
spacing:
  section-gap: 80px
  content-padding: 32px
  scale: "4/8/12/16/24/32"
---

## What it is
Content is portioned into a strict multi-column grid of rounded cards with different spans, so a whole feature set, product family, or metric pack reads as one scannable board — a neatly packed lunchbox instead of stacked banners.
One hero cell is visibly larger and carries the primary claim; the surrounding cells are equal-footing compartments, each holding exactly one idea.
Surfaces sit close in value — white cards, soft neutral floor, hairline borders — so span and placement, not decorative styling, create the hierarchy.
The register is calm, organized, and product-led: the structure is the design.

## Distinguishing moves
- All containers live in one responsive grid of 3–4 desktop columns; every card spans whole cells (1×1, 2×1, 2×2), and nothing floats over or overlaps another card.
- Each grid contains exactly one hero cell that spans at least two cells in one direction and carries the section's primary claim; the other cells are uniform, smaller, equal-footing ones.
- Every card in a grid shares one radius (8–20px band), one internal padding (24–32px), one 1px hairline border, and one gap (12–24px); cards differentiate by span, never by style.
- One idea per cell: at most one icon, one heading, and one metric or one supporting line of copy.
- Scan priority is encoded in span and placement: the primary claim owns the hero or top-left cell, and no load-bearing content hides in the bottom-right of the board.
- At most 1–2 cells per grid leave the neutral surface (tinted fill, accent metric, or full-bleed media); the remaining cells stay white and quiet.
- Media lives inside cells at full bleed, never in bands between them; outside the grid only a heading row and an optional one-line kicker exist.
- On smaller screens the grid degrades to two columns, then one, keeping the hero first and never orphaning cells out of content order.

## Accent and color budget
One accent hue (electric-blue class) with at most three chromatic events per viewport: the hero's tint or its CTA, one accent metric or icon, and one active or hover state.
Everything else reads as neutrals — white and soft-grey surfaces, ink text, hairlines — and body copy is never tinted.
Colorful media counts against the tinted-cell allowance, so a grid carrying photography drops its tinted hero to keep the budget.
On long pages the budget repeats per viewport, not per page: every section's board gets its own three events.
Density stays balanced: cards breathe at a uniform gap and never crowd, or the "board" reads as a wall.

## Keep / Change / Do-not-copy
**Keep**
- The strict span grid with exactly one large hero cell and uniform small cells — this is the style.
- Size-as-hierarchy: the bigger cell carries the more important claim, enforced view by view.
- One radius, one gap, one padding band, one hairline treatment shared by every card in a grid.
- The neutral base with ≤3 accent events and at most 1–2 tinted cells per grid.

**Change**
- The accent hue and neutral temperature (warm or cool greys both work).
- The content mix inside cells — metrics, mini UI fragments, thumbnails, quotes — as long as one idea per cell holds.
- The exact span map and column count (3 vs 4), recomputed from your own content weights.
- Radius within the 8–20px band to match the brand's sharpness.

**Do-not-copy**
- Logos, literal screenshots, exact trade dress, any single source's full token set.
- A source board's exact span layout or its highlighted-cell choices — derive the map from your own content instead.

## Where it fits
- saas-landing — feature overviews and product-family maps; the canonical use.
- dashboard — hairline KPI and summary boards that stay calm under data.
- mobile app — discovery feeds and profile mosaics on two-column spans.
- onboarding — capability walkthroughs, one card per concept.
- desktop app — launcher boards and control-panel grids.
Serves brief language like organized, modular, scannable, modern, product-led.
Do not choose it for docs-page or long-form narrative, where the grid fragments reading flow, or for a single-focus pitch page where one idea should own the whole viewport.

## Blends
- Primarily a layout substrate: neobrutalist borders, glassmorphic frost, or claymorphic puff can own the card surfaces while bento-grid owns spans, gaps, and scan order.
- Over quiet-saas it reads as a restrained product board; over sci-fi-horizon the cells become instrument panels.
- With playful-pop, only the hero cell gets character energy; the rest of the board stays quiet so the spans still scan.

## Sources
Distilled from the bento card (typeui, MIT) — typeui-card-only; no site analysis anchors this genre.
