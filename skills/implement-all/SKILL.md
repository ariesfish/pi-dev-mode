---
name: implement-all
description: >-
  Implement an entire spec/task-graph, not one ticket. Two modes: "auto"
  (serial autonomous — single approval, then every task test-first and
  committed, stops at risk or ambiguity) and "parallel" (multi-agent
  orchestration — integration branch, frontier of ready tickets, background
  implementer subagents each in its own worktree, merger subagents). Use when
  the plan is already sliced into tickets and the whole thing should get done.
  Chinese triggers: 实现全部, 整图实现, 并行实现, 把这些票都做了,
  一口气实现, 自主跑完, 全部做完, implement all.
---

# Implement All

Implement a whole plan: the tickets from `tasks` (task graph), or a task list
in a feature's `.dev/<slug>/plan.md`. `implement` is one ticket, serial, in-hand; this skill
takes the whole graph. Complement, not subordinate: `implement` after this
README.

## What implement-all needs before it starts

1. **A spec**, at a known path: `.dev/<slug>/spec.md` (multi-module work:
   `.dev/<initiative>/map.md` plus its `SPEC-<id>.md` files). A README
   or an arbitrary doc is not a spec. If none exists: stop, tell the user to
   run `spec` first. Do not invent requirements.
2. **A task list / task graph**: tracker tickets sliced by `tasks`, or the
   feature's `.dev/<slug>/plan.md` (with per-task checklists in its `todo.md`).
   Multiple features in flight: glob `.dev/*/plan.md` and take the union of
   per-feature frontiers. If absent, invoke `tasks` to generate one.
3. **A clean baseline**: `git status --porcelain` shows nothing outside
   expected planning artifacts (`.dev/*` — process memory, gitignored).
   Autonomous and parallel commits must not absorb unrelated local work, or
   the clean-rollback guarantee breaks.

The tickets are not a list of steps. They are a **task graph** with blocking
edges. The **frontier** — open tickets with no unfinished blockers — is the
set that can be worked right now.

## Pick the mode up front

- **auto (serial, default)**: you (this session) run the tasks yourself, in
  dependency order, one at a time, after a single approval. Choose for deep
  dependency chains, small graphs, or a run the user will watch live.
- **parallel**: an integration branch, and background implementer subagents
  work the frontier concurrently, each in its own worktree. Choose when the
  frontier is wider than a ticket or two of genuinely independent work.

If unsure, say both numbers aloud ("frontier is 4 wide, 2 deep") and pick
parallel when width > depth. The user's word ("并行" / "parallel") always
decides.

## Per-task loop (both modes)

For every task, in either mode:

- Read its acceptance criteria. Three labels: `[check: <command>]` runs the
  command; `[evidence: <procedure>]` follows the procedure and captures the
  artifact; `[judgment: <who>]` surfaces the question instead of deciding it.
- Follow the `tdd` kernel: one test at a time, RED before GREEN. The `tdd`
  cost gate applies: expensive test paths fall back to the closest executable
  check with a `skip-test: <reason>` line in the decision trail.
- Run the regression suite and the build.
- Commit **only the files that task touched** plus its task-status update —
  never `git add -A` — one commit per task, so any point is a clean rollback.
- Append one row per decision to the trail (`.dev/audit/<task-slug>.tsv`). Final format
  (P3 定稿): columns `id, decision, reason, evidence, verdict, skip_test, show` —
  cells single-line, evidence is a pointer (commit / file:line / artifact path),
  never prose; verdict is a predicate state (`green` / `red` / `reverted` /
  `open`); **skip_test** carries the reference when the `tdd` cost gate fell
  back or a test path was honestly skipped (empty = nothing skipped — never a
  freeform skip note elsewhere); **show** is where a human SEES the work
  happened — a verify evidence dir, a walkthrough shot, a drive report, a
  commit range (trail + diff is what lets the human come back and trust it).
  Append-only; a wrong call gets a superseding row. Logs already written under
  the pre-P3 5-column header stay as history — new logs start on the final
  header.

## AUTO mode (serial autonomous)

1. **Single checkpoint.** Present the task list and wait for an unambiguous
   affirmative ("approve", "go", "yes"). Hedged responses ("looks reasonable",
   "I guess") are NOT approved. This is the only human gate.
2. **Execute every task in dependency order** via the per-task loop above.
   No pausing between tasks — the approval already covered them.
3. **Stop and ask — never push through** when:
   - a test cannot be made to pass, or the build breaks, without an obvious
     fix (→ `diagnose`)
   - the spec is ambiguous, or a task needs a decision the spec does not
     cover (→ surface it, ask)
   - a task is high-risk or irreversible: auth/permission changes,
     destructive migrations, payments, deletions, deploys, secrets, anything
     `git revert` cannot undo — get explicit sign-off first
   - an acceptance label turns out wrong (`[check]` no machine can run,
     `[judgment]` the agent keeps deciding anyway): fix the label, re-confirm
4. **After a blocker resolves**, the user re-invokes; resume from the next
   pending task.
5. **Summarize with evidence, not self-report**: failing-test output for at
   least one RED per task (or its skip-test line), suite and build results,
   commit hashes. "Inconclusive" is not a pass; flag it instead.
6. **Ledger (opt-in)**: 目标仓有 `.dev/lifecycle/` 时,每票 `gates/gate.sh open` 开票,
   票内 D 类门按 `implement` 的 ledger 条款 run 入账(tdd/check),票收工
   `close --note`;遇 blocker 的票停在 open 状态不 close,人裁决后重跑。
   `.dev/lifecycle/` 不在场:无账本步骤,照旧。

## PARALLEL mode (multi-agent orchestration)

1. Read the spec and tickets to understand the task graph.
2. (optional) An **exploration subagent** (or `research` in the background)
   for any exploration the tickets require. It saves its notes in a directory
   **outside the repo** (`~/.agents/dev-notes/` or the repo's existing notes
   convention), accessible to all future subagents, so implementers focus on
   implementation.
3. Create the **integration branch**. If the tracker closes work through PRs,
   or the user asks for one, open a draft PR after the first merge in step 5
   (a branch with no commits ahead of main can't open one), marked as closing
   the spec and tickets.
4. **Implementer subagents** work the frontier, each ticket in its own
   worktree on its own branch. Each implementer subagent:
   - confirms its worktree is based on the integration branch before
     starting, and resets onto it if not;
   - follows the `implement` discipline (the per-task loop above, TDD at the
     pre-agreed seams);
   - merges the integration branch tip into its own branch before reporting
     done.
   Launch implementers as background agents with the `agent` tool (lowercase,
   pi-dev's own), at most one per frontier ticket,
   subagent prompts sparse and self-contained (task file, AC labels, pointers
   — not pasted spec text).
5. As each implementer completes, a **merger subagent** merges its work into
   the integration branch.
6. The frontier advances: kick off more implementer subagents for newly
   unblocked tickets, until none remain.
7. `code-review` on the integration branch. Fix all findings in a single
   implementer subagent.
8. If a draft PR exists, mark it ready for review. Otherwise resolve each
   ticket the way the tracker closes work, and report the integration branch.
9. Clean up all implementer worktrees.

Communication to and from subagents stays sparse: **context pointers** (to
the spec, tickets, research notes, previous commits), never duplicated
payloads.

## When this is the wrong skill

- One ticket in hand → `implement` (no plan machinery, no modes).
- The plan is not sliced yet, or the destination itself is undecided →
  `tasks` / `scout`.
- Something is broken before the plan can run → `diagnose` first.
