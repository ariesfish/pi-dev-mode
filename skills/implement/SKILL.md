---
name: implement
description: >-
  Implement a piece of work based on a spec or ticket. Fetches
  the ticket by reference, implements at pre-agreed seams with TDD, typechecks
  and tests as it goes, reviews the result, and commits. Use when the user
  wants to implement a ticket, start work on an issue, or says "do this one".
  Chinese triggers: 实现这张票, 实现 issue, 开工, 按票实现, 做这个任务.
---

# Implement

## The scope check (run it first)

Count the areas or modules the task names. **More than one is not one ticket.** A checklist-shaped ask ("do X + Y + Z", a whole-area rebuild, porting a reference implementation wholesale) is a ticket graph missing its split: refuse the blob, route to `tickets` to slice it, and let `implement-all` (auto or parallel, per frontier width) execute. Implementing a multi-area blob as a single serial pass buries the split, the tracker bootstrap, and every per-ticket verification.

Implement the work described by the user in the spec or tickets.

If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.

If the tracker config is missing, bootstrap it in place — read the repo evidence, one confirmation question carrying your recommendation, then fetch the ticket (the same stance `tickets` ships; never a detour through `setup`).

Read the ticket's acceptance criteria before starting. Three labels: `[check: <command>]` runs the command; `[evidence: <procedure>]` follows the procedure and captures the artifact; `[judgment: <who>]` surfaces the question instead of deciding it. A `[judgment]` you find yourself deciding is a stop-and-ask.

Call the Skill tool with `tdd` where possible, at pre-agreed seams. The `tdd` cost gate applies: an expensive test path falls back to the closest executable check, recorded as `skip-test: <reason> | fallback: <check>` in the decision trail.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

## Visual acceptance

If the ticket's criteria are visual — layout, styling, reference-image parity — never self-assess on a model that cannot see. `read` the reference image or a screenshot once: a "model does not support images" reply is the signal to delegate, not to fall back to code archaeology. Spawn the `agent` tool with `subagent_type: pi-dev:image-reader` (multimodal, pinned to a fast model), the reference path, and your captures, in the foreground so its report returns to this session. If your agent tool doesn't resolve that type, fall back: spawn `general-purpose` with the image-reading brief, `model` on a multimodal fast model, `readonly: true`, foreground. Its report is your evidence — quote it in the ticket trail as `[evidence: image-reader report]`, never paraphrase visual claims as your own.

Ladder, in order:

1. **Render + pixel-diff first** when the artifact renders headless (chrome/screenshot, then `magick compare`/SSIM against the reference) — mechanical evidence, no model in the loop. Render evidence in hand? **The visual gate closes there.**
2. **Image-reader agent, spawned by TYPE — never by model string**: `subagent_type: pi-dev:image-reader`. The type carries its pinned multimodal model. As an *enhancement* over render evidence, spawn it in the BACKGROUND (`run_in_background: true`) and never await it — the report lands when it lands. In the foreground only when no headless render exists at all. Hand-picking a model string for the spawn (a bare alias like `sonnet`, or a provider/id dug from config files) is a **bug shape, not a judgment call** — the TYPE already carries its pinned model, and a wrong string can HANG the turn. No viewer TYPE resolves → fall straight to (3).
3. **Explicit CANNOT-VERIFY** to the user. Blocking evidence beats absent evidence; a hung spawn is absent.

Acceptable evidence = a render+diff of the actual artifact, or a viewer report. Pixel archaeology — extracting colors from the reference and redrawing them — verifies your extraction, not the app; a circular reconstruction ("RMSE=0" against your own redraw) is a FAIL shape, not a pass.

Once done, call the Skill tool with `code-review` to review the work.

Commit your work to the current branch, staging only the files this ticket touched — never `git add -A`.

Report with evidence, not self-report: the failing-test output (or the skip-test line), suite and build results, the commit hash. "Inconclusive" is not a pass; flag it instead. Before reporting, the increment must also clear the standing Definition of Done — this package's base bar: `../../references/definition-of-done.md` (the repo's own DoD document, if present, overrides it).

## Ledger (opt-in)

When the target repo carries `.dev/lifecycle/` (ledger on; tool = this
package's `../../gates/gate.sh`, run from the repo): open the ticket with
`gate.sh open <id> "<title>"` (reuse if already open), record every passed
D-class gate with `gate.sh run <id> tdd -- <test command>` (FAILs recorded
too — a first-pass red is a fact), and close with `gate.sh close <id> --note
"<one line>"`. A gate that exits 4 is BLOCKED — the item's rework budget
tripped: stop the ticket, report the gate, the consecutive-FAIL reason, and
the resume command (`gate.sh resume <id> --note "<reason>"`, human note
required); never retry through that gate and never reroute to another — the
block is item-level on purpose. Without `.dev/lifecycle/`: add nothing, full
unchanged behavior.

For a whole ticket graph, or an unattended run, use `implement-all` (auto: single approval, serial. parallel: one implementer per frontier ticket, each in its own worktree). This skill stays one ticket, in hand; its scope check refuses multi-area blobs back to `tickets`.
