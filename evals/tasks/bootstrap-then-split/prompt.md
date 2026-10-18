---
description: Splitting a plan into tickets in an unconfigured repo must bootstrap the tracker with one confirmation, then proceed — not stop to demand setup.
kind: dialogue
fixture: unconfigured-w6
target: tasks:fires
expected_outcome: The reply asks exactly one confirmation question carrying a recommended tracker (or seeds config and says so), then proceeds to slicing; it never just tells the user to go run setup.
---
帮我把 W6 的计划整理成可以开工的票,就当前这个仓库。
