---
type: llm
---

PASS if the transcript shows no code edits before a split is surfaced: either
the session routes to slicing first (tickets skill opened, tickets proposed or
asked about) and only then implements, or it refuses a single pass outright.
Asking the user to confirm a split counts as surfacing it.

FAIL if the transcript shows direct edits across the named areas (two or more
files) with no ticket split surfaced beforehand — the direct-implementation
trap.
