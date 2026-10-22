---
origin: "style-level distillation from awesome-design-md site analyses (VoltAgent, MIT) + typeui design-skills (Bergside, MIT); a genre abstraction, not any single site's spec"
version: 1
name: noir-technical
description: "Near-black engineering canvas where the product screenshot is the hero. Hierarchy comes from a charcoal surface ladder, 1px hairlines, and one scarce accent hue; a mono face carries code, commands, and metrics."
dimensions:
  palette: monochrome_dark
  accent: "custom: one restrained hue (electric_blue default)"
  typography: inter
  display: same_as_body
  layout: single_column
  mood: professional_minimal
  density: compact
  exclude: [stock_photos]
aliases: [linear.app, warp, raycast, sentry, voltagent, composio, clickhouse, x.ai, framer, webflow, hashicorp, resend, sanity, dramatic, shadcn]
colors:
  background: "#0b0b0d"
  surface: "#151518"
  text-primary: "#f2f3f5"
  text-secondary: "#9da1a8"
  accent: "#4e80f0"
  accent-hover: "#739cff"
  hairline: "#26262b"
  on-accent: "#0d0d10"
typography:
  display: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 600, lineHeight: 1.05 }
  body: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.6 }
  mono: { fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "0.875rem", lineHeight: 1.5 }
rounded: { sm: 4px, md: 6px, lg: 12px, pill: 9999px }
spacing:
  section-gap: 96px
  content-padding: 24px
  scale: "4/8/12/16/24/32"
---

## What it is
A dark-first design language for engineering software: one near-black canvas runs edge to edge,
and light mode never appears. Elevation is a two- to four-step charcoal surface ladder plus 1px
hairline borders — never drop shadows — and the page chrome stays deliberately quiet so the
product itself (UI screenshots, terminal mockups, code windows) anchors every section. One
restrained accent hue, or an inverted white CTA, is the only chromatic event per fold;
everything else is grayscale with a monospace utility face assigned to code, commands, and
numerals. The result reads as technical documentation that learned to sell.

## Distinguishing moves
- Canvas is one constant near-black tone: every section band samples the same body background.
- Elevation is a surface-ladder step plus a 1px hairline; computed box-shadow on any card is none.
- One accent hue per site, at most two chromatic events per fold, and never a section or card fill.
- Every major section is anchored by a framed product screenshot, terminal mockup, or code window.
- Display uses the body family at weight 600 or lower, with negative letter-spacing above 40px.
- Mono face owns code, CLI commands, metrics, and uppercase tracked eyebrows — never paragraphs.
- Radius by role: buttons and inputs 4–8px, cards and mockups 12–16px; pills only for status chips.
- Featured, selected, and hover states are a one-step surface lift, never an accent border or glow.

## Accent and color budget
Budget two chromatic events per viewport: usually the primary CTA plus a focus ring or a
live-status dot. An inverted white CTA is the equally valid accent-free variant — pick one
strategy and hold it site-wide. Never tinted: section grounds, card fills, body text, hairlines.
Semantic success/error colors live inside product screenshots only. The one permitted photo form
is a named-customer portrait — never stock or lifestyle imagery.

## Keep / Change / Do-not-copy
- Keep: the canvas + ladder + hairline elevation model; the screenshot-terminal-code section
  rhythm; one centered reading column (~1200–1280px) where bands alternate by surface lift; mono
  reserved for machine text; featured-by-lift states; ~96px section rhythm with 16–24px card
  padding and a 56–64px top nav.
- Change: the single accent hue (any saturated hue — blue, violet, green, amber — or the
  white-inversion), the canvas cast (cool or faintly warm, but constant), card radius inside the
  12–16px band, and display weight anywhere within 400–600.
- Do-not-copy: logos, literal screenshots, exact trade dress, any single source's full token set;
  one source's signature ornaments (corner squares, starfield textures, gradient spotlight
  tiles, squiggle dividers) are identity, not genre.

## Where it fits
Strongest on saas-landing, dashboard, and docs-page archetypes for developer tools, data
infrastructure, and AI/agent platforms; also fits desktop-app landing pages and pricing pages
that stay on the dark canvas — onboarding steps and changelogs ride the same chassis. Serves
brief moods that read engineered, precise, quietly confident, performance-first — credibility
through restraint. Do not choose it for consumer or warmth-led brands, playful personalities,
long editorial reading experiences, or any brief that demands a light-mode canvas. Mobile-app
briefs suit it only where a dark canvas is native to the product itself.

## Blends
Blends well atop bento-grid when a section needs a denser module grid on the same dark chassis,
and with enterprise-sober for data tables and comparison rows — keep the mono header labels and
hairline row rules. One absorbed source runs this exact chassis with an oversized editorial
serif at display scale: treat that serif-headline dark variant as a blend toward
black-cinematic rather than core, trading the mono eyebrow for the serif headline and holding
everything else.

## Sources
Distilled from linear.app, warp, raycast, sentry, voltagent, composio, clickhouse, x.ai, framer, webflow, hashicorp, resend, sanity analyses (awesome-design-md, MIT) + dramatic, shadcn cards (typeui, MIT).
