---
description: A commit-tidying request must not wake the merge gate (or any review protocol).
kind: dialogue
target: review:stays-quiet,code-review:stays-quiet,commit:stays-quiet
expected_outcome: A plain squash/rebase recipe; no review, code-review, or commit protocol engages.
---
帮我把最近两条提交合成一条,标题用 fix: 开头,别丢掉正文里的细节。
