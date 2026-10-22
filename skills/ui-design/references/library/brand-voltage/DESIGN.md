---
origin: "style-level distillation from awesome-design-md site analyses (VoltAgent, MIT) + typeui design-skills (Bergside, MIT); a genre abstraction, not any single site's spec"
version: 1
name: brand-voltage
description: "A white or black-and-white neutral stage where one saturated signature hue carries every conversion moment — CTAs, links, active states. Everything else stays ink, white, and gray; the hue is scarce by design, which is what makes it loud."
dimensions:
  palette: light_clean
  accent: "custom: one saturated signature hue, any"
  typography: inter
  display: same_as_body
  layout: single_column
  mood: professional_minimal
  density: balanced
  exclude: []
aliases: [airbnb, miro, spotify, uber, wise, pinterest, mongodb, jobright, nerdwallet, mydealz, nvidia, vodafone, vibrant]
colors:
  background: "#ffffff"
  surface: "#f7f7f7"
  text-primary: "#222222"
  text-secondary: "#6a6a6a"
  accent: "#d92b4b"
  accent-hover: "#b81f3f"
  hairline: "#e0e0e0"
  on-accent: "#ffffff"
typography:
  display: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 600, lineHeight: 1.15 }
  body: { fontFamily: "Inter, system-ui, sans-serif", fontSize: "1rem", fontWeight: 400, lineHeight: 1.55 }
  mono: { fontFamily: "JetBrains Mono, ui-monospace, monospace", fontSize: "0.875rem", lineHeight: 1.5 }
rounded: { sm: 8px, md: 12px, lg: 16px, pill: 9999px }
spacing:
  section-gap: 64px
  content-padding: 24px
  scale: "4/8/12/16/24/32"
---

## What it is

A neutral stage — white canvas, near-black ink, and gray hairlines, or the same kit rearranged as a black-and-white duet, black chapters framing a white body — where one saturated hue is the page's only chromatic voice. That hue is spent almost entirely on conversion: primary buttons, inline links, selected states, saved-item toggles.

The signature hue is a free variable — coral, canary, lime, green, aubergine, any saturated brand value; the style lives in the budget, not the color.

Because everything else is grayscale, one small color event carries the voltage of a palette three times its size.

## Distinguishing moves

- Single-hue audit: every chromatic fill, border, icon, and text color in the chrome derives from one hue; every other value resolves to white, near-black, or gray.
- Primary CTAs fill with the signature hue — white label on dark hues, ink label on canary/lime-class hues; secondary buttons stay neutral: outline, gray fill, or ink.
- The hue appears only on action and state — inline links, open tabs, selected chips, focus rings, saved toggles — never on a heading, a body run, or a resting card surface.
- Budget cap: at most three hue events per viewport; sticky-nav CTA + hero CTA + one active state is the ceiling, and a fourth event must demote another to neutral first.
- Photography and illustration keep their own color: no chrome color is sampled from imagery, and images are never re-tinted toward the hue.
- One type family serves every role: h1 and body copy resolve to the same family, hierarchy carried by size and a 400/500/600/700 weight ladder, sentence case throughout.
- Buttons render as pills or ≥12px rounds with cards at 8–16px radius, or the whole build commits to one 2px angular corner for an engineering-grade read — one radius dialect per build.
- Quiet states — disabled CTAs, tags, section washes — use pale tints of the hue or plain gray; no second decorative hue appears anywhere.

## Accent and color budget

One to three chromatic events per viewport; scarcity is the mechanism that makes the hue read as loud.

Never tinted: headings, body copy, nav and footer chrome, hairlines, resting card fills, avatars.

Where sources diverge, rule over token: the ink-duet dialect fills primary CTAs with near-black and shrinks the hue to the wordmark plus one reserved moment; the tint-band dialect runs pale washes of the hue across section bands while saturated fills stay on CTAs; the black-chapter variant bookends a paper-white body with full-bleed near-black hero and footer bands, where a lone hued CTA hits hardest. The billboard variant pushes the display register to stenciled weight-800 uppercase and lets poster-scale photography carry whole sections — the hue stays event-rationed, never louder than its pill CTAs.

Functional lanes — error red, success green, hot/cold signals, focus rings — sit outside the budget and outside decoration.

Logo colors never leak into chrome: the mark can be full-brand; the interface stays on budget.

## Keep / Change / Do-not-copy

- **Keep** — one hue on conversion moments, grayscale everything else, single-family type hierarchy, ≤3 chromatic events per viewport, soft CTA geometry.
- **Change** — set the signature hue to any saturated brand color and derive hover/pressed/tint ramps from it; pick a radius dialect (pill ↔ 16px ↔ 2px angular) or a structural variant (ink-duet CTAs, black hero/footer chapters).
- **Do-not-copy** — logos, literal screenshots, exact trade dress, and any single source's full token set: never its literal hue value, proprietary typeface, radius ladder, or shadow stack.

## Where it fits

- **saas-landing** — the archetype home: hero-plus-CTA stacks, pricing tiers, feature bands.
- **onboarding** — step progress, selected plan, and the single submit per screen all carry the hue.
- **mobile app** — tab bars, primary actions, and toggles read clearly on a small neutral canvas.
- **dashboard / desktop app** — marketing shells and dense tables keep converting while chrome stays neutral.
- **docs-page** — the plainest dialect: white reading column, hue only on links and actions.
- Moods served: conversion-focused, friendly-professional, consumer trust, high-energy startup.
- Not for: briefs needing several saturated categories in chrome at once, or immersion-first dark surfaces — pick a wider-palette or dark-theater genre instead.

## Blends

- **bento-grid** — borrow its asymmetric card grid below the fold.
  The hue still lands only on CTAs and the active cell, never on resting tiles.
- **noir-technical** — the dark product shell that often backs this genre's light marketing stage.
  Blend by flipping the duet dialect's polarity, not by adding a second hue.
- **playful-pop** — lift its rounded, friendly display face when the brief turns consumer.
  The one-hue budget survives the friendliness; keep body copy neutral.
- **press-magazine** — for duet versions that need editorial gravity.
  Take its asymmetric layout and heavy display type; reserve the voltage for actions.

## Sources

Distilled from airbnb, miro, spotify, uber, wise, pinterest, mongodb, jobright, nerdwallet, mydealz, nvidia, vodafone analyses (awesome-design-md, MIT) + vibrant typeui cards (typeui, MIT).
