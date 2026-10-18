---
name: issues
description: >-
  Break a plan, spec, or PRD into independently-grabbable issues on the project
  issue tracker using tracer-bullet vertical slices. Use when the user wants to
  convert a plan into issues, create implementation tickets, or break down work
  into issues as part of a developer workflow. Chinese triggers: 拆 issue, 创建
  issue, 拆任务, 拆工单, 把 PRD 拆成任务, 生成实现票, 垂直切片, vertical slice,
  tracer bullet.
---

# Issues

<!-- pi-dev-mode changelog:
- migrated from ~/.agents/skills/dev-issues (mattp to-issues/to-tickets derived;
  upstream has since merged to-prd/to-issues into to-spec/to-tickets — keeping the
  PRD layer is an intentional pi-dev-mode divergence, see docs/02-fusion-architecture.md)
- 2026-10-15 synced to mattp@49dd158 (cffab50): attach slices as sub-issues of the parent.
- 2026-10 P1 upgrade (03 matrix row): Blocked-by named as the task-graph edges; frontier semantics and the implement-spec handshake documented.
- 2026-10 P1.2 (pie dogfood observation): missing config bootstraps in place (one confirmation with a recommendation) instead of stopping to demand setup.
- 2026-10 P1.3 (user refinement): three-tier bootstrap — conclusive evidence → one confirmation; inconclusive or conflicting → ask_user with options labeled by the repo evidence found (or its absence).
  - 2026-10 P5.1 (standing instrument B retried, root cause): §4 'Quiz the user' asked four questions per turn — the skill itself commanded the interrogation. Rewritten to stated-defaults + one bundle question (one-question-per-turn is the stack's own model-the-domain discipline).
-->

Break a plan into independently-grabbable issues using vertical slices (tracer bullets).

This skill sits after `prd` or `align` in the developer workflow and before `tdd` implementation.

The issue tracker and triage label vocabulary should have been provided by `setup`. If missing, do not stop and send the user away. Read the repo evidence for the tracker — `git remote -v` (github.com → GitHub; a gitlab remote or none → no signal), `tasks/plan.md` (→ Tasks files), `.scratch/` (→ local markdown), incumbent conventions under `docs/` — then:
- **One conclusive signal** → ask exactly ONE confirmation question carrying your recommendation.
- **No signal, or conflicting signals** → use `ask_user` and let the user choose: present each candidate as an option labeled with the evidence you found (or its absence — e.g. "`tasks/plan.md` exists → Tasks files", "no remote, no tracker files → Tasks files (recommended: zero service dependencies)"), recommend one, never invent a tracker the repo shows no evidence for.
Then seed `docs/agents/` from the setup skill's references and continue the work this skill was invoked for.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes an issue reference (issue number, URL, or path) as an argument, fetch it from the issue tracker and read its full body and comments.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Issue titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

### 3. Draft vertical slices

Break the plan into **tracer bullet** issues. Each issue is a thin vertical slice that cuts through ALL integration layers end-to-end, NOT a horizontal slice of one layer.

Slices may be 'HITL' or 'AFK'. HITL slices require human interaction, such as an architectural decision or a design review. AFK slices can be implemented and merged without human interaction. Prefer AFK over HITL where possible.

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
</vertical-slice-rules>

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each slice, show:

- **Title**: short descriptive name
- **Type**: HITL / AFK
- **Blocked by**: which other slices (if any) must complete first
- **User stories covered**: which user stories this addresses (if the source material has them)

State your defaults inline — granularity calls, sample-data format, anything
you chose for the user — as one line each: decisions, not questions.

Then ask **exactly one** question carrying the whole bundle:

> 拆成这 N 张可以直接开工吗?要调就点名票号说怎么调。

Iterate only on objections the user raises (merge/split/retype the named
slices); take the yes and publish. A stated default is never re-opened as a
fresh question — one question per turn is the ceiling, not a quota to fill.

### 5. Publish the issues to the issue tracker

For each approved slice, publish a new issue to the issue tracker. Use the issue body template below. These issues are considered ready for AFK agents, so publish them with the correct triage label unless instructed otherwise.

Publish issues in dependency order (blockers first) so you can reference real issue identifiers in the "Blocked by" field. When the source material (plan, PRD, or spec) lives as a tracker issue, attach each published slice as a sub-issue of it (GitHub sub-issues), so the parent reference is structural rather than prose.

The "Blocked by" field is the task graph's edges. The **frontier** — slices with no unfinished blockers — is exactly what `implement-all` (parallel mode) works, one implementer per frontier ticket in its own worktree. Draft the graph while you slice (Step 4), not after publishing: a slice published without its edges is momentarily a false frontier entry. Where the tracker supports native dependencies, wire those too, so the frontier renders in the tracker's own UI.

<issue-template>
## Parent

A reference to the parent issue on the issue tracker (if the source was an existing issue, otherwise omit this section).

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

Do NOT close or modify any parent issue.
