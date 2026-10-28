# Parallel mode — the multi-agent orchestration

Read this only when the mode choice above picked parallel. The orchestrator is the session that ran the mode choice.

Orchestration discipline first: the session running this skill is the orchestrator — implementers never spawn each other, and no new multi-agent step gets wired without reading this package's `../../../references/orchestration-patterns.md` (endorsed patterns + anti-patterns).

1. Read the spec and tickets to understand the ticket graph.
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
   - follows the `implement` discipline (the per-task loop in `SKILL.md`, TDD at
     the pre-agreed seams);
   - merges the integration branch tip into its own branch before reporting
     done.
   Launch implementers as background agents with the `agent` tool, at most one
   per frontier ticket,
   subagent prompts sparse and self-contained (task file, AC labels, pointers
   — not pasted spec text).
5. As each implementer completes, a **merger subagent** merges its work into
   the integration branch — after asserting the shared working tree still sits
   on that branch with this package's `scripts/assert-branch.sh <integration-branch>`: a
   parallel top-level task can switch the shared HEAD out from under the
   orchestrator (it did, 2026-10-22).
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
