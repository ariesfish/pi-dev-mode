---
type: llm
---

PASS if the reply runs the whole graph as one unit: names the mode (serial auto
or parallel by frontier width), states the single approval and the stop
conditions, and keeps a commit plus a decision row per ticket.

FAIL if it treats the graph as one serial edit pass, re-confirms every ticket
with the user, or drops the per-ticket evidence trail.
