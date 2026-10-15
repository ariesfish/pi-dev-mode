---
name: setup
description: >-
  Set up per-repository agent configuration for developer workflow skills. Use
  before first use of issues, prd, triage-issue,
  diagnose, tdd, refact, repo-map, or code-map in a repo,
  or when those skills lack context about the issue tracker, triage labels, or
  domain documentation layout. Creates or updates an Agent skills block in
  AGENTS.md or CLAUDE.md and writes docs/agents/issue-tracker.md,
  docs/agents/triage-labels.md, and docs/agents/domain.md. Chinese triggers:
  初始化 dev skills, 配置 agent, 配置 issue tracker, 配置 triage labels,
  配置领域文档, 初始化仓库工作流, 设置开发工作流.
---

# Dev Setup

<!-- ariesfish changelog:
- migrated from ~/.agents/skills/dev-setup (mattp setup-matt-pocock-skills derived)
- 2026-10-15 synced to mattp@49dd158: GLOSSARY.md naming (#d80fa0f, legacy CONTEXT.md
  declared in domain docs); create missing triage labels when the tracker is GitHub
  (5b7cade); "Label in our tracker" column naming (#801).
-->

Configure a repository so developer workflow skills can reliably find its issue tracker, triage label vocabulary, and domain documentation.

Use [references/workflow.md](references/workflow.md) as the canonical map for how the skills in this pack form a closed loop.

This skill is prompt-driven. Inspect the repo, present findings, ask only for decisions that are not already clear, then write the configuration.

## User decisions

When this skill needs user input or confirmation, use the `ask-user` skill and the `ask_user` tool. Gather repository evidence first, summarize the relevant findings, then ask exactly one focused question per decision.

Use `ask_user` for:

- Choosing which agent instruction file to create when neither `CLAUDE.md` nor `AGENTS.md` exists.
- Choosing the issue tracker when repository evidence does not clearly select GitHub or Local Markdown, or when the user may prefer a different tracker.
- Mapping triage labels when existing labels differ from the canonical defaults.
- Confirming single-context vs multi-context domain docs when repository evidence is ambiguous.
- Approving or editing the final draft before writing files.

Do not ask when the repository evidence is conclusive and the default is reversible. State the assumption and proceed, except for final draft approval.

## Workflow

### 1. Inspect the repository

Check the current repo before proposing changes:

- `git remote -v` and `.git/config` for the issue tracker host.
- Root `CLAUDE.md` and `AGENTS.md` for existing agent instructions.
- Existing `## Agent skills` sections.
- Root `GLOSSARY.md` and `GLOSSARY-MAP.md` (legacy: `CONTEXT.md`/`CONTEXT-MAP.md` from before the rename).
- `docs/adr/` and `src/*/docs/adr/`.
- Existing `docs/agents/` files.
- `.scratch/` for local Markdown issue tracking.

### 2. Choose the editable agent instruction file

Use this order:

1. If root `CLAUDE.md` exists, edit it.
2. Else if root `AGENTS.md` exists, edit it.
3. Else use `ask_user` to ask which file to create.

Do not create `AGENTS.md` when `CLAUDE.md` already exists, or vice versa. Update an existing `## Agent skills` section in place; do not append duplicates.

### 3. Decide the issue tracker

Explain that engineering skills publish, read, label, and close work items through this tracker.

Default to:

- **GitHub** when a remote points at GitHub. Use `references/issue-tracker-github.md` as the seed.
- **Local Markdown** when the repo already uses `.scratch/`, has no remote issue tracker, or the user prefers local files. Use `references/issue-tracker-local.md` as the seed.
- **Other** for Jira, Linear, custom trackers, or unknown workflows. Use `ask_user` to ask for the workflow and write `docs/agents/issue-tracker.md` from scratch.

Do not offer or generate GitLab setup in this skill.

When the tracker is GitHub, also create each configured label the tracker lacks (`gh label create <name> --description <meaning>`), so the vocabulary exists before the first triage. Report what you created.

### 4. Decide triage labels

Explain that triage-aware skills use five canonical roles and need the actual label/status strings for this repo:

- `needs-triage` — maintainer needs to evaluate.
- `needs-info` — waiting on reporter.
- `ready-for-agent` — fully specified and agent-ready.
- `ready-for-human` — needs human implementation.
- `wontfix` — will not be actioned.

Use `references/triage-labels.md` as the seed. Default to the canonical strings unless existing repo labels or the user specify different strings.

### 5. Decide domain docs layout

Explain that architecture, diagnosis, and TDD skills read domain context and ADRs before making changes.

Use `references/domain.md` as the seed. Default to:

- **Single-context** when the repo has root `GLOSSARY.md`, or has `CONTEXT.md` from before the rename and no `GLOSSARY-MAP.md`.
- **Multi-context** when root `GLOSSARY-MAP.md` (or legacy `CONTEXT-MAP.md`) exists and points to per-context `GLOSSARY.md` files.

The seed names `GLOSSARY.md`/`GLOSSARY-MAP.md` as the convention. When the repo already uses `CONTEXT.md`/`CONTEXT-MAP.md`, record that layout in `docs/agents/domain.md` instead: it is the same convention under the old names, and renaming is the repo owner's call, not this skill's.

### 6. Confirm the draft

Before writing, show the user:

- The `## Agent skills` block to add or update.
- The planned contents or summaries of:
  - `docs/agents/issue-tracker.md`
  - `docs/agents/triage-labels.md`
  - `docs/agents/domain.md`

Use `ask_user` to collect explicit approval or requested edits before writing.

### 7. Write files

Write or update this block in the selected instruction file:

```markdown
## Agent skills

### Issue tracker

[one-line summary of where issues are tracked]. See `docs/agents/issue-tracker.md`.

### Triage labels

[one-line summary of the label vocabulary]. See `docs/agents/triage-labels.md`.

### Domain docs

[one-line summary of the layout: single-context or multi-context]. See `docs/agents/domain.md`.
```

Then create or update:

- `docs/agents/issue-tracker.md`
- `docs/agents/triage-labels.md`
- `docs/agents/domain.md`

Use the files under `references/` as templates. For an unsupported tracker, write explicit prose matching the user's workflow instead of forcing a template.

### 8. Report completion

Report the changed files and mention that later edits can be made directly in `docs/agents/*.md`. Re-run this setup only when switching issue trackers, changing label vocabulary, or changing domain-doc layout.
