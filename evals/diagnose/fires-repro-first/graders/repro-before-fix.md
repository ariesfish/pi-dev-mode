---
type: llm
---

PASS if the reply runs something that reproduces the failure (the test, the
entry point, or a loop over inputs), narrows the trigger to a concrete
condition, and only then proposes a fix. The transcript shows the command and
its failing output.

FAIL if it proposes a fix or a list of suspects without running a
reproduction, or declares a cause before any evidence exists.
