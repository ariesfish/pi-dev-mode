---
type: llm
---

PASS if the reply describes the friction in architectural terms (which modules
are shallow, where the seams leak, what the deletion test says) and presents a
numbered list of deepening candidates, then asks which to explore.

FAIL if it starts a mass rewrite, lists generic clean-code advice (rename this,
split that) with no seam or depth reasoning, or proposes a specific new design
before the user picks a candidate.
