# Style library: twenty design languages

One `<style>/DESIGN.md` per folder. **Styles are named for the design
language, never for a site or company** — a profile is a genre abstraction
distilled from multiple third-party analyses, not any single site's spec.

This replaces the earlier company-named exemplar snapshot: the same evidence,
absorbed at style level. Two reasons. Naming by style keeps the library a
vocabulary ("noir-technical", "riso-print") that briefs and reviews can cite
directly, and it keeps the copyright posture clean — brand names survive only
as alias pointers for resolving "make it feel like X", never as cloning
targets; each profile's Keep / Change / Do-not-copy split says so explicitly.

## Using it

- **Reference mode** ("make it feel like X"): the alias index below resolves
  X — a site or product mention, or a style name — to one profile. Read the
  profile first, cite its `origin` header, label its values provided. No
  alias matches → closest style plus a live capture of the named reference;
  site-specific values stay inferred until then.
- **Brief mode**: a brief naming a style gets its eight `dimensions:`
  pre-resolved by that profile (craft.md vocabulary where expressible,
  `custom:` otherwise); the brief's explicit dimensions still override, and
  archetype presets (presets.md) compose on top — preset sets structure,
  style sets look.

## Index & alias map

| Style | The feel | Aliases: sites · absorbed typeui cards |
|---|---|---|
| noir-technical | Near-black engineering toolscape, hairlines, one restrained accent | linear.app, warp, raycast, sentry, voltagent, composio, clickhouse, x.ai, framer, webflow, hashicorp, resend, sanity · dramatic, shadcn |
| neon-terminal | Trading-floor terminal: mono numerics, dense tables, one neon hue on flat black | binance, kraken, 1win, opencode.ai · matrix, mono |
| black-cinematic | Pure-black luxury/mission cinema, full-bleed photography, tracked uppercase display | ferrari, lamborghini, bugatti, bmw-m, tesla, spacex, nike, playstation, renault, shopify, runwayml · power, bold |
| showroom-gallery | Photography-first product museum on light canvas, tile grids, chrome recedes | apple, dji, meta · premium |
| quiet-saas | Near-white paper, ink type, one accent reserved for conversion | airtable, expo, cal, supabase, vercel, ollama · clean, minimal, sleek, spacious, geometric, codex, levels, professional, flat, contemporary, square |
| institutional-fintech | Institutional finance: white/deep-ink trust, duality structures, precise numerics | coinbase, mercury, revolut, kraken, stripe · corporate |
| brand-voltage | Neutral canvas, one saturated signature hue carrying every conversion moment | airbnb, miro, spotify, uber, wise, pinterest, mongodb, jobright, nerdwallet, mydealz, nvidia, vodafone · vibrant |
| warm-editorial | Warm paper, serif display over quiet grotesque, human warmth | claude, cursor, oura, zapier, intercom, replicate, starbucks, lovable, mastercard · claude, terracotta, cafe, paper, refined, modern, agentic, storytelling |
| press-magazine | Strict black-on-white editorial grid, heavy wordmarks, dense columns | theverge, wired, aljazeera, elevenlabs, figma, minimax · editorial, artistic, basic |
| enterprise-sober | White canvas, grey-ladder structure, one corporate blue, dense data | ibm, sap, oracle, hp, bmw, cohere · ant, enterprise, stitch, material |
| atmospheric-wash | Gradient skies and diffused light as the emotional driver | mistral.ai, superhuman, mintlify, together.ai, slack · gradient, colorful |
| playful-pop | Illustration-led friendliness, rounded geometry, warm saturation | notion, slack, posthog, lovable · fiction, lingo, doodle, sketch, creative, expressive, friendly, immersive |
| bento-grid | Modular card-grid composition, scannable whole from varied blocks | bento |
| neobrutalist | Hard borders, offset block shadows, vivid flat fills, raw honesty | brutalism, neobrutalism, pulse, impeccable |
| glassmorphic | Frosted translucent panels, luminous borders, depth via translucency | glassmorphism |
| neumorphic | Soft monochrome extrusion, paired shadows, embedded controls | neumorphism |
| claymorphic | Puffy clay 3D rounds, pastel saturation, toy tactility | clay · claymorphism |
| riso-print | Two-ink risograph aesthetic, warm paper, offset misregistration texture | riso, dithered |
| arcade-retro | Era nostalgia: pixel/terminal type, CRT or bevel chrome, period palettes | dell-1996, nintendo-2001 · pacman, sega, tetris, retro, vintage |
| sci-fi-horizon | Neon glow on dark, futuristic display faces, HUD precision, spatial depth | cosmic, neon, futuristic, perspective |

`roku` (typeui) is not a look — an app-dashboard archetype; see presets.md
(`dashboard`).

## Provenance & licensing

- Site analyses: [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)
  (MIT), snapshotted 2026-10-22 and distilled at style level; the per-site
  files lived at this path before this rework and remain citable in git
  history.
- Style cards: [typeui awesome-design-skills](https://github.com/bergside/awesome-design-skills)
  (Bergside, MIT) — technique styles and corroborating moves.
- Each profile cites its concrete sources in its `## Sources` line.
- Every profile is an abstraction with a declared default token set: multi-source
  divergences become rules, not copies. Do-not-copy always names the sites'
  logos, screenshots, and exact trade dress.
