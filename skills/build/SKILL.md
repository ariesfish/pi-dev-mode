---
name: build
description: >-
  Implement plan tasks incrementally — one task per invocation, or "auto" for
  the whole plan in a single approved pass. Each task runs the full loop:
  failing test, minimal implementation, regression suite, build check, one
  commit. Use with a spec and a task list (tasks/plan.md or the tracker) for
  hands-on or autonomous implementation. Chinese triggers: 开始构建, 干活,
  按计划实现, 自动构建, build auto, 一口气做完, 继续做下一件.
---

<!-- ariesfish changelog:
- 2026-10 P1 new acquisition: forked from addyosmani /build + /build auto.
  Adapted: spec discovery includes the prd→spec upgrade path; the tdd kernel
  and its cost gate live in the tdd skill; decision trail is the .audit
  convention; doubt review lands in P2 (high-risk stops ask for sign-off).
-->

# Build

Implement tasks from an approved plan. Two modes:

- **default** (one task): implement the next pending task, then stop.
- **auto** (whole plan): one approval, then every task without pausing between them. Autonomy removes the human *stepping* between tasks, never the verification: every task still earns its failing test first (or a recorded `skip-test` fallback) and its own commit.

## What build requires before it starts

1. **A spec**, at a known path: `SPEC.md` at the root, `docs/SPEC.md`, or a file under `spec/`. A README or an arbitrary doc is not a spec.
   - A PRD (tracker issue from `prd`) alone is not enough either: propose running `spec` to upgrade it into a SPEC first.
   - If none exists: stop, tell the user to run `spec` first. Do not invent requirements.
2. **A task list**: `tasks/plan.md` (with per-task checklists in `tasks/todo.md`), or tracker issues sliced by `issues`. If absent, invoke `issues` to generate one.
3. **A clean baseline** (auto mode): `git status --porcelain` shows nothing outside expected planning artifacts (SPEC.md, docs/SPEC.md, spec/*, tasks/*). Autonomous commits must not absorb unrelated local work, or the clean-rollback guarantee breaks.

## AUTO mode protocol

4. **Single checkpoint.** Present the full plan and wait for an unambiguous affirmative ("approve", "go", "yes"). Hedged responses ("looks reasonable", "I guess") are NOT approved. This is the only human gate.
5. **Execute every task in dependency order.** For each task:
   - Read its acceptance criteria (three labels: `[check: <command>]` runs the command, `[evidence: <procedure>]` follows the procedure and captures the artifact, `[judgment: <who>]` surfaces the question instead of deciding it).
   - Follow the `tdd` kernel: one test at a time, RED before GREEN. The `tdd` cost gate applies: expensive test paths fall back to the closest executable check with a `skip-test: <reason>` line in the decision trail.
   - Run the regression suite and the build.
   - Commit **only the files that task touched** plus its task-status update — never `git add -A` — one commit per task, so any point is a clean rollback.
   - Append one row per decision to the trail (`.audit/<task-slug>.tsv`): id, decision, reason, evidence pointer, verdict.
6. **Stop and ask — never push through** when:
   - a test cannot be made to pass, or the build breaks, without an obvious fix (→ `diagnose`)
   - the spec is ambiguous, or a task needs a decision the spec does not cover (→ surface it as an Open Question, ask)
   - a task is high-risk or irreversible: auth/permission changes, destructive migrations, payments, deletions, deploys, secrets, anything `git revert` cannot undo — get explicit sign-off before continuing
   - an acceptance label turns out to be wrong (`[check]` that no machine can run, `[judgment]` the agent is deciding anyway): fix the label, re-confirm the criterion with the human
7. **After a blocker is resolved**, the user re-invokes; the loop resumes from the next pending task.
8. **Summarize at the end**: tasks completed, tests added, skip-test decisions with their fallback checks, commits made, anything flagged or left for the user.

## DEFAULT mode (one task)

Pick the next pending task, run steps 5–6 for it alone, then stop and report. No pre-approval needed beyond the user's ask — but every verification still runs.

## Evidence and honesty

The final summary cites evidence, not self-report: failing-test output pasted for at least one RED per task (or its skip-test line), suite and build results, commit hashes. "Inconclusive" is not a pass; say so and flag it.
