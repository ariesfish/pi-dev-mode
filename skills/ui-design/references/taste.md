# Design taste: dials, dark mode, AI tells, pre-flight

The floor under everything visual this skill ships: three dials gating
layout, motion, and density; a dark-mode protocol; the tells that stamp
output as LLM-default; a mechanical pre-flight; an audit-first redesign
flow. The brief may override stances; it may not waive the tells or skip the
pre-flight. Pairs with craft.md: dimensions pick values, this holds the floor.

Distilled from taste-skill (MIT, Leonxlnx,
https://github.com/Leonxlnx/taste-skill). Kept: the dial system, dark-mode
protocol, forbidden-pattern catalogue, pre-flight matrix, redesign protocol.
Prose rewritten for this package; runtime specifics (stack, package-manager
commands, code sketches, block library) deliberately dropped.

## The three dials

Three global variables gate every layout, motion, and density decision.
State each and reason it from the brief; never deploy the baseline silently.
Baseline `8 / 6 / 4` unless the design read overrides it, conversationally.
When reversing an existing interface, read the dials off the page: observed
values are that redesign's starting point, not the baseline.

| Dial | 1 means | 10 means | Governs |
|---|---|---|---|
| `DESIGN_VARIANCE` | symmetry | artsy chaos | symmetry, overlap, grid fractions |
| `MOTION_INTENSITY` | static | cinematic | what moves and how far |
| `VISUAL_DENSITY` | art gallery | cockpit | spacing scale, card vs divider |

- `DESIGN_VARIANCE` 1-3 predictable: symmetric grids, equal paddings,
  centered. 4-7 offset: margin overlaps, mixed aspect ratios, left headers
  over centered data. 8-10 asymmetric: masonry, fractional grids, big
  deliberated empty zones. Above 4: single column below 768px.
- `MOTION_INTENSITY` 1-3 static: hover and active states only. 4-7 fluid:
  sub-300ms transform/opacity transitions, staggered load-ins. 8-10
  choreography: scroll-linked reveals, parallax, pinning, springs, on
  scroll-driven primitives, never scroll listeners. Motion claimed is
  motion shown: a static page claiming 7+ is broken; if motion cannot
  ship, lower the dial.
- `VISUAL_DENSITY` 1-3 gallery: oversized gaps, expensive air. 4-7 daily
  app: standard web spacing. 8-10 cockpit: tight paddings, 1px dividers
  instead of cards, monospace numerals.

Dial inference (variance/motion/density): minimalist or Linear-style reads
5-6/3-4/2-3; premium consumer 7-8/5-7/3-4; playful or award-site 9-10/8-10;
default landing 7-9/6-8/3-5; trust-first or public-sector 3-4/2-3/4-5; a
preserving redesign matches the existing dials with +1 motion, an overhaul
adds +2 variance and +2 motion. Ambiguity between two reads: ask once.

## Dark-mode protocol

Dual-mode by default; never assume light-only unless the brief emulates print.

- Token strategy, one per project: utility dark variants paired on every
  color rule, or semantic variables (`--surface`, `--accent`) swapped under
  a dark query or attribute.
- No colors prescribed; enforced instead: contrast (AA floor, AAA hero copy),
  hierarchy parity (what pops in light pops in dark), brand fidelity (a dark
  theme that desaturates the brand away is a regression, not a theme).
- No pure black and no pure white anywhere: off values keep depth.
- Default to the system preference, add a manual toggle when either mode
  would lose key brand expression, and theme-lock the page: sections never
  invert mid-scroll (one deliberate full-page switch is the exception).
- Eyeball both modes before finishing; do not ship a page seen in one mode.

## AI tells (forbidden patterns)

Signatures of LLM-default output; unless the brief explicitly asks, each is
a defect.

Visual and color:

- No neon or outer-glow defaults; inner borders, tinted shadows.
- No oversaturated accents, no gradient-text display headings.
- No "AI purple" or lila glow: neutral bases, one high-contrast accent.
- No beige-and-brass premium-consumer default (cream, clay, espresso).
- No custom mouse cursors.

Typography:

- Inter is not a default face; reach past it deliberately.
- No oversized H1 doing hierarchy by raw scale; weight, color, spacing.
- Serif is not the default "creative" reach; justify it editorially.
- Fraunces and Instrument Serif banned as defaults; rotate faces per project.
- Emphasis stays inside the family; never a serif word in a sans headline.

Layout and assets:

- No row of three identical equal-width feature cards.
- No eyebrow above every section header: max one per three sections.
- No hand-drawn SVG icon paths; one icon family per project.
- No div-built fake screenshots: fake dashboards, terminals, task lists.
- No plain-text wordmarks posing as a logo wall; real marks or monograms.

Content:

- No placeholder identity: stock names, egg avatars, throwaway brands.
- No fake-precise round numbers (99.99%, 50k+); real, labeled mock, or none.
- No filler verbs: elevate, seamless, unleash, next-gen, revolutionize.

Production tells, each a hard ban:

- Hero version labels (V0.6, BETA, EARLY ACCESS) outside a launch brief.
- Micro-meta sub-eyebrows ("Brand, No. 01"); "00 / INDEX" numbering.
- Image or tile counters ("01 / 4"); the user can already count.
- Scroll cues of any form ("Scroll", "Scroll to explore", animated arrows).
- Middle dots rationed: max one per line, never a separator chain.
- Decorative colored dots before nav items, rows, badges; semantic state only.
- Headlines split mid-phrase by a line break with an italic tail.
- Vertical rotated text; crosshair grid lines as decoration.
- Fake version footers ("v1.4.2", "last sync 4s ago") in mocks or pages.
- "Quietly used at" social proof; poetic labels where functional fits.
- Locale, weather, clock strips ("LIS 14:23, 18C") unless about a place.
- Micro-meta sentences under headlines ("a feature we ship today" clutter).
- Generic step labels (Stage 1, Step 02, Phase 03); content is the label.
- Pills overlaid on photos; decorative photo-credit captions.
- Build stamps and live-stock counters as marketing ornament.
- The mono-caps word strip across the hero bottom ("TYPE / FORM / MOTION").
- A small explainer floating in a header's top-right corner.
- Border-top plus border-bottom on every row of a long list or spec table.
- Scoring or progress bars with filled background tracks on marketing pages.

Em-dash: zero, anywhere visible. The most-violated tell: no em-dash or
en-dash separator in headlines, labels, buttons, body, quotes, attribution,
captions, or alt text; restructure the sentence or use a plain hyphen.
Binary on purpose: "sparingly" has failed every time it was tried.

## Pre-flight check

Run mechanically before declaring any page done; one box that cannot be
honestly ticked means the page is not finished. Fix it, never rationalize it.

- [ ] Dials stated and reasoned from the brief, never silently baseline.
- [ ] Theme lock (one page theme), color lock (one accent), shape lock (one
      radius system).
- [ ] Button and form text readable (AA); placeholders never pose as labels.
- [ ] Hero fits the viewport: headline under 2 lines, subtext under 20, CTA in
      sight.
- [ ] Hero max 4 text elements; no tagline, trust strip, or teaser inside.
- [ ] Hero top padding near 6rem max at desktop.
- [ ] Eyebrow count at most ceil(sections / 3), hero counts as one.
- [ ] No 3 consecutive image-text split sections; 8 sections need 4 families.
- [ ] One label per CTA intent ("Get in touch" beside "Let's talk" fails).
- [ ] At most one marquee per page.
- [ ] Grid cell count matches content, no empty tiles; 2-3 carry visuals.
- [ ] Real images in visual slots; no fake screenshots, no pure-text pages.
- [ ] Logo wall below the hero, logos only, no category labels underneath.
- [ ] Zero em-dashes and en-dashes anywhere visible.
- [ ] Every visible string re-read: no broken or hallucinated phrasing.
- [ ] Numbers real or mock-labeled; quotes 3 lines, clean attribution.
- [ ] Every animation justified, claimed motion delivered; reduced motion
      honored above level 3.
- [ ] Loading, empty, and error states for every asynchronous surface.
- [ ] Navigation on one line at desktop, max 80px tall.
- [ ] Lists beyond 5 items use a real component, not a bulleted default.
- [ ] Mobile collapse declared per section; dynamic viewport units, not 100vh.
- [ ] Dark mode designed and eyeballed in both modes, not assumed.

## Redesign protocol (audit first)

Misreading the mode is the top source of bad redesign output; the first
action is detection, not design:

- Greenfield: no existing site, or approved full overhaul; dial baseline.
- Preserve: modernize without breaking the brand; audit first, evolve.
- Overhaul: new visual language over existing content and IA; greenfield
  visuals, preserved content.

Ambiguous read: ask once. Preserve the brand, or start visually from scratch?

Audit before touching anything; document: brand tokens (colors, type, logo,
radii); IA (page tree, nav, conversion paths); content blocks (earning their
place vs filler); patterns to preserve (signature interactions, hero, copy
voice) and to retire (tells, broken layouts, dead links, perf traps); the
dial reading of the current site (starting point, not baseline); the SEO
baseline (ranking pages, meta, structured data), the top redesign risk.

While modernizing, hold: IA stays put unless asked (slugs, anchor IDs, nav
labels); brand colors extracted before accent discipline applies (a purple
brand stays purple, override on record); copy voice and accessibility wins
never regress; nothing analytics depends on gets renamed.

Modernization levers, in order, stop when the brief is satisfied: typography
refresh, spacing and rhythm, color recalibration, motion layer, hero and
key-section recomposition, full block replacement only when a block is
unsalvageable. Decision tree: IA, content, SEO sound means targeted
evolution (first four levers, most of the value for a minority of the
risk); structural debt (broken IA, no system, broken mobile) means full
redesign with strict content preservation; the brand itself changing means
greenfield.

Never changes silently, only with explicit approval: URL structure, primary
nav labels, form field names or order, logo or wordmark, legal and consent
copy.

## Further reading

- WCAG contrast minimum:
  https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- MDN prefers-reduced-motion:
  https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
