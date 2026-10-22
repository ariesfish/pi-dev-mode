# Exemplar library: 84 site DESIGN.md analyses

Source: [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT), snapshotted 2026-10-22.

One `<site>/DESIGN.md` per folder, 84 sites. These are **third-party
analyses** of those sites' design languages, written by the upstream repo's
authors — evidence sources, **not** official tokens from the sites themselves
(no Linear/Stripe/…) and not a license to reproduce what is trademarked or
proprietary there.

Each file carries `origin: "awesome-design-md (VoltAgent, MIT)"` as its first
frontmatter key — cite that header when using a file, never present its
contents as the site's own spec.

Usage (see the `reference` mode in this skill's SKILL.md): these analyses are
the **first evidence source** for "make it feel like X" when X has a folder
here — split into Keep / Change / Do-not-copy from them, with confidence
labels. A site not present here is **not** an invitation to invent: suggest
capturing the live site instead (screenshots, URL) and label everything
unobserved as inferred.

## Provenance notes (copy fidelity)

- 71 files: byte-identical to upstream except the inserted `origin` key.
- 10 files (kraken, lamborghini, lovable, mastercard, runwayml, sanity,
  spotify, starbucks, tesla, theverge) ship no frontmatter upstream; a minimal
  frontmatter block holding only the `origin` key was prepended, bodies
  untouched.
- 3 files (elevenlabs, raycast, supabase) had structurally invalid YAML
  upstream (one unquoted scalar containing ": "); exactly that one value was
  quoted so the frontmatter parses — content unchanged.
