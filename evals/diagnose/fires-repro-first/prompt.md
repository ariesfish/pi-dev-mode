---
description: >-
  An unclear bug must start with a reproducible feedback loop, not a guessed
  fix; the repro lands before the change.
kind: dialogue
target: diagnose:fires
expected_outcome: >-
  The reply builds a reproduction/feedback loop first (command, minimal case,
  instrumentation), and proposes a fix only after the failure is pinned.
---
登录偶发 500,日志里只有一行 timeout,抓不到现场。帮我看看是哪里的问题。
