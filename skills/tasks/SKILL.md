---
name: tasks
description: >-
  The tracker domain's one owner, both directions. Outbound: break a plan,
  spec, or PRD into independently-grabbable tasks on the project tracker using
  tracer-bullet vertical slices. Inbound: triage incoming bug reports and
  feature requests through the label state machine into the same tracker. Use
  when the user wants to break work down into tasks, convert a PRD into
  implementation tickets, or when an incoming report needs filing and
  labeling. Chinese triggers: 拆任务, 拆成 tasks, 拆工单, 把 PRD 拆成任务,
  生成实现票, 垂直切片, vertical slice, tracer bullet, 入件, 来了个 bug
  报告, 归置 issue, 分诊 issue, 整理 issue, 看 issue, 准备 agent brief,
  标记 ready-for-agent, 需要补充信息, wontfix (renamed from issues + merged
  triage-issue, 2026-10-18).
---

# Tasks

<!-- pi-dev-mode changelog:
- migrated from ~/.agents/skills/dev-issues (mattp to-issues/to-tickets derived;
  upstream has since merged to-prd/to-issues into to-spec/to-tickets — keeping the
  PRD layer is an intentional pi-dev-mode divergence, see docs/02-fusion-architecture.md)
- 2026-10-15 synced to mattp@49dd158 (cffab50): attach slices as sub-issues of the parent.
- 2026-10 P1 upgrade (03 matrix row): Blocked-by named as the task-graph edges; frontier semantics and the implement-spec handshake documented.
- 2026-10 P1.2 (pie dogfood observation): missing config bootstraps in place (one confirmation with a recommendation) instead of stopping to demand setup.
- 2026-10 P1.3 (user refinement): three-tier bootstrap — conclusive evidence → one confirmation; inconclusive or conflicting → ask_user with options labeled by the repo evidence found (or its absence).
- 2026-10 P5.1 (standing instrument B retried, root cause): §'Quiz the user' asked four questions per turn — the skill itself commanded the interrogation. Rewritten to stated-defaults + one bundle question (one-question-per-turn is the stack's own model-the-domain discipline). [as issues]
- 2026-10 P5.2: renamed issues → tasks (the GitHub idiom 'issue' means inbound
  reports, which is exactly why the old trigger words collided) and MERGED
  triage-issue in as the 入件 section — one owner for the tracker domain, both
  directions. Trigger words redistributed: 拆任务 family → outbound slicing;
  入件/归置/分诊 family → inbound triage. Bootstrap paragraph deduplicated to
  this one copy. triage-issue's references moved to references-triage/.
-->

The tracker domain's one owner, both directions: **出件** — slice a plan, spec, or PRD into independently-grabbable tickets (vertical slices, tracer bullets) — and **入件** — triage incoming reports through the label state machine into the same tracker. This skill sits after `prd` or `align` and before `tdd` implementation.

The tracker and triage label vocabulary should have been provided by `setup`. If missing, do not stop and send the user away. Read the repo evidence for the tracker — `git remote -v` (github.com → GitHub; a gitlab remote or none → no signal), `tasks/plan.md` (→ Tasks files), `.scratch/` (→ local markdown), incumbent conventions under `docs/` — then:
- **One conclusive signal** → ask exactly ONE confirmation question carrying your recommendation.
- **No signal, or conflicting signals** → use `ask_user` and let the user choose: present each candidate as an option labeled with the evidence you found (or its absence — e.g. "`tasks/plan.md` exists → Tasks files", "no remote, no tracker files → Tasks files (recommended: zero service dependencies)"), recommend one, never invent a tracker the repo shows no evidence for.
Then seed `docs/agents/` from the setup skill's references and continue the work this skill was invoked for.

## 出件:Process(slicing)

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

### 4. Confirm the breakdown (stated defaults + onequestion)

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

### 5. Publish the tickets to the tracker

For each approved slice, publish a new ticket to the tracker. Use the body template below. These tickets are considered ready for AFK agents, so publish them with the correct triage label unless instructed otherwise.

Publish tickets in dependency order (blockers first) so you can reference real ticket identifiers in the "Blocked by" field. When the source material (plan, PRD, or spec) lives as a tracker ticket, attach each published slice as a sub-issue of it (GitHub sub-issues), so the parent reference is structural rather than prose.

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

## 入件分诊

Move incoming reports on the tracker through a small state machine of triage roles — same tracker, same bootstrap above, this time applied to what arrives rather than what you slice.

Every comment or ticket posted to the tracker during triage **must** start with this disclaimer:

```
> *This was generated by AI during triage.*
```

Reference docs: [references-triage/AGENT-BRIEF.md](references-triage/AGENT-BRIEF.md) (durable agent briefs) · [references-triage/OUT-OF-SCOPE.md](references-triage/OUT-OF-SCOPE.md) (the `.out-of-scope/` knowledge base).

**Roles.** Two category: `bug` (something is broken), `enhancement` (new feature or improvement). Five state: `needs-triage` (maintainer must evaluate), `needs-info` (waiting on reporter), `ready-for-agent` (fully specified, ready for an AFK agent), `ready-for-human` (needs human implementation), `wontfix` (will not be actioned). Every triaged ticket carries exactly one of each. These are canonical names — the tracker's actual label strings may differ per `setup`'s mapping. If state roles conflict, flag it and ask the maintainer before anything else.

**Transitions.** An unlabeled ticket goes to `needs-triage` first; from there to `needs-info`, `ready-for-agent`, `ready-for-human`, or `wontfix`. `needs-info` returns to `needs-triage` once the reporter replies. The maintainer overrides at any time — flag unusual transitions and ask.

**Triage a specific ticket:**

1. **Gather context.** Read the full ticket (body, comments, labels, reporter, dates). Parse prior triage notes so resolved questions aren't re-asked. Explore the codebase using the domain glossary, respecting ADRs. Two checks: (a) **redundancy** — search for an existing implementation of the requested behavior by domain concept (not the request's wording) and report where you looked; found = an already-implemented `wontfix` (step 5). (b) **prior rejection** — read `.out-of-scope/*.md` and surface any prior rejection that resembles this ticket.
2. **Recommend.** State your category + state recommendation with reasoning and a brief relevant codebase summary. Wait for direction.
3. **Reproduce (bugs only).** Before any grilling: read the reporter's steps, trace the code, run tests or commands. Report what happened — successful repro with code path, failed repro, or insufficient detail (a strong `needs-info` signal). A confirmed repro makes a much stronger agent brief.
4. **Align (if needed).** If the ticket needs fleshing out, run `align`.
5. **Apply:**
   - `ready-for-agent` — post an agent brief comment ([AGENT-BRIEF.md](references-triage/AGENT-BRIEF.md)). A performance report ("slower", "lags", "latency regression") gets a brief that names `diagnose` as the entry skill and requires a baseline measurement before any fix is proposed.
   - `ready-for-human` — same structure, note why it can't be delegated (judgment calls, external access, design decisions, manual testing).
   - `needs-info` — post triage notes (template below).
   - `wontfix` (bug) — polite explanation, then close.
   - `wontfix` (enhancement) — write to `.out-of-scope/`, link from a comment, then close ([OUT-OF-SCOPE.md](references-triage/OUT-OF-SCOPE.md)).
   - `needs-triage` — apply the role; optional comment on partial progress.

**Quick override.** "Move #42 to ready-for-agent" — trust the maintainer, confirm what you're about to do (roles, comment, close), then act directly, no grilling. If jumping to `ready-for-agent` without a grilling session, ask whether they want an agent brief written.

**Needs-info template:**

```markdown
## Triage Notes

**What we've established so far:**
- point 1
- point 2

**What we still need from you (@reporter):**
- question 1
- question 2
```

Questions must be specific and actionable, not "please provide more info".

**Resuming.** If prior triage notes exist, read them, check whether the reporter answered outstanding questions, present an updated picture, and continue — never re-ask resolved questions.
