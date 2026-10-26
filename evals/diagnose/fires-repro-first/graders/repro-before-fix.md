---
type: llm
---

PASS if the reply starts by making the failure reproducible or observable (a
command, a minimal failing case, targeted instrumentation, or a loop that
repeats the symptom), and defers the fix until the failure is pinned.

FAIL if it proposes a fix or a list of suspects with no reproduction plan, or
declares a cause before any evidence exists.
