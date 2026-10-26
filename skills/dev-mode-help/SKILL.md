---
name: dev-mode-help
description: >-
  One-page discovery map for this stack: which skill for which situation, how
  they chain into a lifecycle, and where the mode, mandate, and host mapping
  live. Use when exploring the stack, or when introducing it to a new session
  or teammate. Chinese triggers: 这个栈怎么用, 技能地图, 介绍给新队友.
---

# Dev Mode Help

Skill catalog, not a second router. When in doubt, say what you want in plain words and let `pi-dev-mode` route — the situation→skill routing table lives once, in its **Routing** section. This page is what each skill is, how they chain, and where things live.

```text
setup ─→ repo-map ─→ code-map ─→ research ─→ grill-me ─→ proto ─→ spec ─→
 constraints ─→ tickets ─→ triage-issue ─→ implement / implement-all ─→ review ─… doubt / benchmark-checklist / show-me / retro cut across
 code-review ─→ diagnose ─→ refact … scout above it all
```

## The catalog (one line each)

| Skill | What it is |
|---|---|
| `setup` | per-repo config: tracker, triage labels, domain-doc layout |
| `repo-map` | durable docs/REPO.md navigation map for repo-wide onboarding |
| `code-map` | one-area orientation: modules, callers, impact, next step |
| `research` | background agent reads primary sources; cited note at `.dev/<slug>/` |
| `grill-me` | sharpen a fuzzy idea one question at a time; GLOSSARY/ADR written inline |
| `proto` | throwaway artifact answers the design question before implementation |
| `spec` | the building contract: six decision sections, three-label acceptance |
| `ui-design` | the design contract: DESIGN.md lifecycle — brief / reference / extract / redesign for UI-bearing work |
| `constraints` | the quality bar with numbers — floor, enforced rows, diff watch |
| `tickets` | slice the plan into tracer-bullet tickets (graph + frontier) |
| `triage-issue` | route inbound reports through the triage-label state machine |
| `implement` | one ticket, serial, tdd kernel at the seams — scope check refuses multi-area blobs |
| `tdd` | red-green-refactor kernel: one test at a time, cost gate, answer-only discipline |
| `implement-all` | the whole graph: auto (serial single-approval) or parallel (integration branch + worktrees) |
| `diagnose` | feedback loop first; RED-then-GREEN commits; freezes loops that prove themselves |
| `code-review` | quick lane: Standards + Spec two-axis pass on a diff |
| `review` | the merge gate: five lenses in parallel, one aggregated verdict (design axis included) |
| `doubt` | in-flight adversarial cross-examination of a decision, bounded cycles |
| `benchmark-checklist` | the seven questions before any performance number leaves the room |
| `eval` | the promotion gate for skill changes: trigger regression / variant A/B |
| `commit` | conventional English commit message: type(scope): imperative subject, commit never push |
| `changelog` | CHANGELOG upkeep: Unreleased entries from the last tag, in the file's own style |
| `retro` | session retrospective: findings routed to checks/types/docs/skill edits |
| `refact` | deepen shallow modules — seams, locality, leverage |
| `scout` | chart decision tickets until the destination is visible (charting, not charging) |
| `show-me` | make the reply land: plain words, compact visuals in chat, one HTML page for heavy deliverables |
| `create-verification-skill` | generate the project's verify-<app> skill + feature map, proven by running |
| `maintain-verification-skill` | keep the verify skill's feature map honest: parallel readers + live pass |
| `pi-dev-mode` | the router: stage × shape × fog; owns the routing table |
| `dev-mode-help` | this page

## How they chain

- **Intent chain**: grill-me → (proto) → spec → tickets → implement-family.
- **Design contract**: `ui-design` pins DESIGN.md (repo root, mirrors AGENTS.md) for UI-bearing work; specs carry its status line.
- **Knowledge base (always-on)**: docs/GLOSSARY.md + docs/adr/ from `grill-me`/`refact`; every skill reads them and speaks the project's language.
- **Quality contract**: docs/CONSTRAINTS.md from `constraints`; `code-review` watches the diff against it; `implement-all` treats rows as gates.
- **Verification**: every build ends on the real artifact; `diagnose` freezes proven repro loops for the verification machinery (`create-verification-skill`).
- **Commit & release notes**: every implement-family commit follows `commit`; ship prep routes release notes through `changelog`.

## Where things live

- Routing mandate: injected every session by the pi extension (`hooks/session-start-context.md`); disable per repo with `session hook: off` in the model sheet.
- Host conventions (Skill tool / Task / AskUserQuestion → pi): `references/pi-host.md` in the package root.
- Model family aliases (opus/fable/…) and the override sheet: `models.json` + `~/.pi/agent/pi-dev-models.md`.
- Subagents: the `agent` tool (background, worktree isolation, readonly); the closed-loop map: `setup` → references/workflow.md.
