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
# 7. numbers sync           (counts claimed in docs/CONSTRAINTS.md vs the
#                           suites this run — suite outputs tee into a scratch
#                           dir; claims cross-check even where a suite skipped)
# 8. pi typecheck + evidence + replay (undefined-name 类闸(TS2304/TS2552 =
#                           imports 缺口、运行时炸弹) + tsv 证据指针可达/非空
#                           (check-evidence.py 无 .dev 时 no-op,exit 0) +
#                           重放函数(restore/reattach/replay*)必须有测试引用
#                           (check-replay.py,T-042))
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

logs="$(mktemp -d)"
trap 'rm -rf "$logs"' EXIT

python3 scripts/check-skills.py
bash scripts/test-gates.sh 2>&1 | tee "$logs/gates.log"
python3 scripts/check-prose.py
python3 scripts/check-adrs.py --selftest
# The harness launches a real Chrome and reads CHROME_BIN (its documented
# override). Resolve one here so the same command works on macOS and Linux; no
# browser means a visible SKIP, never a silent pass.
resolve_chrome() {
  if [ -n "${CHROME_BIN:-}" ]; then
    if [ -x "$CHROME_BIN" ] || command -v "$CHROME_BIN" >/dev/null 2>&1; then
      printf '%s' "$CHROME_BIN"; return 0
    fi
    echo "check.sh: CHROME_BIN=$CHROME_BIN is not executable" >&2
    return 1
  fi
  for candidate in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
    "$HOME/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; do
    [ -x "$candidate" ] && { printf '%s' "$candidate"; return 0; }
  done
  for candidate in google-chrome-stable google-chrome chromium chromium-browser; do
    command -v "$candidate" >/dev/null 2>&1 && { command -v "$candidate"; return 0; }
  done
  return 1
}
if chrome_bin="$(resolve_chrome)"; then
  CHROME_BIN="$chrome_bin" node --test "adapters/control-web/tests/*.test.mjs" 2>&1 | tee "$logs/adapters.log"
else
  echo "adapters: SKIP (no Chrome/Chromium found — set CHROME_BIN; see adapters/control-web/README.md, docs/CONSTRAINTS.md)"
fi
# bun resolves project-first: devDependencies' bun (from the package-root
# `npm install`) shadows any system bun; test-extensions.sh calls bare `bun`,
# so PATH has to carry it in.
if [ -x node_modules/.bin/bun ]; then
  PATH="$PWD/node_modules/.bin:$PATH"
fi
if command -v pi >/dev/null 2>&1 && command -v bun >/dev/null 2>&1; then
  bash scripts/test-extensions.sh 2>&1 | tee "$logs/pi.log"
else
  echo "test-extensions: SKIP (no local pi runtime + bun (node_modules/.bin or PATH) — evidence tier, docs/CONSTRAINTS.md)"
fi

numbers_args=(--gates-log "$logs/gates.log")
if [ -f "$logs/adapters.log" ]; then
  numbers_args+=(--adapters-log "$logs/adapters.log")
fi
if [ -f "$logs/pi.log" ]; then
  numbers_args+=(--pi-log "$logs/pi.log")
fi
python3 scripts/check-numbers.py "${numbers_args[@]}"

# 8. pi typecheck + tsv 证据闸(check-types.sh 对 tsc 缺场可见 SKIP;
# check-evidence.py 在无 .dev 的环境 no-op 退出 0)
bash scripts/check-types.sh
python3 scripts/check-evidence.py
python3 scripts/check-replay.py
