---
description: >-
  An incoming user bug report must be filed into the repo's own tracker
  through the intake triage state machine (category + state recommendation,
  agent brief or one-question-with-recommendation) — never fixed on arrival,
  never bounced to setup. Execution-kind: the candidate has full tools and is
  expected to actually file the ticket in the fixture copy.
kind: execution
fixture: intake-w6
target: triage-issue:fires,implement:stays-quiet
expected_outcome: The report lands in tasks/plan.md as a new ticket carrying a category and state recommendation (bug + needs-triage/ready-for-agent with reasoning), or the reply surfaces exactly one confirmation question with the recommendation attached; no source files are edited and no fix is implemented.
---

刚收到一个用户报障:设置页里切完主题、点了保存,再进设置页主题又变回默认了,刷新也一样。帮我按这个仓库自己的流程把它归置一下。
