#!/usr/bin/env bash
# run-eval.sh — one eval case, run the way evals/README.md specifies.
#
#   bash scripts/run-eval.sh <case-dir> [--routing] [--out DIR]
#
# Isolation (the 2026-10-22 lesson): the skills tree is copied to a neutral
# temp path per case — a path name that hints at the topic becomes a content
# hint (3/3 vs 2/4 on the same case). The candidate runs with `--no-extensions`
# for a plain trigger case, or `-e pi/index.ts` for a routing case (the
# mandate is part of the product). Fixtures are copied into the candidate's cwd;
# dialogue cases only get `read`.
#
# Output: WORK=<dir> SESSION=<dir> REPLY=<file> KIND=<kind> CHEAT=<yes|no>
# Transcript lives under SESSION; graders are never copied into the workspace.
set -uo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

die() { echo "run-eval: $*" >&2; exit 2; }

CASE=${1:-}
[ -n "$CASE" ] && [ -d "$CASE" ] || die "usage: run-eval.sh <case-dir> [--routing] [--out DIR]"
shift
ROUTING=0
OUT=""
while [ $# -gt 0 ]; do
  case "$1" in
    --routing) ROUTING=1; shift ;;
    --out) OUT=${2:-}; [ -n "$OUT" ] || die "--out needs a directory"; shift 2 ;;
    *) die "unknown option $1" ;;
  esac
done

PROMPT="$CASE/prompt.md"
[ -f "$PROMPT" ] || die "no prompt.md in $CASE"
KIND=$(awk -F': *' '/^kind:/{print $2; exit}' "$PROMPT")
FIXTURE=$(awk -F': *' '/^fixture:/{print $2; exit}' "$PROMPT")
[ "$KIND" = dialogue ] || [ "$KIND" = execution ] || die "kind must be dialogue or execution"

BODY=$(python3 - "$PROMPT" <<'PY'
import pathlib, sys
text = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
parts = text.split("---", 2)
print(parts[2].strip() if len(parts) == 3 else "")
PY
)
[ -n "$BODY" ] || die "prompt body is empty"

WORK=$(mktemp -d "${TMPDIR:-/tmp}/eval-house.XXXXXX")
SKILLS="$WORK/house/skills"
mkdir -p "$WORK/house" "$WORK/repo"
# Neutral copy: the directory name must not hint at the case.
cp -R "$ROOT/skills" "$SKILLS"
if [ -n "$FIXTURE" ]; then
  [ -d "$ROOT/evals/fixtures/$FIXTURE" ] || die "fixture not found: evals/fixtures/$FIXTURE"
  cp -R "$ROOT/evals/fixtures/$FIXTURE/." "$WORK/repo/"
fi

SESSION="$WORK/session"
REPLY="$WORK/reply.txt"
ARGS=(--no-extensions --no-skills)
TOOLS=(--tools read)
if [ "$KIND" = execution ]; then
  TOOLS=()
  ARGS+=(-e "$ROOT/pi/index.ts")
elif [ "$ROUTING" -eq 1 ]; then
  ARGS+=(-e "$ROOT/pi/index.ts")
fi
TIMEOUT=700
[ "$KIND" = execution ] && TIMEOUT=1500

set +e
( cd "$WORK/repo" && timeout "$TIMEOUT" pi -p --session-dir "$SESSION" "${ARGS[@]}" "${TOOLS[@]}" \
    --skill "$SKILLS" "$BODY" >"$REPLY" 2>"$WORK/stderr.txt" )
STATUS=$?
set -e

CHEAT=no
if [ -d "$SESSION" ] && grep -rqE "pi-dev-mode/evals/|evals/fixtures/" "$SESSION" 2>/dev/null; then
  CHEAT=yes
fi
if [ -n "$OUT" ]; then
  mkdir -p "$OUT"
  cp -R "$SESSION" "$REPLY" "$OUT/" 2>/dev/null || true
  WORK=$OUT
fi
echo "WORK=$WORK"
echo "SESSION=$SESSION"
echo "REPLY=$REPLY"
echo "KIND=$KIND"
echo "STATUS=$STATUS"
echo "CHEAT=$CHEAT"
