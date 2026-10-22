---
origin: "style-level distillation from awesome-design-md site analyses (VoltAgent, MIT) + typeui design-skills (Bergside, MIT); a genre abstraction, not any single site's spec"
version: 1
name: sci-fi-horizon
description: "A dark futuristic register: near-black space floors, electric-blue glow accents, wide-tracked geometric display type, HUD chrome with corner ticks and mono readouts, and perspective lines that open a receding horizon."
dimensions:
  palette: monochrome_dark
  accent: electric_blue
  typography: system_ui
  display: custom: futuristic display
  layout: asymmetric
  mood: playful
  density: balanced
aliases: [cosmic, neon, futuristic, perspective]
colors:
  background: "#060A15"
  surface: "#0E1526"
  text-primary: "#E9F2FF"
  text-secondary: "#8DA2C8"
  accent: "#3E9BFF"
  accent-hover: "#69B4FF"
  hairline: "#1D2A45"
  on-accent: "#04101F"
typography:
  display: { fontFamily: "Audiowide, Orbitron, Michroma, sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 400, lineHeight: 1.05 }
  body: { fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.6 }
  mono: { fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "0.875rem", lineHeight: 1.5 }
rounded: { sm: 2px, md: 4px, lg: 8px, pill: 9999px }
spacing:
  section-gap: 80px
  content-padding: 32px
  scale: "4/8/12/16/24/32"
---

## What it is
A window into deep space: near-black floors, one thin bright seam of electric-blue glow, and instrumentation floating over the void in 1px lines and corner brackets.
Electric blue leads a strictly rationed neon budget — glow has real falloff, lands on at most a couple of elements per screen, and everything else stays crisp line work.
Type splits roles: wide-tracked geometric caps for display, a plain system sans for body, mono readouts for telemetry labels.
Perspective constructions — receding grids, vanishing lines, tilted panel stacks — open each page into depth; heroes are asymmetric, display text offset against floating instrument clusters.

## Distinguishing moves
- Every section sits on the same near-black floor (#060A15-class dark); brighter zones are layered panels on top, never new section backgrounds.
- Display headings use a geometric techno caps face with widened tracking (0.05–0.15em); the exotica stops at headings — body copy stays in the plain system sans.
- Glow is rationed: colored blur falloff (16–32px, 30–60% alpha) on at most two elements per viewport (hero word, primary CTA); more than two glowing elements fails review.
- Main panels wear HUD chrome: 1px hairline borders, corner tick brackets, and small mono readouts (coordinates, versions, status codes).
- Each page includes one perspective construction — a receding grid floor, vanishing lines, or a stack of perspective-transformed panels — so the page reads as space, not flat dark.
- Heroes are asymmetric: the display headline offsets against a floating cluster of instrument panels, never a centered logo-plus-subhead stack.
- The hue budget is two: electric blue leads, plus at most one secondary neon (green or cyan class) reserved for status and key data.
- Body text holds ≥4.5:1 (near-white ink); dimmer steel greys are allowed only in mono readouts and labels.

## Accent and color budget
Two hues maximum per viewport: electric blue the leader, one secondary neon for status only.
Glow lands on ≤2 elements; when more things glow, the look slides from cockpit to casino.
Body text and hairlines stay in the white/steel family; accent-tinted paragraphs are off-language.
Dark floors and space-fog gradients are neutrals here, not accent events — depth never counts against the hue budget.
Star specks, scan lines, and grid bones are set dressing: they deepen the floor without spending a single event.

## Keep / Change / Do-not-copy
**Keep**
- The near-black floor plus the two-hue, two-glow ration.
- Wide-tracked techno caps for display only, system sans body, mono readouts.
- HUD chrome (hairlines, corner ticks, readouts) and one perspective construction per page.
- The asymmetric hero: display text offset against a floating instrument cluster.

**Change**
- The accent family within electrics (blue, cyan, violet) — keep the glow physics.
- The depth motif: grid floor, vanishing lines, or tilted panel stacks.
- Readout density to the product's real telemetry richness.
- Glow temperature can lean cyan or violet with the brand — one leader only.

**Do-not-copy**
- Logos, literal screenshots, exact trade dress, any single source's full token set.
- Any specific fiction's ship-interface or HUD iconography — keep the chrome generic.

## Where it fits
- saas-landing — next-generation product hype with cinematic key frames.
- dashboard — mission-control metrics: telemetry, monitors, status consoles.
- desktop app — instrument-style workbenches and consoles.
- onboarding — cinematic first-run sequences for technical products.
- mobile app — games and tech-fiction-adjacent consumer products.
Serves brief language like futuristic, cosmic, sci-fi, cyber, next-generation, cinematic.
Do not choose it for warm human-services brands, enterprise-sober buyers, docs-page, or accessibility-strict contexts — dark floors and glow spend contrast.

## Blends
- With glassmorphic: frosted instrument panels over the void — the strongest pairing in the genre.
- With neon-terminal: its mono readouts and phosphor glow belong inside the HUD clusters.
- Atop bento-grid for panel layouts: the cells become instrument tiles.

## Sources
Distilled from the cosmic, neon, futuristic, and perspective cards (typeui, MIT) — typeui-card-only; no site analysis anchors this genre.
