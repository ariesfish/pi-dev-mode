---
name: dev-mode-help
description: >-
  One-page discovery map for this stack: which skill for which situation, how
  they chain into a lifecycle, and where the mode, mandate, and host mapping
  live. Use when unsure which skill fits, when exploring the stack, or when
  introducing it to a new session or teammate. Chinese triggers: 用哪个技能, 这个栈怎么用, 技能地图.
---

# Use the Stack

Situation → skill. When in doubt, say what you want in plain words and let `pi-dev-mode` route; this page is for picking directly.

```text
setup ─→ repo-map ─→ code-map ─→ research ─→ grill-me ─→ proto ─→ spec ─→
 constraints ─→ tickets ─→ triage-issue ─→ implement / implement-all ─→ review ─… doubt / benchmark-checklist / retro cut across
 code-review ─→ diagnose ─→ refact … scout above it all
```

## "I want to…"

| Situation | Skill | One line |
|---|---|---|
| Set this repo up for the stack | `setup` | tracker, triage labels, domain-doc layout |
| Understand the whole repo once | `repo-map` | durable docs/REPO.md navigation map |
| Understand one area before changing it | `code-map` | area map, callers, impact, next step |
| A question needs docs/APIs read | `research` | background agent, primary sources, cited file |
| Sharpen a fuzzy idea; agree on words | `grill-me` | one question at a time; docs/GLOSSARY.md + ADRs written inline |
| Unsure the state machine / layout is right | `proto` | throwaway artifact answers the question |
| Formalize intent into the building contract | `spec` | six decision sections, three-label acceptance, .dev/<slug>/spec.md |
| Define "good enough to ship" with numbers | `constraints` | docs/CONSTRAINTS.md floor + enforced rows + diff watch |
| Split the plan into work | `tickets` | vertical slices, task graph, frontier |
| Route incoming reports | `triage-issue` | label state machine, agent briefs |
| Do one ticket now (ONE area — its scope check refuses multi-area blobs to issues) | `implement` | serial, tdd at the seams, AC three-labels, review, commit |
| Do the whole graph | `implement-all` | auto (single approval, serial) or parallel (integration branch + frontier + worktrees) |
| Review a diff / branch / PR | `code-review` | Standards axis + Spec axis, parallel subagents |
| Gate a merge: four lenses, one verdict | `review` | two-axis + comments + doubt + constraints, weighted dedup |
| Cross-examine a decision in flight | `doubt` | fresh adversarial reviewer, 3-cycle bound |
| Vet a measured number | `benchmark-checklist` | the seven questions, before reporting |
| Retrospective a session | `retro` | findings routed to checks/types/docs/skill edits |
| Gate a skill change before it ships | `eval` | trigger regression over evals/, or blinded variant A/B |
| Something is broken or slow | `diagnose` | build a feedback loop first; RED-then-GREEN commits |
| Structure feels wrong after the fact | `refact` | deepen modules, seams, locality |
| The work is too big and foggy to plan | `scout` | decision tickets on the tracker until the way is clear |
| Route everything for me | `pi-dev-mode` | the router: stage × shape × fog |

## How they chain

- **Intent chain**: grill-me → (proto) → spec → tickets → implement-family.
- **Knowledge base (always-on)**: docs/GLOSSARY.md + docs/adr/ from `grill-me`/`refact`; every skill reads them and speaks the project's language.
- **Quality contract**: docs/CONSTRAINTS.md from `constraints`; `code-review` watches the diff against it; `implement-all` treats rows as gates.
- **Verification**: every build ends on the real artifact; `diagnose` freezes proven repro loops for the verification machinery (landing P3).

## Where things live

- Routing mandate: injected every session by the pi extension (`hooks/session-start-context.md`); disable per repo with `session hook: off` in the model sheet.
- Host conventions (Skill tool / Task / AskUserQuestion → pi): `references/pi-host.md` in the package root.
- Model family aliases (opus/fable/…) and the override sheet: `models.json` + `~/.pi/agent/pi-dev-models.md`.
- Subagents: the `agent` tool (background, worktree isolation, readonly); the closed-loop map: `setup` → references/workflow.md.
