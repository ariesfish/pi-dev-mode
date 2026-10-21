---
name: pi-dev-mode
description: >-
  Default entry point for any non-trivial task on this stack: routes the work to
  the right lifecycle stage and skill, then keeps the routing tight until the
  work ships. Use at the start of a task, when a job spans spec/tickets/
  implementation/review, or for standing requests like "get this PR green",
  "ship the stack", "I'm going to bed, finish it". Chinese triggers: 走流程,
  用 pi-dev, 该用哪个技能, 大干一场.
---

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
| Fuzzy idea, no shared language yet | `grill-me` (then `proto` if a question is best answered by building) |
| A question needs external docs read | `research` (background) |
| Formalize the work | `spec` -> `tickets` |
| The quality bar with numbers is missing, or an autonomous loop is about to run | `constraints` |
| Incoming bug report / feature request needs filing & labels | `triage-issue` (same tracker, inbound lane) |
| One ticket to build (names ONE area or module) | `implement` |
| A task naming MULTIPLE areas or modules (checklist-shaped: "X + Y + Z", whole-area rebuild, porting a reference set) | not `implement`'s job: split first (`tickets`) → `implement-all` (auto or parallel). **First reply = the split table itself** (ticket name / scope / deps / one-line acceptance for each); any file deliverable appearing before the split is confirmed is the breach shape — a single-pass build |
| Whole ticket graph — unattended or wide frontier | `implement-all` (auto: serial single-approval; parallel: one implementer per frontier ticket) |
| A standalone test-first ask (red-green-refactor, regression seam, cost gate) | `tdd` (the kernel; rides inside `implement`/`implement-all`) |
| Something is broken or slow | `diagnose` (its perf branch passes `benchmark-checklist` before a number is claimed) |
| The repo has no scripted way to prove UI/CLI/service behavior on the real app | `create-verification-skill` (generate one) / `maintain-verification-skill` (keep its feature map honest) |
| Review a diff / PR / branch (single two-axis pass) | `code-review` |
| Gate a merge / ship | `review` (four lenses in parallel readonly reviewers, one aggregated verdict; high-stakes merges add an independent adjudicator — a fresh agent on a different model writes its own verdict file under `.dev/audit/evidence/`) |
| A measured number is about to be claimed | `benchmark-checklist` before the number leaves the room |
| The reply must land: user lost in the terms, asks to explain / draw / see, or a dense deliverable is about to be handed over | `show-me` (plain words + compact Markdown visuals in chat; one HTML page for the key artifact) |
| Non-trivial decision mid-flight, high stakes | `doubt` (fresh adversarial reviewer, bounded loop) |
| Session ending / before handoff | `retro` |
| A skill/description change about to land | `eval` (trigger regression over evals/, or variant A/B) — retro routes its substantive edits here |
| Structural friction, shallow modules | `refact` |
| Ship / land a green stack | `review` then the shipping playbook (pstack's shipping playbook underneath) |
| Unfamiliar code area / whole repo | `code-map` / `repo-map` |
| "Which skill for what" — stack overview for a new session or teammate | `dev-mode-help` |

**Scope test (before the fog test):** count the areas or modules the task names. More than one is not a ticket — it is a ticket graph missing its split. Routing a multi-area blob to `implement` buries the split, the tracker bootstrap, and the frontier; sort it into tickets first.

**Fog test:** if the destination itself is undecided (more than a session's
work, more unknowns than tasks, "which direction is still undecided"), that is
`scout`-grade work — say so and route there: chart decision tickets first
(plan-don't-do); scout hands its settled decisions to `tickets`.

## While it runs

- Verify on the real artifact before declaring anything done; "inconclusive"
  is not a pass.
- One focused decision per question when a human must be asked; every question
  carries your recommended answer.
- Delegations go to background agents via the `agent` tool, one writer per
  worktree, context pointers over pasted payloads. A
  parallel delegation — N independent reviewers/implementers — is ONE `agent`
  call with `tasks` (per-task model/worktree/readonly/retry), not N calls: the
  aggregate notice names every child. A child that must ask calls `ask_parent`;
  the answer_child notice rides the next turn.
- Small tasks (one file, obvious check) skip the mode entirely: work directly,
  verify, done.

## Reply contract

Short declarative sentences. Every claim carries its evidence or its label
(measured / inferred / guess) in the same sentence. Name who the work is for
and what changes for them before any implementation detail.

- Answer in the user's language; every claim carries, in the same sentence, its evidence or label — `[check: …]` / `[evidence: …]` / `[judgment: …]`, or an openable pointer (commit / file:line / artifact path).
- With no evidence, say "unverified" — never fabricate a plausible-looking citation; list uncovered items honestly, never skip them silently.
- Conclusion first, evidence alongside; no slop — delete empty summary paragraphs, stacked adjectives, and filler sections.
- Evidence artifacts survive cleanup; the `.dev/audit/` trail is append-only; name reasons for decisions, not rhetoric.

## Playbooks (10)

Named by need; each names its owning skill — follow the skill body, not this summary.

**Intent chain**
1. **idea → shared language**: fuzzy ask → `grill-me` (one question per turn, terms land in GLOSSARY). A question best answered by building detours to `proto`, then back.
2. **Formalize**: `spec` (six decision sections, three-label acceptance, assumptions named, approval gate before hand-off).
3. **Slice**: `tickets` (tracer bullet, single-metric, HITL/AFK, dependency graph → one-ticket frontier) — multi-area blobs never reach `implement` whole.

**Build**
4. **One ticket**: `implement` (tdd kernel inside, one test at a time, RED before GREEN).
5. **Whole graph**: `implement-all` auto (single checkpoint, stop-conditions, one commit + tsv row per ticket, only the files that ticket touched).
6. **Refactor**: `refact` (deepening over adding; module boundary first).

**Verify**
7. **Find what's broken**: `diagnose` — reproduce BEFORE fixing, evidence first (UI surfaces reproduce via the project's verify skill / control-web, never "must work"); commit order = repro before fix; perf symptoms pass `benchmark-checklist` before any number is claimed.
8. **The gate**: `code-review` (two-axis single pass) / `review` (four lenses + aggregate; high-stakes adds the independent verifier verdict file); numbers leave the room only after `benchmark-checklist`.

**Ship**
9. **Ship**: `review` gate first (APPROVE or informed accept), then land: one primary number (per the benchmark seven questions), release notes, post-ship verify pass, evidence archived (`.dev/audit/evidence/`, survives cleanup). Ledger on: the merge read-back rides as the `land` gate — close only after it passes.
10. **The loop**: `retro` at session end / before handoff; substantive skill edits route through `eval` (Mode A/B) — a rejected change lands in `evals/skill-impact.md`.

## Principles index (12 core + 5 addenda, from pstack's 24)

One line each — enough to steer when the owning skill is not loaded.

- **laziness-protocol**: reach for the smallest lever that works; escalate only when it fails.
- **foundational-thinking**: name the primitive before the tool around it.
- **subtract-before-you-add**: remove, then simplify, then add.
- **build-the-lever**: prefer checks/scripts that keep paying over one-off heroics.
- **exhaust-the-design-space**: when the design is open, spawn the alternatives before choosing.
- **model-the-domain**: names carry truth (GLOSSARY first; grill-me/refact enforce).
- **boundary-discipline**: know which side of each boundary a change lives on.
- **type-system-discipline**: make the compiler enforce what prose claims.
- **prove-it-works**: a generator/probe that never ran is a draft — run it.
- **fix-root-causes**: no wrapping symptoms; repro before fix, cause before symptom.
- **sequence-verifiable-units**: order work so each step is independently provable.
- **test-behavior-not-implementation**: assert what the user sees; green on broken code is worse than no test.
- (addendum) **explain-the-number**: every number ships with run count, range, limiter.
- (addendum) **guard-the-context-window**: pointers over payloads; delegate digging to subagents.
- (addendum) **attack-the-premise**: two fixes that share one premise failed the same gate — census who holds the premise before writing the third.
- (addendum) **never-block-on-the-human**: human touchpoints are intent confirmation, pure judgment, irreversible ops — everywhere else, proceed and report.
- (addendum) **make-operations-idempotent**: commands, lifecycle steps, and loops that run amid crashes and retries converge on the same end state.

## Autonomous / overnight (combo playbook)

Overnight autonomy = **`implement-all auto` + `/loop` heartbeat + decisions tsv**, each with its own job:

1. **Daytime**: `spec` → `tickets` slices the work into bounded tickets (1-3 frontier tickets per round, HITL items pushed last); the human approves once.
2. **Launch**: `implement-all auto` works the tickets — one commit per ticket + one row per decision in `.dev/audit/T-XXX.tsv` (seven columns, final: the show column shows the human the work, the skip_test column records honest skips); stop conditions per that skill (failing test / spec gap / a human decision needed → stop and write it in the replies, never push through vaguely).
3. **Heartbeat**: `/loop 30m check the frontier: advance ready tickets, stop on stop-conditions, wrap up and settle accounts when clear` — interval as you like; in print mode, `schedule_wakeup` is the equivalent.
4. **Morning audit**: the decisions tsv passes audit when every row carries before/after/evidence pointers; `review` spot-checks high-risk tickets; `retro` closes the loop.

## Ledger (optional, off by default)

A `.dev/lifecycle/` directory present = ledger on (D-class script gates / A-class verdict gates recorded + replayable history; `retro` mines first-pass rate / flip count — see the package's `gates/README.md`). **Absent: everything as before (P1-P4 behavior)** — the ledger is a narration layer, never a dependency.
