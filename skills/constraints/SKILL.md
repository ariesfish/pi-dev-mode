---
name: constraints
description: >-
  Establish the project's quality bar as a written contract with numbers —
  docs/CONSTRAINTS.md — and stop agents quietly lowering it. Interviews which
  dimensions matter (with defaults for every question), installs what each
  dimension needs, defines a non-negotiable floor, and watches diffs for a
  weakened bar. Use when no quality bar is written down, when the user says
  "set up constraints" or "stop the agent shipping junk", or before running
  an autonomous loop. Chinese triggers: 建质量门槛, 定约束, 质量合同, 别偷偷降标准.
---

# Constraints

Other skills describe what good looks like. This skill writes down **this project's** bar, with numbers, in a file any agent can read and any check can enforce. Spec says what to build; tdd proves it works; constraints say what "good enough to ship" means — before anyone argues about it in a pull request.

An agent writes more in an afternoon than you will read that week, so the judgement moves out of your head and into checks that run around the loop.

## When NOT to use

- docs/CONSTRAINTS.md exists and the user is not changing it: read it and follow it.
- One-off scripts, spikes, throwaway prototypes.
- Non-interactive contexts (CI, autonomous loops): apply the Floor below, note it, flag the rest for a human.

## Step 1: Detect before you ask

Never ask what you can read. Before the first question: stack (`package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml`), test runner, existing linters, current coverage, CI, harness config. Report findings in two lines, then ask only what is left.

## Step 2: Four questions, each with a default

One question at a time; every question has a default, so "I don't know" still produces a working config:

1. Beyond the floor, which dimensions to enforce? (coverage on changed code / security scanning / performance budgets / accessibility / architecture boundaries) — say what each pick costs.
2. When a check fails mid-task: block or warn? Default: block on the floor, warn on the rest for the first two weeks.
3. Numbers in mind, or measure today and hold that line? Default: measure and hold (ratchet).
4. Slowest check tolerated before handing work back? Default: 90s at task end, unlimited in CI.

Stop at four. A twelve-question intake produces a config nobody understands.

## Step 3: Write docs/CONSTRAINTS.md

Repo root, machine-readable:

```markdown
# Constraints

Last reviewed: <date> by <who>

## Floor (always enforced, no setup required)

- No new suppression comments: `@ts-ignore`, `eslint-disable`, `# noqa`, `# type: ignore`
- No unimplemented stubs: `throw new Error("Not implemented")`, empty `catch {}`
- No skipped or deleted tests without a reason in the commit message
- No secrets in source
- This file does not get weakened to make a change pass

## Enforced with numbers

| Dimension | Rule | Checked by | Runs at |
|-----------|------|-----------|---------|
| Types | Zero type errors | `tsc --noEmit` | every edit |
| Coverage | Changed lines ≥ 80% | `vitest run --coverage` + git diff | task end, CI |

Every row names the command that produces the verdict. A dimension with a
number and no command is an aspiration, not a constraint.

## Measured, not yet enforced

| Metric | Today | Direction |
|--------|-------|-----------|
| Project coverage | 62.4% | must not fall |

## Exceptions

| ID | Rule | Path | Reason | Owner | Expires |
|----|------|------|--------|-------|---------|
| W1 | `no-explicit-any` | `src/legacy/**` | Rewrite tracked in ENG-441 | @who | 2026-11-01 |
```

Then add one line to `AGENTS.md`/`CLAUDE.md`: `Read docs/CONSTRAINTS.md before writing code. Do not weaken it to make a change pass.`

## Step 4: Install what each dimension needs

A picked dimension means an installed check — use the de facto tool for it (`tsc`/`mypy`, existing lint config, coverage from the test runner, `semgrep`/`gitleaks`/`osv-scanner`, `lighthouse`, `size-limit`, `axe`, `dependency-cruiser`), never an invented checker. Wire each into "Checked by" rows; test-run every command once before claiming it works.

## Diff watch (the standing rule)

A constraints file is only as strong as the diff discipline behind it. On any change under review (this feeds `code-review`'s constraints axis):

- a new suppression comment (`@ts-ignore`, `eslint-disable`, `# noqa`) not covered by an Exceptions row is a finding
- a skipped or deleted test without its reason in the commit message is a finding
- a threshold edit downward without a dated Exceptions row is a finding
- a check removed from the "Enforced" table is a finding

## Floor (for non-interactive contexts)

When no live user can be interviewed: the Floor section above IS the constraints, plus any existing Enforced rows. Note that the interview was skipped, and flag dimensions you could not wire for a human.
