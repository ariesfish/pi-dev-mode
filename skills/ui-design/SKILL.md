---
name: ui-design
description: "Own the DESIGN.md lifecycle: pin the design contract before UI-bearing work, from a brief, from references, from an existing interface, or as an audit-first redesign. DESIGN.md is the design counterpart of AGENTS.md — a repo-root, plain-markdown control document (frontmatter tokens + eleven fixed sections) that every visual change reads first. Use when the repo has no DESIGN.md and UI work is starting, when a design direction must be pinned, or when 'make it feel like X' must become Keep/Change/Do-not-copy semantics. Chinese triggers: 设计规范, 设计决策, 建设计系统, 配色字体, 做同款, 改版设计, 设计宪法, DESIGN.md."
---

# UI design

DESIGN.md is to looks what AGENTS.md is to behavior: a plain-markdown file at the repo root, read before any UI-bearing work, that pins what "looks right" means for this repo. Without it, every ticket rediscovers the visual language and drifts.

## Ownership boundary

- A spec owns what done means (behavior, acceptance). DESIGN.md owns what looks right means (tokens, type, spacing, motion).
- UI-bearing work without a DESIGN.md is guessing; non-UI work is never blocked by its absence.
- One per repo, at the root, version stamped in frontmatter. Not a per-feature file.

## The four modes

| Mode | Entry question |
|---|---|
| brief | "What should this look like?" — resolve the eight dimensions, write DESIGN.md |
| reference | "Make it feel like X" — Keep / Change / Do-not-copy from references, then DESIGN.md |
| extract | "Capture what exists" — reverse an existing interface into DESIGN.md first |
| redesign | "Change the direction" — audit first, then deliberate edits, never silent restyle |

Brief's full workflow is below; the other modes carry their evidence protocols with their reference layers.

## Mode: brief

When the brief names an application archetype — landing page, dashboard, docs, mobile app, onboarding, desktop app — start from the matching preset in [`references/presets.md`](references/presets.md): a starting point the brief's explicit dimensions always override.

### 1. Accept the input

Two shapes, same destination: an explicit dimension list, or natural language ("dark, editorial, serif headlines, information-dense"). Prose maps to dimensions with the mapping table in [`references/craft.md`](references/craft.md); one phrase may map to several dimensions — resolve each on its own.

### 2. Resolve the eight dimensions

palette · accent · typography · display · layout · mood · density · exclude — a closed vocabulary; every legal value and its concrete tokens are in [`references/craft.md`](references/craft.md). A value outside the table is a question, never a guess: name the legal values and ask.

### 3. Apply defaults, transparently

Unspecified dimensions resolve by the default rules in craft.md (mood-compatibility driven). When the user is reachable and a missing dimension would change the direction, ask — bounded, at most two questions. Every defaulted dimension lands in the frontmatter `resolved-from-defaults` map and in the closing report: silent defaults are how one "clean" brief becomes five different sites.

### 4. Write DESIGN.md

From [`references/template.md`](references/template.md): frontmatter tokens (colors as a semantic map, typography per role) plus eleven fixed sections, names aligned with the wider DESIGN.md ecosystem so exemplar files drop in without translation. A DESIGN.md already exists → ask: overwrite, merge into it, or skip.

### 5. Optional: a preview a human can eyeball

When the direction needs human eyes (or the ask was HITL), also render one preview file: color swatches labeled with role and hex, type specimens at declared sizes, a spacing ruler, two or three live components styled with the resolved tokens. The preview is a looking glass, not the deliverable.

### 6. Report and hand off

Report every explicit decision and every default (value + the rule that picked it). Then the stack takes over: the spec carries a DESIGN.md status line, implement reads the contract before UI-bearing tickets, review audits against it.

## Mode: reference

"Make it feel like X" resolves through references, never adjectives from memory: X is a design language to evidence, not a spec to clone.

### 1. Label every reference

Every reference — screenshot, URL, an existing DESIGN.md, a [`references/library/`](references/library/README.md) file, user notes — is evidence tagged with a confidence label: **observed** (captured from the live interface), **provided** (handed in or vendored), or **inferred** (reasoned, not seen). No references at all → say so and stop; inventing from memory is the failure mode this exists to prevent.

### 2. Split each reference into three layers

| Layer | Holds |
|---|---|
| Keep | qualities to preserve: density, composition, type rhythm, color temperature, motion attitude |
| Change | what becomes this project's own: subject, copy, brand marks, exact layout |
| Do-not-copy | what never crosses over: logos, literal screenshots, claims, proprietary UI |

### 3. Resolve X against the exemplar library

X has a folder in `references/library/` → that DESIGN.md is the first evidence source: read it before anything else, cite it via its `origin` header as third-party analysis, and label its values provided — not observed, this repo did not capture the site. X missing → name the gap, suggest capturing the live site (screenshots or URLs), and leave every value inferred until that arrives.

### 4. Write the DESIGN.md and the split

Output = a DESIGN.md per the template (reference values may sit outside the brief vocabulary — each carried with provenance) plus the Keep/Change/Do-not-copy table, one row per claim, confidence label attached. The closing report names every reference, which decisions each drove, and what a live capture would upgrade.

## Guardrails

- Brief resolves only through craft.md tables; the reference and extract modes carry observed evidence instead, so their values may sit outside the vocabulary — with provenance.
- Adjectives ("premium", "clean") are mapping questions, not answers.
- A redesign edits DESIGN.md as decisions: what changes, why, version bumped — never a silent restyle.

## Mode: extract

Reverse an existing interface into DESIGN.md; the artifact is the audit baseline a later redesign diffs against, not a style endorsement.

1. Read the live UI and the code that produces it: pages, components, and the tokens actually in use, not what a config file claims.
2. Fill the same eleven sections of [`references/template.md`](references/template.md) from observed values.
3. Mark every entry with provenance: observed (read from the page or the source) or inferred (reverse-engineered from one instance where no explicit token exists).
4. Flag the contradictions the codebase carries instead of smoothing them over — multiple blues where one should exist, ad-hoc spacing off the scale, a radius per component rather than a system. Contradictions are findings to list, not drift to reconcile silently.

## Mode: redesign

Audit first; a redesign without an audit is a silent restyle with extra steps.

1. Read the existing DESIGN.md; if absent, run extract first and treat that as the baseline.
2. Diff the baseline against the live UI and list every mismatch before proposing anything.
3. Propose changes as explicit decisions: what moves, why, and the cost; bump the DESIGN.md version with every accepted change.
4. Silent restyles are findings, not merges: an unexplained visual change lands on the mismatch list as drift, waiting for a decision, never absorbed quietly.
