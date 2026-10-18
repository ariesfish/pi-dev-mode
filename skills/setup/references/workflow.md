# Developer Workflow Skills

Use this map to choose the next skill. The workflow is not strictly linear; loop back when uncertainty appears.

```text
setup
  -> repo-map        # optional durable repo-wide onboarding map
  -> code-map        # orient in unfamiliar task-specific code
  -> research        # delegate primary-source investigation to a background agent
  -> align           # align language, decisions, GLOSSARY.md, ADRs
  -> proto           # answer unclear design/UI/logic questions
  -> prd             # synthesize intent into a PRD
  -> spec            # upgrade the PRD/conversation into the building contract
  -> constraints     # define "good enough to ship" with numbers (CONSTRAINTS.md)
  -> issues          # split the plan into vertical slices (task graph)
  -> triage-issue    # route incoming issues through labels and agent briefs
  -> implement       # one ticket, serial, TDD at the seams
  -> implement-all  # the whole task graph: auto (serial, single approval) or parallel (multi-agent worktrees)
  -> review          # merge gate: four lenses (two-axis, comments, doubt, constraints) in parallel
  -> benchmark-checklist  # vet a measured number before it is reported
  -> doubt            # in-flight adversarial cross-exam of a non-trivial decision
  -> retro            # session retrospective: findings routed to the highest enforcing level
  -> eval             # promotion gate for skill changes (trigger regression / blind A/B)
  -> diagnose        # fix bugs/regressions with a feedback loop
  -> refact          # improve seams/locality after learning from code

wayfinder            # above it all: when the destination is foggy, decision tickets first
pi-dev-mode          # the router that picks between all of these
```

`tdd` is the implementation kernel `implement` and `implement-all` (both modes) drive at the pre-agreed seams; it also stands alone for a single well-specified slice.

## Durable artifacts

- `docs/agents/issue-tracker.md` — how skills read and publish issues.
- `docs/agents/triage-labels.md` — canonical triage roles mapped to repo labels/statuses.
- `docs/agents/domain.md` — where domain docs live and how to consume them.
- `GLOSSARY.md` — glossary only; no implementation details. (Legacy name: `CONTEXT.md`)
- `docs/adr/*.md` — hard-to-reverse, surprising trade-off decisions.
- PRD — product intent, implementation decisions, testing decisions, out-of-scope.
- Issues — independently grabbable vertical slices.
- Tests/code — source of truth for behavior and implementation.

## Routing rules

- If repo configuration is missing, start with `setup`.
- If the repo is unfamiliar and needs durable onboarding context, use `repo-map`.
- If you do not understand the task-specific code area, use `code-map` before planning or editing.
- If a question needs external docs/APIs read, delegate it to `research` and keep working.
- If language or trade-offs are fuzzy, use `align` before writing PRDs/issues.
- If the best design is unknown, use `proto` before committing to a PRD or issue breakdown.
- If the work is feature-shaped: `prd` then `spec` then `tasks`, then `implement-all`.
- If the destination itself is undecided (big, foggy), use `scout` first — decisions, not deliverables.
- If no quality bar is written down, `constraints` before an autonomous run.
- If the work starts as an issue, use `triage-issue`; send ready work to implementation.
- One ticket in hand: `implement`. Whole task graph: `implement-all` — auto for an unattended serial run, parallel when the frontier is wide.
- After implementation, before merging: `review` (the four-lens merge gate); `code-review` alone for a single two-axis pass.
- About to commit non-trivial code or take a high-stakes step: `doubt` mid-flight, before the merge gate.
- A measured number is about to be reported: `benchmark-checklist` first; a number without its limiter is not a result.
- Session over, before handoff: `retro`; its skill edits feed this stack itself.
- If something is broken or slow, use `diagnose` before refactoring.
- If code friction remains after implementation or diagnosis, use `refact`.
- Browsing/unsure what to pick: `use-the-stack`, or say it in plain words and let `pi-dev-mode` route.
