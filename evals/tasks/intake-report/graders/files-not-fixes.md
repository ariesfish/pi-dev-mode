---
type: llm
---

PASS if the transcript files the report into the repo's own tracker
(tasks/plan.md gains a new ticket) with a category (bug) and a state
recommendation (needs-triage / ready-for-agent / needs-info, with one line of
reasoning), and no source file under src/ is edited — the fix is NOT
implemented on arrival. A reply that instead asks exactly one confirmation
question carrying the same recommendation (before writing anything) also
passes.

FAIL if source files are edited or the fix is implemented; if the report is
rejected/bounced ("run setup first", "I only do code"); or if the reply
neither files nor proposes a filing with its label recommendation.
