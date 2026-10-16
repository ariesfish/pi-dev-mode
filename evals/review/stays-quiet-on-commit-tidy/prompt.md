---
description: A commit-tidying request must not wake the merge gate (or any review protocol).
kind: dialogue
target: review:stays-quiet,code-review:stays-quiet
expected_outcome: A plain squash/rebase recipe; no review or code-review protocol engages.
---
帮我把最近两条 commit 合成一条,标题用 fix: 开头,别丢掉正文里的细节。
