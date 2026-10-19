---
name: tasks
description: >-
  Break a spec or plan into independently-grabbable tasks on the project
  tracker using tracer-bullet vertical slices. Use when the user wants to
  convert a plan into tasks, create implementation tickets, or break work
  down as part of a developer workflow. Chinese triggers: 拆任务, 拆工单, 拆成 tasks, 垂直切片, 把 spec 拆成任务.
---

# Tasks

Break a plan into independently-grabbable tickets (vertical slices, tracer bullets). This skill sits after `align` or `spec` in the developer workflow and before `tdd` implementation; incoming reports route to `triage-issue`.

The tracker and triage label vocabulary should have been provided by `setup`. If missing, do not stop and send the user away. Read the repo evidence for the tracker — `git remote -v` (github.com → GitHub; a gitlab remote or none → no signal), `.dev/<slug>/plan.md` or `.dev/inbox/` (→ local files), incumbent conventions under `docs/` — then:
- **One conclusive signal** → ask exactly ONE confirmation question carrying your recommendation.
- **No signal, or conflicting signals** → this choice folds into the ONE bundle confirmation of Step 4, never a separate interrogation turn: `ask_user` with the tracker candidates as options, labeled with the evidence you found (or its absence — e.g. "no remote, no tracker files → local files under `.dev/` (recommended: zero service dependencies, per-developer gitignored)"), recommended option first, never invent a tracker the repo shows no evidence for. Take the answer and move straight to slicing.
Then seed `docs/agents/` from the setup skill's references and continue the work this skill was invoked for.

## Process (slicing)

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes an issue reference (issue number, URL, or path) as an argument, fetch it from the issue tracker and read its full body and comments.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Ticket titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

### 3. Draft vertical slices

Break the plan into **tracer bullet** tickets. Each is a thin vertical slice that cuts through ALL integration layers end-to-end, NOT a horizontal slice of one layer.

Slices may be 'HITL' or 'AFK'. HITL slices require human interaction, such as an architectural decision or a design review. AFK slices can be implemented and merged without human interaction. Prefer AFK over HITL where possible.

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
</vertical-slice-rules>

### 4. Confirm the breakdown (stated defaults + one question)

Present the proposed breakdown as a numbered list. For each slice, show:

- **Title**: short descriptive name
- **Type**: HITL / AFK
- **Blocked by**: which other slices (if any) must complete first
- **User stories covered**: which user stories this addresses (if the source material has them)

State your defaults inline — granularity calls, sample-data format, anything
you chose for the user — as one line each: decisions, not questions.

Then ask **exactly one** question carrying the whole bundle:

> Can we start work on these N slices as-is? To adjust, name the ticket id
and say what to change.

Iterate only on objections the user raises (merge/split/retype the named
slices); take the yes and publish. A stated default is never re-opened as a
fresh question — one question per turn is the ceiling, not a quota to fill.

### 5. Publish the tickets to the tracker

For each approved slice, publish a new ticket to the tracker. Use the body template below. These tickets are considered ready for AFK agents, so publish them with the correct triage label unless instructed otherwise. Under the local-files tracker, tickets land inside the source feature's own directory — `.dev/<slug>/plan.md` section + `todo.md` block (+ optional `tickets/T-XXX.md`), slug taken from the spec's directory; unattributed intake goes to `.dev/inbox/` instead (see setup references/issue-tracker.md).

Publish tickets in dependency order (blockers first) so you can reference real ticket identifiers in the "Blocked by" field. When the source material (spec or plan) lives as a tracker ticket, attach each published slice as a sub-issue of it (GitHub sub-issues), so the parent reference is structural rather than prose.

The "Blocked by" field is the task graph's edges. The **frontier** — slices with no unfinished blockers — is exactly what `implement-all` (parallel mode) works, one implementer per frontier ticket in its own worktree. Draft the graph while you slice (Step 4), not after publishing: a ticket published without its edges is momentarily a false frontier entry. Where the tracker supports native dependencies, wire those too, so the frontier renders in the tracker's own UI.

<issue-template>
## Parent

A reference to the parent ticket on the tracker (if the source was an existing ticket, otherwise omit this section).

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation.

Avoid specific file paths or code snippets — they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it here and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

- A reference to the blocking ticket (if any)

Or "None - can start immediately" if no blockers.

</issue-template>

Do NOT close or modify any parent ticket.

