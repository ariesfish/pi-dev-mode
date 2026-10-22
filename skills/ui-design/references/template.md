# DESIGN.md template

Write this file to the repo root as `DESIGN.md`. Fill every bracket; a section
with nothing to say still keeps its heading with a one-line "why empty" note.
Section names stay aligned with the wider DESIGN.md ecosystem (Stitch lineage,
exemplar libraries) so reference files drop in without translation.

Version stamp in frontmatter; bump on every deliberate change.

```markdown
---
version: 1
name: <project> design system
description: <one breath, brand-voice: palette stance, type stance, the feel>
resolved-from-defaults:
  <dimension>: <value>            # only dimensions the brief did not pin; one
                                  # line each, with the rule that picked it
colors:
  background: "#……"
  surface: "#……"
  text-primary: "#……"
  text-secondary: "#……"
  accent: "#……"
  accent-hover: "#……"
  hairline: "#……"
  on-accent: "#……"
typography:
  display:
    fontFamily: "……"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.05
  body:
    fontFamily: "……"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    lineHeight: 1.5
---

## Overview
Mood, feel, references. What the product should feel like in one paragraph —
in language a new contributor reproduces without seeing the design.

## Colors
### Brand & Accent
### Surface
### Text
### Semantic
Roles and usage rules: where each color may appear, accent budget (max ~3 uses
per viewport), what never gets tinted.

## Typography
### Font Family
### Hierarchy
Display / body / small / mono — the full scale, with sizes and weights.
### Principles
What the type is doing here (voice, density, rhythm).
### Substitutes
Fallback stack for any proprietary or self-hosted face — what to use when the
first choice is unavailable.

## Layout
### Spacing System
Section gap + content padding — one scale, from density.
### Grid & Container
Columns, max width, gutters.
### Responsive Behavior
Breakpoints, what collapses where, touch-target policy, collapsing strategy.

## Elevation & Depth
Shadow and border policy (hard offsets / subtle / none), when elevation is
allowed at all.

## Shapes
Border radius scale; imagery and illustration geometry.

## Components
### Buttons
### Cards & Containers
### Inputs & Forms
### Navigation
Style contracts per component: radius, borders, states, sizing.

## Motion & Interaction
Durations, easing, what may move at all; reduced-motion policy. If
exclude=animations: state "static by contract" here.

## Do's and Don'ts
The rules a reviewer can check mechanically: tokens only, spacing scale only,
AA contrast, focus-visible everywhere — plus this project's specific don'ts
(the exclude list lives here, expanded to named patterns).

## Agent Rules
The never-invent list for coding agents: exact hex values only, no new colors,
no new type sizes, accent budget, alt text always, focus states always, honor
the exclude list, spacing from the scale.

## Iteration Guide
How this file changes: edits are decisions (what, why, version bump), never
silent restyles; redesigns audit first and list what moves.
```
