---
name: dev-implement
description: >-
  Implement a piece of work based on a PRD, spec, or set of tickets. Fetches
  the ticket by reference, implements at pre-agreed seams with TDD, typechecks
  and tests as it goes, reviews the result, and commits. Use when the user
  wants to implement a ticket, start work on an issue, or says "do this one".
  Chinese triggers: 实现这张票, 实现 issue, 开工, 干活, 按票实现, 实现 spec,
  做这个任务, implement this.
---

<!-- ariesfish changelog:
- migrated from mattp/skills/engineering/implement @49dd158, localized: setup→dev-setup,
  tdd→dev-tdd, code-review→dev-code-review; Chinese triggers added.
-->

# Dev Implement

Implement the work described by the user in the PRD, spec, or tickets.

If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.

The issue tracker should have been provided by `dev-setup`. If missing, run `dev-setup` first.

Call the Skill tool with `dev-tdd` where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, call the Skill tool with `dev-code-review` to review the work.

Commit your work to the current branch.
