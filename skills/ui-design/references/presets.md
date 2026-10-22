# Archetype presets: six application starting points

When the brief names an application archetype, resolve the eight dimensions
from that archetype's preset first — then let the brief's explicit dimensions
override anything they touch. A preset is a starting point, never an override
of a real brief.

Provenance: presets distilled from OpenDesign design-templates (Apache-2.0) +
library cross-validation; desktop synthesized in-package.

## saas-landing

Web · distilled from the OpenDesign `saas-landing` template (Apache-2.0).

Decide first, before any UI work:

- Hero promise — one sentence: what, for whom, why now; one primary CTA verb
  for the whole page
- CTA hierarchy — primary CTA in the hero, secondary as the quiet alternative,
  footer band repeats the same verb; two competing verbs is drift
- Section order — hero → features → social proof → pricing → footer CTA; the
  story reads top-down, no scrolling back
- Proof and pricing — logos or testimonials (0–6) or none; pricing on/off with
  2–3 tiers
- Accent budget — one accent: hero CTA + footer CTA band + links, never more
- Section rhythm — hero density (opening vertical padding) and content max
  width, set once
- What never ships — app internals, second-row nav, a second accent, filler
  sections to fill space

Starting tokens ([`craft.md`](craft.md) vocabulary, one-line why):

- `palette: light_clean` — near-white warm paper (the template seeds #fafaf9);
  the story is the only event
- `accent: coral` — the templates' terracotta sits in the coral family; it
  carries CTAs and links, nothing else
- `typography: system_ui` — the native stack as the template ships it
- `display: same_as_body` — hierarchy from scale and weight; no second face in
  the conversion path
- `layout: single_column` — a landing tells one vertical story
- `mood: professional_minimal` — trust before style at the purchase moment
- `density: spacious` — the hero promise needs air; padding is the conversion
  device
- `exclude: stock_photos` — generic stock kills trust; product shot or nothing

Cross-validation: [`library/stripe/`](library/stripe/) (near-white canvas, one
indigo accent reserved for conversion actions) and
[`library/linear.app/`](library/linear.app/) (one chromatic accent, never
decorative) corroborate the one-accent budget and the quiet-surface posture.

## dashboard

Web · distilled from the OpenDesign `dashboard` template (Apache-2.0).

Decide first:

- What it monitors — sales, traffic, incidents, ops; that classification picks
  the 3–4 metrics that earn KPI cards (label + number + delta vs prior period)
- Chart system — one primary chart + one secondary chart or table; which
  encodings (line / bar / area), axis-label policy, where the legend lives
- Table contract — row height, columns, what a row links to, what happens on
  empty and long cells
- Nav anatomy — fixed left sidebar (220–260px, 6–8 items, icon + label, one
  active state) + top bar (page title, search, avatar)
- Numbers — precision, units, delta notation; tabular/mono numerics wherever
  data appears; no "Metric A / Metric B" placeholders, ever
- Palette polarity — light or dark canvas, picked once for glance distance;
  semantic success/error colors sit outside the accent budget
- Accent budget — active nav item + one chart highlight, ≤2
- Sticky chrome — sidebar and top bar pinned; only the main region scrolls
- State coverage — loading skeletons, empty states, error + retry; a
  dashboard without states is a still-life, not a tool

Starting tokens:

- `palette: light_clean` — data on near-white with hairline separation
  (template seeds warm paper); dark is a deliberate ask, not a default
- `accent: coral` — active nav + the one chart highlight; success and error
  live outside the budget
- `typography: system_ui` — UI text at small sizes; the mono utility face
  carries every metric
- `display: same_as_body` — dashboards have no display tier; a KPI number is
  mono at scale, not a display face
- `layout: two_column` — the sidebar rail plus the main grid
- `mood: professional_minimal` — chrome recedes, data leads
- `density: compact` — information-rich by definition; ops and trading
  tighten further, exec views may loosen
- `exclude: stock_photos` — dashboards show data, never people

Cross-validation: [`library/linear.app/`](library/linear.app/) corroborates
the sticky rail + ≤2-accent pattern (charcoal panels over hairlines, lavender
reserved for the active state) and [`library/vercel/`](library/vercel/)
corroborates the light polarity (near-white canvas, ink chrome, color only on
interactive states) — same restraint, both polarities.

## docs-page

Web · distilled from the OpenDesign `docs-page` template (Apache-2.0).

Decide first:

- Reading measure — body wraps at 60–75 chars; article column max-width
  ~720px, pinned before anything else
- Nav hierarchy — inline-start nav: 3–5 groups of 4–8 links, current page
  bolded with an inline-start accent stripe
- On-this-page rail — inline-end TOC of H2/H3 anchors, current section
  highlighted on scroll, anchors with scroll-margin on the target
- Sticky rails — both rails pinned while the article scrolls; the layout
  collapses gracefully below ~900px (TOC drops first, nav becomes a drawer)
- Code anatomy — mono face on a soft surface fill, language label, copy
  affordance; callout taxonomy (note / warning) fixed up front
- Prose floor — real content: one shell command, one 5–15 line snippet, one
  callout, one table; no lorem
- Link discipline — inline links + active nav item + one callout border carry
  the accent; never body text
- Logical properties — `margin-inline-start`, `inset-inline-end`,
  `text-align: start` on the rails so `dir="rtl"` flips correctly

Starting tokens:

- `palette: light_clean` — long-form reading wants maximum contrast on
  near-white
- `accent: coral` — the template's terracotta; links, active nav, one callout
  border — the reading surface stays inert
- `typography: system_ui` — prose face as the template ships it; docs must
  render on every platform
- `display: same_as_body` — hierarchy is H1–H3 scale, not a face change
- `layout: asymmetric` — nav rail, reading column, TOC rail: three regions,
  the article dominant
- `mood: professional_minimal` — reference posture; decoration loses to
  retrieval
- `density: balanced` — heading and section rhythm at reading pace, not
  marketing air, not data cram
- `exclude: gradients` — code fills and callout borders own the only texture

Cross-validation: [`library/mintlify/`](library/mintlify/) corroborates the
rails-and-measure anatomy (3-column docs — sidebar / prose / TOC, Inter prose
+ mono code, accent reserved for active states) and
[`library/supabase/`](library/supabase/) corroborates the one-accent restraint
(near-white system, a single green CTA event on dense docs).

## app (mobile)

Mobile · distilled from the OpenDesign `mobile-app` template (Apache-2.0 —
device seed, six layouts, P0/P1/P2 checklist).

Decide first:

- The screen's one job — feed / detail / onboarding / profile / checkout /
  focus; one screen does one thing, never two
- Navigation pattern — tab bar for feed / profile / focus screens; none for
  detail / onboarding / checkout
- Thumb-reach — the primary action lives in the lower arc; every target ≥44px,
  primary CTA ~48px
- Safe areas — notch or Dynamic-Island-class cutout, real status-bar glyphs,
  home indicator as the last visible element; never a rounded card pretending
  to be a phone
- First frame — the primary action is visible without scrolling; the content
  area scrolls, the frame never does
- Type floors — body ≥14px; numerics in mono; the display face appears on
  screen titles only
- Accent budget — one accent, ≤2 uses: active tab + primary CTA, or one
  accent card + one tab
- Assets — no external images; placeholders only (external URLs 404 and fake
  the device)

Starting tokens:

- `palette: light_clean` — the seed's warm paper (#fafaf7 ≈ light_clean);
  content colors the app
- `accent: coral` — the seed's terracotta; active tab + primary CTA is the
  default spend
- `typography: system_ui` — system first: the native stack is the platform's
  own voice
- `display: playfair` — the seed's serif display (Iowan / Charter / Georgia
  lineage) on screen titles only
- `layout: single_column` — the phone is a single column, period
- `mood: editorial` — serif titles over warm paper read editorial; craft's
  pairing for a serif display
- `density: balanced` — an 844px viewport; padding breathes but never wastes
  a fold
- `exclude: stock_photos` — placeholders only; external assets fake the frame
  or break the preview

Cross-validation: [`library/spotify/`](library/spotify/) corroborates the
content-first shell and finger-scale pill geometry (one green as the sole
chromatic event) and [`library/uber/`](library/uber/) corroborates the pill
on every interactive element; both are deliberate polarity/personality picks —
the preset's paper canvas is the neutral start they override.

## onboarding (mobile)

Mobile · distilled from the OpenDesign `mobile-onboarding` template
(Apache-2.0 — three-frame flow).

Decide first:

- Step arc — three screens: splash → value-prop → sign-in; count and order
  decided up front
- One idea per screen — headline + 1–2 sentences + one illustration; no
  menus, no tabs, no settings on first run
- Progressive disclosure — each screen asks for exactly the next step's worth
  of attention; everything else waits
- Escapes — skip top-right on every pre-sign-in screen; nothing traps
- Progress legibility — dots + `step N of 3`; the user always knows position
  and length
- First-run states — inline validation on sign-in, loading on submit, and a
  designed landing for the first screen after the flow
- CTA — one full-width pill per screen, bottom of the thumb arc; gentle
  gradient washes allowed, contrast stays AA
- Copy — the headline carries the value, the button carries the verb; no
  sentence longer than the screen

Starting tokens:

- `palette: light_clean` — the template's warm cream wash (#efece4) over a
  near-white system; first-run reads opt-in, not night mode
- `accent: coral` — the template's terracotta; one pill CTA per screen
- `typography: system_ui` — native stack as the template ships it; the front
  door speaks plainly
- `display: playfair` — the serif headline is the value-prop's voice, on step
  titles only
- `layout: single_column` — each phone frame is a single column
- `mood: editorial` — warm paper + serif welcome reads editorial-gentle, not
  toy-playful
- `density: spacious` — one idea per screen needs air; the welcome never
  crowds
- `exclude: stock_photos` — illustration or icon carries the hero; faces wait
  for the product itself

Cross-validation: [`library/notion/`](library/notion/) corroborates the
illustration-led voice with one pill CTA carrying conversion, and
[`library/oura/`](library/oura/) corroborates a single decisive CTA color
against an otherwise calm, warm canvas.

## app (desktop)

Desktop · **synthesized in-package (no upstream template)** — distilled from
[`craft.md`](craft.md) principles: system-first, keyboard reach, density.

Decide first:

- Command surface — menu bar, keyboard-shortcut map, palette / quick-open:
  every command lives somewhere findable, and every menu item prints its
  shortcut
- Keyboard-first — every action reachable without the mouse; visible focus
  everywhere; tab order matches the layout's logic
- Window chrome — traffic lights or min/max/close, minimum window bounds,
  panel geometry remembered across launches
- Panel anatomy — which rails exist (sidebar / inspector / status), what
  collapses where, what stays pinned
- System-first controls — native menus, scrollbars, inputs, context menus;
  custom chrome only where the tool earns its difference
- Density — compact rows and controls; screen area is the product
- Feedback channels — status bar for persistent state, toasts for events;
  error messages name the next move
- Data treatment — mono / tabular numerics wherever data appears; tools are
  read at a glance

Starting tokens:

- `palette: monochrome_dark` — tools sit in hour-long sessions; near-black
  keeps the glare down (a light brief flips this deliberately)
- `accent: coral` — the dark-palette default in craft.md; one chromatic event
  (selection, cursor, active)
- `typography: system_ui` — system first: the native face matches the OS
  controls and renders everywhere
- `display: same_as_body` — app chrome has no display tier; scale is semantic
  (title / body / caption)
- `layout: asymmetric` — command rail + working canvas + inspector: the tool
  anatomy
- `mood: professional_minimal` — tools stay sober for hours
- `density: compact` — compact is the value proposition: more tool per screen
- `exclude: gradients` — depth comes from layering and hairlines, not
  decoration (craft's Depth floor)
