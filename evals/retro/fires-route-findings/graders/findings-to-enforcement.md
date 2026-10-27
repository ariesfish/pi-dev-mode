---
type: llm
---

PASS if the reply names concrete improvement candidates from what happened and
routes each to the strongest enforcement level the repo has (architecture, then
types/lint, then tests, then docs), with a specific change per candidate.

FAIL if the retro ends in general advice ("communicate more", "be careful"), in
blame, or in documentation-only fixes for a problem a check could catch.
