#!/usr/bin/env bash
# check.sh — one command, identical locally and in CI (correct's same-command
# rule: "Run the same command locally and in CI"). This is the canonical
# acceptance entry named in docs/CONSTRAINTS.md's enforcement table.
#
#   bash scripts/check.sh
#
# 1. skill-tree integrity  (frontmatter / cross-refs / pointers)
# 2. gates regression      (budget semantics, 23 assertions)
# 3. prose lint            (slop on added lines; CI-aware base resolution
#                           lives in check-prose.py)
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

python3 scripts/check-skills.py
bash scripts/test-gates.sh
python3 scripts/check-prose.py
