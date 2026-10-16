---
name: pi-dev-mode
description: >-
  Default entry point for any non-trivial task on this stack: routes the work to
  the right lifecycle stage and skill, then keeps the routing tight until the
  work ships. Use at the start of a task, when a job spans PRD/issues/
  implementation/review, or for standing requests like "get this PR green",
  "ship the stack", "I'm going to bed, finish it". Chinese triggers: 走流程,
  用 pi-dev, 全流程做这个, 帮我安排这个活, 该用哪个技能, 大干一场.
---

<!-- pi-dev-mode changelog:
- 2026-10 P0 skeleton: routing table active; playbooks and the principles
  index land in P4 (see docs/04-implementation.md). Until then this skill
  routes with the table below and stays out of the way on small tasks.
- 2026-10 P1.2 (pie dogfood observation): routing row for lazy config bootstrap added.
- 2026-10 P2: routing rows for review / doubt / benchmark-checklist / retro; P2 placeholders resolved.
-->

# Pi Dev Mode

You own the routing. Read the task, pick the entry below, then stay in the
lead: open a todo list whose first items are the chosen skill's steps, review
every delegation's diff yourself, and frame the reply for the user and the
next maintainer.

## Routing

Three questions, in order: **which stage, what shape, how much fog?**

| Signal | Go to |
|---|---|
| Repo has no stack config, and the task needs it | don't detour: the dependent skill bootstraps in place (one confirmation); `setup` only for a deliberate full pass |
| Fuzzy idea, no shared language yet | `align` (then `proto` if a question is best answered by building) |
| A question needs external docs read | `research` (background) |
| Formalize the work | `prd` -> `issues` |
| Incoming issue needs routing | `triage-issue` |
| One ticket to build | `implement` |
| Whole task graph — unattended or wide frontier | `implement-all` (auto: serial single-approval; parallel: one implementer per frontier ticket) |
| Something is broken or slow | `diagnose` (its perf branch passes `benchmark-checklist` before a number is claimed) |
| Review a diff / PR / branch (single two-axis pass) | `code-review` |
| Gate a merge / ship | `review` (four lenses in parallel readonly reviewers, one aggregated verdict) |
| A measured number is about to be claimed | `benchmark-checklist` before the number leaves the room |
| Non-trivial decision mid-flight, high stakes | `doubt` (fresh adversarial reviewer, bounded loop) |
| Session ending / before handoff | `retro` |
| Structural friction, shallow modules | `refact` |
| Ship / land a green stack | `review` then the shipping playbook (ship lands P3/P4; pstack shipping 为底) |
| Unfamiliar code area / whole repo | `code-map` / `repo-map` |

**Fog test:** if the destination itself is undecided (more than a session's
work, more unknowns than tasks), that is wayfinder-grade work — say so and
plan decisions first instead of charging at implementation (wayfinder lands
P1).

## While it runs

- Verify on the real artifact before declaring anything done; "inconclusive"
  is not a pass.
- One focused decision per question when a human must be asked; every question
  carries your recommended answer.
- Delegations go to background agents, one writer per worktree, context
  pointers over pasted payloads.
- Small tasks (one file, obvious check) skip the mode entirely: work directly,
  verify, done.

## Reply contract

Short declarative sentences. Every claim carries its evidence or its label
(measured / inferred / guess) in the same sentence. Name who the work is for
and what changes for them before any implementation detail.

<!-- P4 will add: the principles index (12 selected), playbooks
     (intent-chain / build / verify / ship cores), the autonomous-run section,
     and the model-routing defaults. -->
