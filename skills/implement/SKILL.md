---
name: implement
description: >-
  Implement a piece of work based on a PRD, spec, or set of tickets. Fetches
  the ticket by reference, implements at pre-agreed seams with TDD, typechecks
  and tests as it goes, reviews the result, and commits. Use when the user
  wants to implement a ticket, start work on an issue, or says "do this one".
  Chinese triggers: 实现这张票, 实现 issue, 开工, 干活, 按票实现, 实现 spec,
  做这个任务, implement this.
---

<!-- pi-dev-mode changelog:
- migrated from mattp/skills/engineering/implement @49dd158, localized: setup→dev-setup,
  tdd→dev-tdd, code-review→dev-code-review; Chinese triggers added.
- 2026-10 P1.1: absorbed the retired build skill's default-mode rigor (three-label AC reading, staged commit, evidence-honesty reporting); handoff note to implement-all added.
- 2026-10 P2.6 (pie observation #3): scope check added — multi-area blobs refused to issues → implement-all.
-->

# Implement

## The scope check (run it first)

Count the areas or modules the task names. **More than one is not one ticket.** A checklist-shaped ask ("do X + Y + Z", a whole-area rebuild, porting a reference implementation wholesale) is a task graph missing its split: refuse the blob, route to `issues` to slice it, and let `implement-all` (auto or parallel, per frontier width) execute. Implementing a multi-area blob as a single serial pass buries the split, the tracker bootstrap, and every per-ticket verification.

Implement the work described by the user in the PRD, spec, or tickets.

If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.

The issue tracker should have been provided by `setup`. If missing, run `setup` first.

Read the ticket's acceptance criteria before starting. Three labels: `[check: <command>]` runs the command; `[evidence: <procedure>]` follows the procedure and captures the artifact; `[judgment: <who>]` surfaces the question instead of deciding it. A `[judgment]` you find yourself deciding is a stop-and-ask.

Call the Skill tool with `tdd` where possible, at pre-agreed seams. The `tdd` cost gate applies: an expensive test path falls back to the closest executable check, recorded as `skip-test: <reason> | fallback: <check>` in the decision trail.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, call the Skill tool with `code-review` to review the work.

Commit your work to the current branch, staging only the files this ticket touched — never `git add -A`.

Report with evidence, not self-report: the failing-test output (or the skip-test line), suite and build results, the commit hash. "Inconclusive" is not a pass; flag it instead.

For a whole task graph, or an unattended run, use `implement-all` (auto: single approval, serial. parallel: one implementer per frontier ticket, each in its own worktree). This skill stays one ticket, in hand; its scope check refuses multi-area blobs back to `issues`.
