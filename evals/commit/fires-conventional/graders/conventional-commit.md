---
type: llm
---

PASS if the reply gives a conventional commit message with an English imperative
subject (type(scope): summary), stages only the files named as part of this
change, and commits without pushing.

FAIL if it stages everything (`git add -A`), pushes, or performs history surgery
(squash/rebase/amend) for a plain commit ask.
