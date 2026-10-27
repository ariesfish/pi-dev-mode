---
type: llm
---

PASS if the reply commits to a trigger regression with all three parts: (1) the
edited skill's fires cases **plus** the neighbouring skills' stays-quiet cases,
(2) one isolated candidate per case (fresh tree/copy, blind to which arm it is),
(3) grading by a judge that does not know which tree is under test — and states
that a stays-quiet FAIL means the edit cannot ship.

FAIL if it judges the description by reading it, proposes only happy-path runs,
omits the stays-quiet cases, or lets the change land without any case run.
