---
name: repo-map
description: >-
  Create a concise repository navigation map in docs/REPO.md for fast onboarding and
  future agent work. Use for first-time repo orientation, durable repo maps,
  identifying where to start for common changes, important boundaries, entry
  points, verification commands, and paths to ignore. Do not use for narrow
  task-scoped code exploration; use code-map instead. Chinese triggers:
  分析仓库, 梳理仓库, 生成 REPO.md, 生成 docs/REPO.md, 仓库导航, 项目地图, 快速了解项目, 新仓库上手.
---

# Repo Map

<!-- pi-dev-mode changelog:
- migrated from ~/.agents/skills/dev-repo-map
- 2026-10-15 synced to mattp@49dd158 (d80fa0f): GLOSSARY.md naming adopted (legacy CONTEXT.md noted).
-->

Create or update `docs/REPO.md` (legacy root `REPO.md` reads as found; moving is the owner's call) as a **navigation map**, not a repository encyclopedia.

The goal is to help a human or future agent enter the repo quickly: what this repo is, how to run the main loop, where to start for common changes, which boundaries matter, and what to ignore.

Use `repo-map` when the user wants repo-wide onboarding or a durable map. Use `code-map` instead when the user is working on one feature, bug, module, or code area.

## Principles

- **Navigation over coverage.** Prefer “start here” guidance over exhaustive directory descriptions.
- **Decision density over detail.** Include facts that change what the next agent reads, runs, edits, or avoids.
- **Concrete over generic.** Name real files, commands, modules, entry points, and conventions from the repo.
- **Short by default.** A useful `docs/REPO.md` should be skimmable. Omit low-signal inventories.
- **State uncertainty.** Distinguish confirmed facts from inference. Do not invent architecture.

## Workflow

### 1. Inspect the repo surface

Read only enough to map the main shape:

- Root README and existing docs.
- Manifests and tool configs: `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`, lockfiles, task runners, CI configs.
- Top-level directories.
- Main source, test, script, docs, and infra paths.
- Existing `AGENTS.md`, `CLAUDE.md`, `GLOSSARY.md`, `GLOSSARY-MAP.md` (legacy: `CONTEXT.md`), and `docs/adr/` when present.

Ignore generated, vendored, build, cache, and dependency directories unless the repo treats one as source.

### 2. Find the main loops

Identify the commands and paths that let an agent work safely:

- Install/setup command.
- Dev/run command.
- Test command.
- Lint/typecheck/build command.
- Any command that verifies the most important behavior.

If commands are missing or uncertain, say so.

### 3. Identify entry points and boundaries

Find the small set of files/directories that explain how the repo works:

- Runtime entry points: app bootstrap, CLI entry, server start, worker/job entry, package exports.
- Important boundaries: UI, API, domain/core, data access, external integrations, shared packages, infra.
- Test locations and test style.
- Config files that materially affect development.

Aim for 5–8 boundaries. Do not describe every directory.

### 4. Build the “Where to start” table

This is the highest-value section. Map common work to starting points.

Examples:

```md
| Task | Start here | Then inspect |
|---|---|---|
| Add API route | `src/routes/...` | `src/services/...`, tests in `...` |
| Change UI | `app/...` | `components/...`, story/demo files |
| Fix auth | `src/auth/...` | middleware, session storage, auth tests |
```

Use tasks that fit the actual repo. Avoid generic rows that could apply anywhere.

### 5. Trace only essential flows

Include at most 2–3 core flows. Each should be 5–8 steps and grounded in files you inspected.

Good flows:

- User request path.
- CLI command execution.
- Background job processing.
- Build/render pipeline.
- Data import/export path.

Do not trace every feature.

### 6. Write or update `docs/REPO.md`

Use this structure unless the repo needs a small adjustment:

```md
# Repo Map

## What this repo is

## Main development loop

## Where to start

## Architecture map

## Main flows

## Conventions that matter

## Do not waste time on

## Open questions
```

Section rules:

- **What this repo is** — 3–5 sentences.
- **Main development loop** — commands and verification notes only.
- **Where to start** — task-to-path table.
- **Architecture map** — 5–8 meaningful boundaries with responsibilities.
- **Main flows** — only the most useful 2–3 flows.
- **Conventions that matter** — routing, testing, data access, errors, naming, packaging, or agent instructions that affect edits.
- **Do not waste time on** — generated files, legacy areas, examples, build output, vendored assets, or low-signal paths.
- **Open questions** — real uncertainties that affect future work.

## Diagrams

Mermaid diagrams are optional. Add one only when it reduces explanation.

If a diagram helps, keep it small and use real component names. Do not add diagrams as a checkbox.

## Anti-patterns

Avoid:

- Exhaustive directory trees.
- Dependency inventories that do not change development decisions.
- Explaining every config file.
- Mermaid diagrams that restate prose.
- Copying README content without adding navigation value.
- Treating `docs/REPO.md` as a full architecture spec.
- Writing implementation plans for unrelated future work.

## Final check

Before finishing, ensure `docs/REPO.md` answers:

1. What is this repo?
2. How do I run and verify it?
3. Where do I start for common changes?
4. What are the important boundaries?
5. What should I ignore?
6. What is still uncertain?
