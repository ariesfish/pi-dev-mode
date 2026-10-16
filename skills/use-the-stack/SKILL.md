---
name: use-the-stack
description: >-
  One-page discovery map for this stack: which skill for which situation, how
  they chain into a lifecycle, and where the mode, mandate, and host mapping
  live. Use when unsure which skill fits, when exploring the stack, or when
  introducing it to a new session or teammate. Chinese triggers: 用哪个技能,
  这个栈怎么用, 技能地图, 有什么技能, 怎么开始, use the stack.
---

<!-- pi-dev-mode changelog:
- 2026-10 P1 new acquisition (N): the discovery page for sessions without the
  mandate or for humans browsing. The closed-loop map lives on in
  setup/references/workflow.md; this page is situation-first.
-->

# Use the Stack

Situation → skill. When in doubt, say what you want in plain words and let `pi-dev-mode` route; this page is for picking directly.

```text
setup ─→ repo-map ─→ code-map ─→ research ─→ align ─→ proto ─→ prd ─→ spec ─→
 constraints ─→ issues ─→ triage-issue ─→ implement / implement-all ─→
 code-review ─→ diagnose ─→ refact … wayfinder above it all
```

## "I want to…"

| Situation | Skill | One line |
|---|---|---|
| Set this repo up for the stack | `setup` | tracker, triage labels, domain-doc layout |
| Understand the whole repo once | `repo-map` | durable REPO.md navigation map |
| Understand one area before changing it | `code-map` | area map, callers, impact, next step |
| A question needs docs/APIs read | `research` | background agent, primary sources, cited file |
| Sharpen a fuzzy idea; agree on words | `align` | one question at a time; GLOSSARY.md + ADRs written inline |
| Unsure the state machine / layout is right | `proto` | throwaway artifact answers the question |
| Formalize intent | `prd` | PRD on the tracker, three-label acceptance criteria |
| Upgrade to the building contract | `spec` | SPEC.md (capability map when multi-module) |
| Define "good enough to ship" with numbers | `constraints` | CONSTRAINTS.md floor + enforced rows + diff watch |
| Split the plan into work | `issues` | vertical slices, task graph, frontier |
| Route incoming reports | `triage-issue` | label state machine, agent briefs |
| Do one ticket now | `implement` | serial, tdd at the seams, AC three-labels, review, commit |
| Do the whole graph | `implement-all` | auto (single approval, serial) or parallel (integration branch + frontier + worktrees) |
| Review a diff / branch / PR | `code-review` | Standards axis + Spec axis, parallel subagents |
| Something is broken or slow | `diagnose` | build a feedback loop first; RED-then-GREEN commits |
| Structure feels wrong after the fact | `refact` | deepen modules, seams, locality |
| The work is too big and foggy to plan | `wayfinder` | decision tickets on the tracker until the way is clear |
| Route everything for me | `pi-dev-mode` | the router: stage × shape × fog |

## How they chain

- **Intent chain**: align → (proto) → prd → spec → issues → implement-family or build.
- **Knowledge base (always-on)**: GLOSSARY.md + docs/adr/ from `align`/`refact`; every skill reads them and speaks the project's language.
- **Quality contract**: CONSTRAINTS.md from `constraints`; `code-review` watches the diff against it; `implement-all` treats rows as gates.
- **Verification**: every build ends on the real artifact; `diagnose` freezes proven repro loops for the verification machinery (landing P3).

## Where things live

- Routing mandate: injected every session by the pi extension (`hooks/session-start-context.md`); disable per repo with `session hook: off` in the model sheet.
- Host conventions (Skill tool / Task / AskUserQuestion → pi): `references/pi-host.md` in the package root.
- Model family aliases (opus/fable/…) and the override sheet: `models.json` + `~/.pi/agent/pi-dev-models.md`.
- Subagents: the `agent` tool (background, worktree isolation, readonly); the closed-loop map: `setup` → references/workflow.md.
