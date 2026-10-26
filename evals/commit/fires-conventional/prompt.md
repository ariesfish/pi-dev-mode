---
description: >-
  A plain "commit this" ask must produce a conventional English subject, stage
  only the files of this change, and never push or rewrite history.
kind: dialogue
target: commit:fires
expected_outcome: >-
  One conventional commit (type(scope): imperative subject), staged files named,
  no push and no squash/rebase.
---
改完了,帮我提交一下。这次只动了设置页的保存逻辑和对应的一个测试文件。
