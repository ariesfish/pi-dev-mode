---
name: implement-spec
description: >-
  Implement an entire PRD or spec in code as a multi-agent coordination run:
  an integration branch, a task graph of tickets with a ready frontier,
  background implementer subagents each in its own worktree, and merger
  subagents merging completed work back. Use when the user wants the whole
  plan implemented, all tickets done, or parallel execution of a task graph.
  Chinese triggers: 实现整个 spec, 并行实现, 任务图执行, 多代理实现,
  把这些票都做了, integration branch, 全部实现.
---

<!-- ariesfish changelog:
- migrated from mattp/skills/engineering/implement-spec @49dd158, localized:
  sources /to-spec & /to-tickets → dev-prd & dev-issues; setup→dev-setup;
  tdd→dev-tdd; code-review→dev-code-review; Chinese triggers added.
  Relation to `dev-implement`: that is one ticket, serial; this is the whole
  task graph, parallel. (The addyosmani-style serial autonomous loop lands
  separately as the `build` skill, P1.)
-->

# Implement Spec

You have been provided a spec (typically the product of `prd` / `issues`). This spec should have tickets associated with it, describing how to implement the spec.

The issue tracker should have been provided by `setup`. If not, tell the user to run `setup`.

The goal is the entire spec implemented on a single **integration branch**, with every ticket resolved the way the issue tracker closes work.

The tickets are not a list of steps. They are a **task graph** with blocking relationships between them. This means there is always a **frontier** of tickets which are ready to be grabbed.

Communication to and from subagents should be sparse. Communicate primarily through **context pointers**: to the spec, tickets, research notes, and previous commits. Don't duplicate information already available via pointers.

**Implementer subagents** should be run in the background where possible for maximum concurrency.

## Steps

1. Read the spec and tickets to understand the task graph.

2. (optional) Use an **exploration subagent** (or `research` in the background) for any exploration the tickets require — relevant codebase files or external documentation. Ensure it can save files: it saves its markdown notes in a directory outside the repo (`~/.agents/dev-notes/` or the repo's existing notes convention), accessible to all future subagents. This lets **implementer subagents** focus on implementation rather than exploration.

3. Create the integration branch. If the issue tracker closes work through PRs, or the user asks for one, open a draft PR after the first merge in step 5 (a branch with no commits ahead of main can't open one), marked as closing the spec and tickets.

4. Use **implementer subagents** to implement each ticket, each in its own worktree on its own branch. Each implementer subagent:
   - confirms its worktree is based on the integration branch before starting, and resets onto it if not;
   - follows the `implement` discipline (`tdd` at the pre-agreed seams, typechecks and single test files regularly, the full suite at the end);
   - merges the integration branch tip into its own branch before reporting done.

5. Once an **implementer subagent** completes, merge its work to the integration branch with a **merger subagent**.

6. If this changes the **frontier** of available tickets, kick off more **implementer subagents** to work on the new tickets. This allows for maximum concurrency.

7. Once all tickets are complete, call the Skill tool with `code-review` on the integration branch. Fix all issues raised by the code review in a single **implementer subagent**.

8. If a draft PR exists, mark it ready for review. Otherwise, resolve each ticket the way the issue tracker closes work, and report the integration branch.

9. Clean up all **implementer subagent** worktrees.
