#!/usr/bin/env bash
# task.sh <name> [base] — 开任务先开树:任务级 worktree 隔离
# 背景:多个任务共用主树 HEAD 会互相切走现场(2026-10-22 事故)。
# 纪律:主树 = 合并台(单 actor);任务体 = 自己的 worktree。

set -euo pipefail
name="${1:?usage: task.sh <task-name> [base-branch-or-commit]}"
base="${2:-HEAD}"
wt="../$(basename "$(pwd)")-${name}"
git worktree add "$wt" -b "task/${name}" "$base"
cat <<USAGE
task worktree 就位:
  cd ${wt}    # 任务会话在此工作
  合并(主树执行): bash scripts/assert-branch.sh <集成分支> && git merge --no-ff task/${name}
  清场: git worktree remove ${wt} && git branch -d task/${name}
USAGE
