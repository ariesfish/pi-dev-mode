# Developer Workflow Skills

Use this map to choose the next skill. The workflow is not strictly linear; loop back when uncertainty appears.

```text
dev-setup
  -> dev-repo-map        # optional durable repo-wide onboarding map
  -> dev-code-map        # orient in unfamiliar task-specific code
  -> dev-research        # delegate primary-source investigation to a background agent
  -> dev-align           # align language, decisions, GLOSSARY.md, ADRs
  -> dev-proto           # answer unclear design/UI/logic questions
  -> dev-prd             # synthesize intent into a PRD
  -> dev-issues          # split PRD/plan into vertical slices
  -> dev-triage-issue    # route issues through labels and agent briefs
  -> dev-implement       # implement one ticket, serial, TDD at the seams
  -> dev-implement-spec  # implement the whole task graph, multi-agent parallel
  -> dev-code-review     # two-axis review: Standards and Spec, parallel sub-agents
  -> dev-diagnose        # fix bugs/regressions with a feedback loop
  -> dev-refact          # improve seams/locality after learning from code
```

`dev-tdd` is the implementation kernel both `dev-implement` and `dev-implement-spec` drive at the pre-agreed seams; it also stands alone for a single well-specified slice.

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

- If repo configuration is missing, start with `dev-setup`.
- If the repo is unfamiliar and needs durable onboarding context, use `dev-repo-map`.
- If you do not understand the task-specific code area, use `dev-code-map` before planning or editing.
- If a question needs external docs/APIs read, delegate it to `dev-research` and keep working.
- If language or trade-offs are fuzzy, use `dev-align` before writing PRDs/issues.
- If the best design is unknown, use `dev-proto` before committing to a PRD or issue breakdown.
- If the work is feature-shaped, use `dev-prd` then `dev-issues` then implementation.
- If the work starts as an issue, use `dev-triage-issue`; send ready work to implementation.
- One ticket in hand: `dev-implement`. A whole task graph with a ready frontier: `dev-implement-spec` (implementer subagents in parallel worktrees).
- After implementation, before merging: `dev-code-review` on the diff since the fixed point.
- If something is broken or slow, use `dev-diagnose` before refactoring.
- If code friction remains after implementation or diagnosis, use `dev-refact`.
