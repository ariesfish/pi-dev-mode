---
type: llm
---

PASS if the reply treats the request as direction-scouting: it names the
destination question(s), sets out a small map of decisions to resolve first
(numbered decision tickets or an equivalent structure), and explicitly holds
off building — no implementation, no deliverable code, no PRD-style feature
list written as if the destination were already chosen.

FAIL if it starts implementing, drafts a feature spec/PRD as settled work,
or treats the fuzziness as a nuisance to steamroll ("let's just build X")
without surfacing the decisions that must be locked first.
