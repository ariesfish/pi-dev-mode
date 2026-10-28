---
description: >-
  An unclear bug must start with a reproducible feedback loop, not a guessed
  fix; the repro lands before the change.
kind: execution
fixture: flaky-login
target: diagnose:fires
expected_outcome: >-
  The reply builds a reproduction/feedback loop first (a command that shows
  the failure, the failing input set, instrumentation), pins the trigger to a
  specific condition, and proposes a fix only after the failure reproduces.
---
登录偶发 500,日志里只有一行 timeout,抓不到现场。帮我看看是哪里的问题。
