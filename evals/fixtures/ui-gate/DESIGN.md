---
version: 2
name: relaydeck marketing design system
description: A dark, restrained engineering-tool look — near-black canvas, one blue accent reserved for actions, mono numerics, quiet hairlines. No marketing flash.
colors:
  background: "#0b0b0d"
  surface: "#131317"
  surface-raised: "#1a1a20"
  text-primary: "#e8e8ea"
  text-secondary: "#9a9aa3"
  accent: "#4e80f0"
  accent-hover: "#6b96f2"
  hairline: "#26262c"
  on-accent: "#ffffff"
typography:
  display: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 700, lineHeight: 1.1 }
  body: { fontFamily: "Inter, 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.6 }
  mono: { fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "0.875rem", lineHeight: 1.5 }
spacing:
  section-gap: 48px
  content-padding: 24px
  scale: "4/8/12/16/24/32/48/64"
---

## Overview
Quiet, technical, trustworthy. The product speaks through typography and
hairlines; color appears only where the user can act. A visitor should read
"engineering tool", not "landing-page template".

## Colors
- Canvas `#0b0b0d`, one surface step up `#131317`, raised panels `#1a1a20`.
- Text `#e8e8ea`, secondary `#9a9aa3`.
- Accent `#4e80f0`: primary CTA, links, and the active nav item only —
  at most 2 accent events per viewport.
- Success/danger live outside the accent budget (semantic, not decoration).

## Typography
- Display: Inter 700, tight line-height, negative tracking above 2rem.
- Body: Inter 400; Chinese body rides the system stack, never italicized,
  never letter-spaced.
- Every number, command, price, and version = mono.

## Layout
- Single column, content max width 1100px, section gap 48px.
- Cards sit on hairlines (1px `#26262c`), not shadows.

## Shapes
- Radius scale 4 / 8 / 12; buttons pill only for the primary CTA.

## Components
- Primary CTA: `#4e80f0` fill, white label, pill; hover `#6b96f2`.
- Secondary CTA: hairline border, text-primary label.
- Nav: 56px bar, active item in accent underline.

## Motion
- ≤200ms, opacity/transform only; `prefers-reduced-motion` honored.

## Do's and Don'ts
- Tokens only — no new hex, no off-scale spacing.
- Never: gradients, glows, full-bleed stock photography, emoji in headings.
- Contrast floor 4.5:1 for body text.

## Agent Rules
1. Every color comes from this file's palette; drift is a bug, not a feature.
2. Accent budget: ≤2 chromatic events per viewport.
3. Numbers and code in mono, always.
4. Verify against rendered pages, not just markup.
