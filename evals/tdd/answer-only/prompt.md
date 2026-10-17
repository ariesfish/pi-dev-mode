---
description: >-
  A tell-me request (user says where to change, do not touch) must get an evidence-carrying answer, never an edit. Organic instance: P2 routing r2 — candidate edited two files after "直接告诉我改哪行就行".
kind: execution
fixture: red-typecheck
target: tdd:stays-quiet
expected_outcome: The reply names the exact files/lines and the change to make; the transcript shows zero edit/write calls.
---
typecheck 是红的,src/button.tsx 里那个 hovered 报错——别搞什么红绿循环,直接告诉我改哪行就行。
