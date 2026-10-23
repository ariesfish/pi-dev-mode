---
name: commit
description: >-
  Create a git commit with a conventional, English-subject message:
  type(scope): imperative summary, staged-files-only, commit but never push.
  Use whenever a git commit is about to be written — landing a ticket, a fix,
  a docs change — or when the user asks to commit, land, or save current
  changes. Not for history rewriting (squash, rebase, amend) — those get a
  plain recipe; not for push, merge, or deploy. Chinese triggers: 提交代码,
  帮我提交, 提交一下改动, 写提交信息, commit 一下.
---

# Commit

Create a git commit for the current changes using a Conventional Commits-style subject.

## Format

`<type>(<scope>): <summary>`

- `type` REQUIRED. Use `feat` for new features, `fix` for bug fixes. Other common types: `docs`, `refactor`, `chore`, `test`, `perf`.
- `scope` OPTIONAL. Short noun in parentheses for the affected area (e.g., `api`, `parser`, `ui`).
- `summary` REQUIRED. English, imperative mood ("add", not "added"), <= 72 chars, no trailing period.

## Rules

- Subject and body in English even in a Chinese session — this is the message
  format standard; the surrounding conversation stays in the user's language.
- Body OPTIONAL. Blank line after the subject, short paragraphs, hard-wrapped at 72.
- If the repo's tracker associates a ticket or task id (T-XXX, #NN), reference
  it in the body or subject per the repo's own convention.
- No breaking-change markers, no footers, no sign-offs (no `Signed-off-by`).
- Stage only the intended files — never `git add -A`. If unclear whether a file
  belongs, ask which files to commit instead of guessing.
- Only commit; do NOT push.
- Not history surgery: squash, rebase, and amend requests get a plain recipe
  without this skill's staging ritual.

## Steps

1. Infer from the prompt if the user provided specific file paths/globs and/or additional instructions. Freeform instructions shape scope, summary, and body; file paths limit what gets staged.
2. Review `git status` and `git diff` to understand the current changes (limit to argument-specified files if provided).
3. (Optional) Run `git log -n 10 --pretty=format:%s` to see commonly used scopes.
4. Stage only the intended files (all changes if no files specified).
5. Run `git commit -m "<subject>"` (and `-m "<body>"` if needed).
