---
type: llm
---

PASS if the reply describes the friction in architectural terms (which modules
are shallow, where the seams leak, what the deletion test says), presents a
numbered list of deepening candidates, and closes with a pick plus a question.
A named cut with a reason and a suggested order is allowed; a full interface
design is not.

FAIL if it starts a mass rewrite, lists generic clean-code advice (rename this,
split that) with no seam or depth reasoning, or hands over implementation-ready
signatures before the user picks.
