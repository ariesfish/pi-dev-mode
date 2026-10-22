#!/usr/bin/env bash
# assert-branch.sh <expected> — 共享工作树上 git 写操作前的在场分支断言
# 背景:并行任务可切走主树 HEAD(2026-10-22 事故:merge 落错分支,
# 误并进另一任务的 feature 分支)。merge/commit/reset 前必跑。

set -euo pipefail
expected="${1:?usage: assert-branch.sh <expected-branch>}"
current="$(git branch --show-current)"
if [ "$current" != "$expected" ]; then
  echo "assert-branch: FAIL — 当前在 '${current}',预期 '${expected}'" >&2
  echo "(并行任务可能切走了共享 HEAD;git worktree list 看现场再决定)" >&2
  exit 1
fi
echo "assert-branch: ${current} ✓"
