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
# 4. ADR checker selftest  (installable scripts/check-adrs.py — each check
#                           proved to fail on its specimen; this repo carries
#                           no docs/adr/, so the selftest is the integrity run)
# 5. adapters seam tests   (control-web, node-only: playwright-core from the
#                           package-root node_modules — needs `npm install` once)
# 6. pi extension suite    (bun test via test-extensions.sh — the pi runtime
#                           is a local-dev fixture, not a CI one: it runs when
#                           present and visible-SKIPs otherwise; never a silent
#                           pass. bun is devDependencies-managed: devDependencies'
#                           node_modules/.bin shadows any system bun)
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

python3 scripts/check-skills.py
bash scripts/test-gates.sh
python3 scripts/check-prose.py
python3 scripts/check-adrs.py --selftest
node --test "adapters/control-web/tests/*.test.mjs"
# bun resolves project-first: devDependencies' bun (from the package-root
# `npm install`) shadows any system bun; test-extensions.sh calls bare `bun`,
# so PATH has to carry it in.
if [ -x node_modules/.bin/bun ]; then
  PATH="$PWD/node_modules/.bin:$PATH"
fi
if command -v pi >/dev/null 2>&1 && command -v bun >/dev/null 2>&1; then
  bash scripts/test-extensions.sh
else
  echo "test-extensions: SKIP (no local pi runtime + bun (node_modules/.bin or PATH) — evidence tier, docs/CONSTRAINTS.md)"
fi
