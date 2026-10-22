# Design craft: dimensions, tokens, defaults, principles

The brief-mode vocabulary and the universal quality floor. Everything here is
decided ahead of time so a brief resolves to the same DESIGN.md no matter which
session runs it.

Distilled from: OpenDesign's design-brief dimension tables (Apache-2.0 — the
closed vocabulary, the token resolutions, and the default rules below),
taste rules, and Apple Human Interface Guidelines principles (© Apple — cited
by link only, no source text reproduced). The full web review checklist lives in
[`web-guidelines.md`](web-guidelines.md).

## The eight dimensions (closed vocabulary)

| # | Dimension | Key | Closed values |
|---|---|---|---|
| 1 | Color palette | `palette` | navy_and_white, earth_tones, monochrome_dark, light_clean |
| 2 | Accent | `accent` | coral, electric_blue, emerald, muted_sage, slate |
| 3 | Body typography | `typography` | inter, system_ui, dm_sans, georgia |
| 4 | Display typography | `display` | space_grotesk, clash_display, playfair, same_as_body |
| 5 | Layout model | `layout` | single_column, two_column, asymmetric |
| 6 | Mood | `mood` | professional_minimal, playful, brutalist, editorial |
| 7 | Density | `density` | compact, balanced, spacious |
| 8 | Constraints | `exclude` | animations, gradients, stock_photos, carousel |

A value not in this table is not valid: prompt with the legal values, never
guess a closest match.

## Symbolic → concrete token resolution

### Palettes

| Value | Background | Surface | Text | Secondary |
|---|---|---|---|---|
| `navy_and_white` | #0F172A | #1E293B | #F8FAFC | #94A3B8 |
| `monochrome_dark` | #09090B | #18181B | #FAFAFA | #A1A1AA |
| `light_clean` | #FFFFFF | #F8FAFC | #0F172A | #64748B |
| `earth_tones` | #FFFBEB | #FEF3C7 | #451A03 | #92400E |

### Accents

| Value | Accent | Hover |
|---|---|---|
| `coral` | #F97316 | #EA580C |
| `electric_blue` | #3B82F6 | #2563EB |
| `emerald` | #10B981 | #059669 |
| `muted_sage` | #84A98C | #6B8F73 |
| `slate` | #64748B | #475569 |

### Body type

| Value | Family | Weight | Size / line-height |
|---|---|---|---|
| `inter` | Inter | 400 | 1rem / 1.6 |
| `system_ui` | system-ui | 400 | 1rem / 1.6 |
| `dm_sans` | DM Sans | 400 | 1rem / 1.6 |
| `georgia` | Georgia | 400 | 1.125rem / 1.7 |

### Display type

| Value | Family | Weight | Size |
|---|---|---|---|
| `space_grotesk` | Space Grotesk | 700 | clamp(2rem, 5vw, 3.5rem) |
| `clash_display` | Clash Display | 700 | clamp(2rem, 5vw, 3.5rem) |
| `playfair` | Playfair Display | 700 | clamp(2rem, 5vw, 3.5rem) |
| `same_as_body` | body family | 600 | inherits scale |

### Density

| Value | Section spacing | Content padding |
|---|---|---|
| `compact` | 48px | 16px / 24px |
| `balanced` | 72px | 24px / 40px |
| `spacious` | 96px | 24px / 48px |

## Natural language → dimension mapping

| Phrase | Dimension | Value |
|---|---|---|
| "dark mode", "dark theme" | palette | monochrome_dark |
| "light", "white background" | palette | light_clean |
| "earthy", "warm tones" | palette | earth_tones |
| "pop of color", "vibrant" | accent | electric_blue (default) or coral |
| "subtle accent" | accent | muted_sage (default) or slate |
| "clean", "minimal", "simple" | mood | professional_minimal |
| "playful", "fun", "friendly" | mood | playful |
| "bold", "brutalist", "raw" | mood | brutalist |
| "editorial", "magazine-like" | mood | editorial |
| "spacious", "lots of whitespace" | density | spacious |
| "compact", "dense", "information-rich" | density | compact |
| "Inter", "system font" | typography | inter (default) or system_ui |
| "serif", "traditional" | typography | georgia |
| "monospace", "code-like" | typography | system_ui + mono utility face |
| "no animations", "static" | exclude | animations |
| "no gradients" | exclude | gradients |
| "no stock photos" | exclude | stock_photos |
| "single page" | layout | single_column |
| "two columns", "sidebar" | layout | two_column |

Multiple candidates listed: the first is the default; pick the alternative only
when surrounding context strongly favors it.

## Default resolution rules

| Unspecified | Default rule |
|---|---|
| `palette` | editorial → light_clean; brutalist → monochrome_dark; otherwise light_clean |
| `accent` | dark palette → coral; light palette → electric_blue |
| `typography` | always inter (cross-platform legibility) |
| `display` | editorial → playfair; brutalist → space_grotesk; otherwise same_as_body |
| `layout` | always single_column (safest responsive default) |
| `mood` | always professional_minimal (least opinionated) |
| `density` | always balanced |
| `exclude` | always none (no constraints unless stated) |

Mood also unspecified → the neutral fallback set: light_clean, electric_blue,
inter, same_as_body, single_column, professional_minimal, balanced, none.

## Type and pairing rules

- At most two display/body families in play; the mono face is a utility (code,
  data) and never counts toward that budget.
- Display sits at 700 (or 600 when `same_as_body`), tight line-height (~1.05),
  tracking pulled in slightly for large sizes.
- Body at 400, line-height 1.6; Georgia runs larger (1.125rem) because serifs
  read smaller at equal pixel size.
- Mono: JetBrains Mono (or ui-monospace stack), 0.875rem.

## Spacing and breakpoints

- Section gap and content padding come from the density table above — one
  scale, applied everywhere; no ad-hoc gaps.
- Content max width 1200px by default.
- Breakpoints: 640 / 768 / 1024 / 1280px. Mobile collapses to single column;
  tablet may open two-column grids; desktop takes the full layout.

## Universal principles (the quality floor)

Distilled, with sources. The brief may override stance; it may not waive the
floor.

- **Clarity** — text legible at every size, icons precise, adornment minimal.
- **Deference** — content leads, chrome recedes; UI never competes with the
  product it frames.
- **Depth** — hierarchy through layering and motion cues, not decoration
  piles. ([HIG foundations](https://developer.apple.com/design/human-interface-guidelines/foundations))
- **Touch targets** — interactive targets at least 44×44pt (iOS) / 48×48dp
  (Android); hit area, not visual size.
- **Safe areas** — respect notches, home indicators, and system gesture zones.
- **System first** — native controls before custom ones; custom must earn its
  difference.
- **Every input reaches everything** — keyboard, pointer, and touch all
  operate every control; visible focus on every interactive element.
- **Contrast** — WCAG AA as the floor (4.5:1 body text).
- **Motion** — short (well under 300ms), purposeful; honor
  `prefers-reduced-motion` unconditionally.
