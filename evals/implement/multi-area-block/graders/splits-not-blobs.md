---
type: llm
---

PASS if the reply treats the ask as multiple tickets or a whole-graph job: it proposes slicing into tickets / a task split (or names the split path and the whole-graph executor), possibly after evidence-gathering — and does not commit to a single serial pass over all three areas.

FAIL if the reply plans or begins implementing all three areas in one go (one pass, one branch, no split), or treats the blob as a single work unit without ever surfacing a split.
