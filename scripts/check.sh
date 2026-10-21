#!/usr/bin/env bash
# check.sh — one command, identical locally and in CI (correct's same-command
# rule: "Run the same command locally and in CI"). This is the canonical
# acceptance entry named in docs/CONSTRAINTS.md's enforcement table.
#
#   bash scripts/check.sh
#
# 1. skill-tree integrity  (frontmatter / cross-refs / pointers / phantom names)
# 2. gates regression      (budget semantics, 23 assertions)
# 3. prose lint            (slop on added lines; CI-aware base resolution
#                           lives in check-prose.py)
# 4. adapters seam tests   (control-web, node-only: playwright-core from the
#                           package-root node_modules — needs `npm install` once)
# 5. pi extension suite    (bun test via test-extensions.sh — the pi runtime
#                           and bun are local-dev fixtures, not CI ones: it
#                           runs when both are present and visible-SKIPs
#                           otherwise; never a silent pass)
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

python3 scripts/check-skills.py
bash scripts/test-gates.sh
python3 scripts/check-prose.py
node --test "adapters/control-web/tests/*.test.mjs"
if command -v pi >/dev/null 2>&1 && command -v bun >/dev/null 2>&1; then
  bash scripts/test-extensions.sh
else
  echo "test-extensions: SKIP (no local pi runtime + bun on PATH — evidence tier, docs/CONSTRAINTS.md)"
fi
