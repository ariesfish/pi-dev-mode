#!/usr/bin/env bash
# test-gates.sh — regression lever for gates/gate.sh budget semantics (T-001).
#
# Scratch-repo scenario, asserts exit codes and BLOCKED behavior:
#   open --budget 2 -> D-run FAIL x2 trips budget (exit 4) -> run/verdict/close
#   refused (exit 4) -> resume (note required) -> FAIL-verdict budget on the
#   A-class gate -> PASS verdict clears -> idempotent re-open -> replay CLEAN
#   -> mine reports blocked items.
# Keep it self-contained (mktemp scratch, plain bash); run from anywhere:
#   bash scripts/test-gates.sh   (exit 0 = green)
GATE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/gates/gate.sh"
fails=0

t() { # t <desc> <want-exit> <cmd...>
  local desc="$1" want="$2" got out
  shift 2
  out="$("$@" 2>&1)"; got=$?
  if [ "$got" != "$want" ]; then
    echo "FAIL: $desc (want exit $want, got $got)"
    echo "$out" | sed 's/^/    | /'
    fails=$((fails + 1))
  else
    echo "ok: $desc"
  fi
}

S="$(mktemp -d)"
trap 'rm -rf "$S"' EXIT
cd "$S" || exit 1
mkdir -p repo && cd repo || exit 1

# --- refusal before any ledger exists -------------------------------------
t "show without ledger refused (exit 2)" 2 "$GATE" show T-9
t "run without ledger refused (exit 2)" 2 "$GATE" run T-9 g -- false
t "mine without ledger refused (exit 2)" 2 "$GATE" mine

# --- open, budget 2 --------------------------------------------------------
t "open --budget 2 exits 0" 0 "$GATE" open T-9 "scenario item" --budget 2
t "open --budget without a value refused (exit 2)" 2 "$GATE" open T-7 "no budget" --budget

# --- option values are required where documented ----------------------------
t "run -d without a value refused (exit 2)" 2 "$GATE" run T-9 g -d
t "run --note without a value refused (exit 2)" 2 "$GATE" run T-9 g --note

# --- D-class budget: two consecutive FAILs trip item-level BLOCKED ----------
t "D-run #1 FAIL (exit 1)" 1 "$GATE" run T-9 g -- false
t "D-run #2 trips budget -> exit 4" 4 "$GATE" run T-9 g -- false
t "run while blocked refused (exit 4)" 4 "$GATE" run T-9 g -- true
t "close while blocked refused (exit 4)" 4 "$GATE" close T-9 --note nope

# --- resume gate: human note mandatory --------------------------------------
t "resume without note refused (exit 2)" 2 "$GATE" resume T-9
t "resume with note exits 0" 0 "$GATE" resume T-9 --note "human looked, budget reset"
t "after resume a passing run is allowed" 0 "$GATE" run T-9 g -- true

# --- PASS resets the consecutive counter -------------------------------------
t "fail #1 of a new cycle (exit 1)" 1 "$GATE" run T-9 g2 -- false
t "fail #2 of the new cycle trips again (exit 4)" 4 "$GATE" run T-9 g2 -- false
"$GATE" resume T-9 --note "reset for verdict phase" >/dev/null 2>&1

# --- A-class budget: two FAIL verdicts trip the same way --------------------
printf '{"verdict":"FAIL"}' > "$S/v-fail.json"
printf '{"verdict":"PASS"}' > "$S/v-pass.json"
t "verdict FAIL exits 1" 1 "$GATE" verdict T-9 --from "$S/v-fail.json"
t "second FAIL verdict trips budget -> exit 4" 4 "$GATE" verdict T-9 --from "$S/v-fail.json"
t "verdict while blocked refused (exit 4)" 4 "$GATE" verdict T-9 --from "$S/v-pass.json"
"$GATE" resume T-9 --note "reset after FAIL verdicts" >/dev/null 2>&1
t "verdict PASS exits 0" 0 "$GATE" verdict T-9 --from "$S/v-pass.json"
t "verdict --note with a value exits 0" 0 "$GATE" verdict T-9 --from "$S/v-pass.json" --note "reviewed by hand"
if "$GATE" show T-9 2>&1 | grep -q '"note": "reviewed by hand"'; then
  echo "ok: verdict --note landed in history"
else
  echo "FAIL: verdict --note was dropped"
  fails=$((fails + 1))
fi
t "unknown option refused (exit 2)" 2 "$GATE" resume T-9 --bogus

# --- open idempotence (skills promise reuse-if-open) -------------------------
t "re-open the same id reuses (exit 0)" 0 "$GATE" open T-9 "duplicate open"

# --- replay is read-only and re-executes recorded history ---------------------
t "replay re-runs recorded cmds, CLEAN (exit 0)" 0 "$GATE" replay T-9

# --- mine reports blocked items; blocked state is per-item -------------------
t "open a second item T-8 exits 0" 0 "$GATE" open T-8 "blocked probe" --budget 2
"$GATE" run T-8 g -- false >/dev/null 2>&1
"$GATE" run T-8 g -- false >/dev/null 2>&1  # T-8 blocked here
if "$GATE" mine 2>&1 | grep -q "blocked-items=1"; then
  echo "ok: mine reports blocked-items=1"
else
  echo "FAIL: mine does not report blocked-items=1"
  fails=$((fails + 1))
fi
t "T-9 unaffected by T-8's blocked state" 0 "$GATE" run T-9 g -- true
if "$GATE" show T-8 2>&1 | grep -q '"blocked"'; then
  echo "ok: state.json carries blocked field while blocked"
else
  echo "FAIL: state.json shows no blocked field"
  fails=$((fails + 1))
fi

echo "----"
if [ "$fails" -gt 0 ]; then
  echo "test-gates.sh: $fails assertion(s) failed"
  exit 1
fi
echo "test-gates.sh: all green"
