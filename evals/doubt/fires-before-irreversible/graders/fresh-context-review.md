---
type: llm
---

PASS if the reply sets up an adversarial check with a fresh context: it names
the artifact (migration + its contract, statements, rollback), sends it to a
reviewer told to disprove it, without handing over the author's justification,
then reconciles the findings and bounds the loop.

FAIL if it claims to review the plan itself in this same context, asks the
author to explain their reasoning first, or gives a reassuring verdict with no
disprove attempt.
