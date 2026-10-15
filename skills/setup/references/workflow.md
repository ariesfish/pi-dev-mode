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
  -> issues          # split PRD/plan into vertical slices
  -> triage-issue    # route issues through labels and agent briefs
  -> implement       # implement one ticket, serial, TDD at the seams
  -> implement-spec  # implement the whole task graph, multi-agent parallel
  -> code-review     # two-axis review: Standards and Spec, parallel sub-agents
  -> diagnose        # fix bugs/regressions with a feedback loop
  -> refact          # improve seams/locality after learning from code
```

`tdd` is the implementation kernel both `implement` and `implement-spec` drive at the pre-agreed seams; it also stands alone for a single well-specified slice.

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
- If the work is feature-shaped, use `prd` then `issues` then implementation.
- If the work starts as an issue, use `triage-issue`; send ready work to implementation.
- One ticket in hand: `implement`. A whole task graph with a ready frontier: `implement-spec` (implementer subagents in parallel worktrees).
- After implementation, before merging: `code-review` on the diff since the fixed point.
- If something is broken or slow, use `diagnose` before refactoring.
- If code friction remains after implementation or diagnosis, use `refact`.
