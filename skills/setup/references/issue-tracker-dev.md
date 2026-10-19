# Issue Tracker: Local Files (.dev/)

This repo tracks issues as plain files under `.dev/` — per-developer process
memory. Put `/.dev/` in `.gitignore`: its contents are one developer's
in-flight working set, never pushed, never shared as team record. The durable,
team-shared record is the merged code, commits, and `docs/adr/`. No tracker
service, no CLI — every skill reads and writes these files through plain file
edits.

## Layout

| Path | Content |
|---|---|
| `.dev/plan.md` | The task graph: one `## [T-…]` section per ticket |
| `.dev/todo.md` | Per-ticket criterion checklists + triage status markers |
| `.dev/tickets/T-XXX.md` | Full ticket body when richer than its plan row (optional) |
| `.dev/spec/<slug>.md` | The feature contract (`spec` skill) |
| `.dev/research/<slug>.md` | Research notes (`research` skill) |
| `.dev/sdlc/`, `.dev/audit/` | Machine ledgers (`gates/gate.sh`; only when opted in) |

## Creating an issue

Append a section to `.dev/plan.md`:

```markdown
## [T-004] Search filters reset on page change

- **Type**: HITL / AFK
- **Blocked by**: T-002 (if any)
- **What to build**: one-paragraph end-to-end behavior
- **Acceptance criteria**: three-label list ([check: …] / [evidence: …] / [judgment: …])
```

Keep ids stable (`T-001`, `T-002`, …); never renumber. The next id is the
highest existing + 1. Append only — an issue's historical position never
changes.

Add its checkbox block to `.dev/todo.md`:

```markdown
## T-004
- [ ] criterion 1
- [ ] criterion 2
```

When the ticket needs a fuller body than its plan row carries (prototype
snippets, interface contracts), write `.dev/tickets/T-004.md` with the
`Parent` / `What to build` / `Acceptance criteria` / `Blocked by` shape and
leave the plan row as the index entry. A `Status:` line near the top of a
ticket file carries its triage state; comments append at the bottom under
`## Comments`.

## Reading an issue

Read the matching `## [T-…]` section in `.dev/plan.md` (and its ticket file,
if one exists) in full before working. For "everything open": the `## …`
sections whose task is not checked off in `.dev/todo.md`.

## Labeling (triage roles)

Roles map to status markers in `.dev/todo.md`, applied as a parenthesized tag
on the heading line:

| Role | Marker |
|---|---|
| needs-triage | `(needs-triage)` |
| needs-info | `(needs-info)` |
| ready-for-agent | `(ready-for-agent)` |
| ready-for-human | `(ready-for-human)` |
| wontfix | `(wontfix)` + checked off |

So a ready issue reads `## T-004 (ready-for-agent)`.

## Closing an issue

Check off its `.dev/todo.md` block and add one line under the plan section:
`Closed <date>: <one-line resolution>`. Do not delete the section — the plan
file is the working history until the feature ships.

## Blocking

"Blocked by" names other task ids in the same plan file. The frontier is:
open tasks whose blocked-by list is all checked off.

## Conventions

- Never edit another task's section while resolving yours; append your
  resolution line only.
- Ship-time cleanup: once a feature lands and its truth is in the code,
  commits, and ADRs, its `.dev/spec/` and closed ticket sections may be
  deleted or archived — they are process memory, not record.
- If the repo later migrates to GitHub issues, `setup` rewrites this file
  into the new tracker doc; the dev files stay until their owner clears them.

## Legacy layouts

Repos carrying root `tasks/plan.md` + `tasks/todo.md`, or
`.scratch/<feature-slug>/` directories, use the same conventions under the
old roof: read them as the tracker exactly as written above. Migrating into
`.dev/` is the repo owner's call, not a skill's.
