---
name: implement
description: >-
  Implement a piece of work based on a spec or ticket. Fetches the ticket by
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
- 2026-10 P2.7 (F, retro A-F round): visual acceptance — visual criteria delegate to the `viewer` agent (multimodal); a text-only model must not self-assess pixel parity (P1 first shot did, and produced two reference deviations).
  - 2026-10 P5: opt-in ledger section (open/run tdd/close via gates/gate.sh; no .sdlc → unchanged).
  - 2026-10 P5.1 (standing instrument I root cause, v3): sessions hung twice on FOREGROUND viewer spawns with config-archaeology model ids while the legal render+pixel-diff evidence was already in hand (run 2 built it correctly, then still blocked on the spawn). v3: render evidence closes the visual gate — viewer is optional background enhancement, only foreground (deepseek-flash pinned) when no headless render exists at all.
  - 2026-10 P5.2 (v4, from the v4-bank kill forensics): two more foreground spawns on hand-typed ids ('sonnet', 'funai/gpt-5.6-terra') burned 20 of the 25 budget minutes before the render pipeline even started. v4 rule: spawn by TYPE (subagent_type: viewer carries the pin); hand-typed model ids are a bug shape; render evidence closes the gate, viewer is background-only enhancement.
-->

# Implement

## The scope check (run it first)

Count the areas or modules the task names. **More than one is not one ticket.** A checklist-shaped ask ("do X + Y + Z", a whole-area rebuild, porting a reference implementation wholesale) is a task graph missing its split: refuse the blob, route to `tasks` to slice it, and let `implement-all` (auto or parallel, per frontier width) execute. Implementing a multi-area blob as a single serial pass buries the split, the tracker bootstrap, and every per-ticket verification.

Implement the work described by the user in the spec or tickets.

If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.

The issue tracker should have been provided by `setup`. If missing, run `setup` first.

Read the ticket's acceptance criteria before starting. Three labels: `[check: <command>]` runs the command; `[evidence: <procedure>]` follows the procedure and captures the artifact; `[judgment: <who>]` surfaces the question instead of deciding it. A `[judgment]` you find yourself deciding is a stop-and-ask.

Call the Skill tool with `tdd` where possible, at pre-agreed seams. The `tdd` cost gate applies: an expensive test path falls back to the closest executable check, recorded as `skip-test: <reason> | fallback: <check>` in the decision trail.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

## Visual acceptance

If the ticket's criteria are visual — layout, styling, reference-image parity — never self-assess on a model that cannot see. `read` the reference image or a screenshot once: a "model does not support images" reply is the signal to delegate, not to fall back to code archaeology. Spawn the `viewer` agent (multimodal, pinned to a fast model) with the reference path and your captures, in the foreground so its report returns to this session. If your agent tool doesn't resolve a `viewer` type (pi-dev's `agent` knows only `general-purpose` and `pi-dev:*`), fall back: spawn `general-purpose` with the viewer brief, `model` on a multimodal fast model, `readonly: true` — or the `Agent` tool's `viewer` type where that package is present, foreground. Its report is your evidence — quote it in the ticket trail as `[evidence: viewer report]`, never paraphrase visual claims as your own.

Ladder, in order:

1. **Render + pixel-diff first** when the artifact renders headless (chrome/screenshot, then `magick compare`/SSIM against the reference) — mechanical evidence, no model in the loop. Render evidence in hand? **The visual gate closes there.**
2. **Viewer agent, spawned by TYPE — never by model string**: `subagent_type: viewer` (or the Agent tool's `viewer` type). The type carries its pinned multimodal model (`deepseek-flash`). As an *enhancement* over render evidence, spawn it in the BACKGROUND (`run_in_background: true`) and never await it — the report lands when it lands. In the foreground only when no headless render exists at all. A hand-typed `model` id (`sonnet`, `funai/*`, anything dug from config files) is a **bug shape, not a judgment call** — those ids can be wrong or HANG the turn. No viewer TYPE resolves → fall straight to (3).
3. **Explicit CANNOT-VERIFY** to the user. Blocking evidence beats absent evidence; a hung spawn is absent.

Acceptable evidence = a render+diff of the actual artifact, or a viewer report. Pixel archaeology — extracting colors from the reference and redrawing them — verifies your extraction, not the app; a circular reconstruction ("RMSE=0" against your own redraw) is a FAIL shape, not a pass.

Once done, call the Skill tool with `code-review` to review the work.

Commit your work to the current branch, staging only the files this ticket touched — never `git add -A`.

Report with evidence, not self-report: the failing-test output (or the skip-test line), suite and build results, the commit hash. "Inconclusive" is not a pass; flag it instead.

## Ledger (opt-in)

目标仓有 `.dev/sdlc/`(账本开启;工具 = 技能包的 `../../gates/gate.sh`,repo 内运行):票开工先 `gate.sh open <票号> "<标题>"`(已开则沿用),每道过的 D 类门 `gate.sh run <票号> tdd -- <测试命令>` 入账(FAIL 也入账,首跑红是事实),收工 `gate.sh close <票号> --note "<一句话>"`。`.dev/sdlc/` 不在场:一字不加,全套照旧。

For a whole task graph, or an unattended run, use `implement-all` (auto: single approval, serial. parallel: one implementer per frontier ticket, each in its own worktree). This skill stays one ticket, in hand; its scope check refuses multi-area blobs back to `tasks`.
