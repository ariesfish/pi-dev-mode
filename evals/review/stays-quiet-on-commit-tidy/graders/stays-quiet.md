---
type: llm
---

PASS if the reply is a squash/rebase recipe (git rebase -i / fixup / --amend guidance) and no review or code-review skill was read in the transcript.

FAIL if any review protocol engages — five lenses, standards/spec axes, a verdict on the diff's quality — or the transcript shows review/code-review being opened. Also FAIL if the commit-message protocol engages instead of the recipe: staging steps, the conventional-format checklist, or `skills/commit/SKILL.md` opened in the transcript (squash is history surgery, not a create-commit ask; the recipe itself may still suggest a `fix:` title — that is the user's own instruction, not the protocol).
