---
origin: "style-level distillation from awesome-design-md site analyses (VoltAgent, MIT) + typeui design-skills (Bergside, MIT); a genre abstraction, not any single site's spec"
version: 1
name: warm-editorial
description: Print-journal warmth on a cream paper canvas: light serif display headlines over a quiet grotesque body, warm near-black ink, and one clay accent reserved for actions. Product and code chrome sits on dark ink bands; illustration and warm photography carry the emotional load.
dimensions:
  palette: earth_tones
  accent: coral
  typography: "custom: body grotesque + georgia"
  display: playfair
  layout: single_column
  mood: editorial
  density: balanced
  exclude: []
aliases: [claude, cursor, oura, zapier, intercom, replicate, starbucks, lovable, mastercard, terracotta, cafe, paper, refined, modern, agentic, storytelling]
colors:
  background: "#f8f5ee"
  surface: "#f1ebdf"
  text-primary: "#242019"
  text-secondary: "#6b665a"
  accent: "#c66a4e"
  accent-hover: "#a95540"
  hairline: "#e4dccb"
  on-accent: "#fffaf4"
typography:
  display: { fontFamily: "Playfair Display, Georgia, serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 500, lineHeight: 1.05 }
  body: { fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.6 }
  mono: { fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "0.875rem", lineHeight: 1.5 }
rounded: { sm: 6px, md: 10px, lg: 16px, pill: 9999px }
spacing:
  section-gap: 96px
  content-padding: 32px
  scale: "4/8/12/16/24/32"
---

## What it is
A page that behaves like paper. The canvas is warm cream — never pure white — and it holds
generous editorial spacing, display headlines set in a high-contrast serif kept light and
un-bolded, and running text in a quiet humanist grotesque. Depth is surface contrast, not
shadow: cards sit a step deeper in cream, and warm near-black bands carry product chrome,
code wells, and the footer, pacing the page like chapters of a magazine. One warm accent
color does all the interacting — primary actions, inline links, the occasional full-bleed
callout — while earth tones stay inside illustration and data visualization. The register is
human, considered, and unhurried: a long-form column that happens to sell something.

## Distinguishing moves
- Canvas is tinted cream, never pure white; a sampled page hex must read warm (R > G > B), and `#ffffff` appears only as card lift.
- Display headlines are serif at weight ≤ 500 with slight negative tracking; body, labels, and buttons stay grotesque — a bold (700+) serif headline is a violation.
- Chromatic budget ≤ 2 accent events per viewport: one primary-CTA fill plus one inline-link cluster; a full-bleed accent callout band subsumes both for its viewport.
- Section bands alternate surface modes (cream → cream-card → warm near-black); the same surface never repeats in two consecutive bands.
- Resting cards sit one warm step off the canvas with a 1px warm hairline and zero drop shadow; shadows, if any, appear only on hover lift.
- Controls are pills or ≥ 8px rounded, content cards run 10–16px, and only full-bleed bands may be square.
- Emphasis inside running text comes from scale and family change, never from bolding body copy.
- Illustration is line art in ink + accent strokes on cream; photography runs warm-toned and often full-bleed; decorative gradients never appear.

## Accent and color budget
One accent hue per product — warm by default (clay, coral, terracotta); any single saturated hue
may substitute if the brand insists, budget unchanged. Per viewport: ≤ 2 chromatic events (the
primary CTA and the inline-link color), with a full-bleed accent band as an occasional
page-closing gesture. Earth-tone families (gold, clay, olive) are legal only inside illustration
and data-viz fills. Never tinted: body text, hairlines, icons, and section backgrounds — they
stay cream, ink, or warm neutral.

## Keep / Change / Do-not-copy
**Keep** — the cream paper canvas; the light serif display voice; the serif-display/grotesque-body
split; the single-accent budget; the cream-to-ink band rhythm; hairline cards that cast no shadows.
**Change** — the accent hue (any single saturated hue); the serif family (any high-contrast or slab
serif); the body grotesque (any quiet humanist grotesque); card direction (lift to white vs deepen
to cream); card radius anywhere within 10–24px.
**Do-not-copy** — logos, literal screenshots, exact trade dress, any single source's full token set.

## Where it fits
Archetypes: saas-landing for content-led and trust-led pitches, docs-page for long-form reading
comfort, onboarding for narrative walkthroughs, and mobile app reading surfaces; desktop app
qualifies only when reading dominates the chrome — readers, libraries, note apps. It is the
default genre for journals, essays, and blogs, and for products whose promise is care — wellness,
learning, human-voiced AI assistants, lifestyle and craft brands. Brief moods served: editorial,
calm, humanist, literary, quietly confident; serve those moods with long line lengths, pull
quotes, and drop caps when the format allows. Do not choose it for dense dashboards or control
surfaces, for urgent real-time products, or wherever cool slate authority and data density outrank
reading comfort and warmth.

## Blends
Atop bento-grid for feature grids: bento supplies the tessellation, the cream tokens and band
rhythm stay in charge. With noir-technical for dev products needing real code wells — its dark
mono panels become the ink band, cream bands hold everywhere else, and its mono font carries
inline code inside docs pages.

## Sources
Distilled from claude, cursor, oura, zapier, intercom, replicate, starbucks, lovable, mastercard analyses (awesome-design-md, MIT) + claude, terracotta, cafe, paper, refined, modern, agentic, storytelling cards (typeui, MIT).
