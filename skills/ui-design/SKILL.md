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

## Guardrails

- Brief resolves only through craft.md tables; the reference and extract modes carry observed evidence instead, so their values may sit outside the vocabulary — with provenance.
- Adjectives ("premium", "clean") are mapping questions, not answers.
- A redesign edits DESIGN.md as decisions: what changes, why, version bumped — never a silent restyle.
