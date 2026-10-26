#!/usr/bin/env bash
# check-code.sh — the quantitative half of review: numbers with thresholds.
#
# Measures three things a review can cite instead of opinion:
#   complexity  CRAP per function (cyclomatic complexity weighted by coverage)   < 10
#   dupes       structural duplication, Jaccard similarity                      < 0.8
#   mutants     mutation survivors: tests that run but do not assert               0
#
# The rules live in the `codecheck` package (python/src/codecheck/gate); this
# script only builds the runtime and hands over. Snapshots land in
# .dev/metrics, evidence in .dev/audit/evidence.
#
#   bash scripts/check-code.sh setup [--force] [--self-test]   once per machine
#   bash scripts/check-code.sh doctor [--root DIR]             what each language still needs
#   bash scripts/check-code.sh review [options]                the review gate (complexity + dupes)
#   bash scripts/check-code.sh complexity|crap [options]       CRAP only
#   bash scripts/check-code.sh dupes|dry [options]             duplication only
#   bash scripts/check-code.sh mutants|mutate [options]        mutation only (slow)
#   bash scripts/check-code.sh all [options]                   complexity + dupes (+ --mutants)
#   bash scripts/check-code.sh ratchet [options]               full run vs docs/check-code-baseline.json
#
# Gate options: --root DIR, --changed, --since REF, --langs LIST, --require-coverage,
#   --threshold-crap N, --threshold-dupe N, --max-dupes N, --mutants, --reuse-coverage,
#   --evidence, --max-workers N, --coverage-command CMD, --test-command CMD,
#   --update-baseline, --quiet, --verbose
#
# Exit: 0 gate passed, 1 gate failed, 2 usage or environment error.

set -uo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
PKG_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
SELF=check-code.sh

PY_PROJECT=${CODE_CHECK_PYTHON_PROJECT:-$PKG_ROOT/python}
RUNTIME=${CODE_CHECK_RUNTIME:-${XDG_DATA_HOME:-$HOME/.local/share}/check-code}
PY_VERSION=${CODE_CHECK_PYTHON:-3.13}

FORCE=0
SELF_TEST=0

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  C_DIM=$(printf '\033[2m'); C_RED=$(printf '\033[31m'); C_GREEN=$(printf '\033[32m')
  C_YELLOW=$(printf '\033[33m'); C_BOLD=$(printf '\033[1m'); C_OFF=$(printf '\033[0m')
else
  C_DIM=""; C_RED=""; C_GREEN=""; C_YELLOW=""; C_BOLD=""; C_OFF=""
fi

note() { printf '%s\n' "$*"; }
warn() { printf '%swarn%s %s\n' "$C_YELLOW" "$C_OFF" "$*" >&2; }
die() { printf '%serror%s %s\n' "$C_RED" "$C_OFF" "$*" >&2; exit 2; }

usage() { awk 'NR>1 && /^#/ {sub(/^# ?/, ""); print; next} NR>1 {exit}' "${BASH_SOURCE[0]}"; }

runtime_py() { printf '%s/bin/python' "$RUNTIME"; }

need_runtime() {
  [ -x "$(runtime_py)" ] || die "runtime missing at $RUNTIME. Run: bash $SCRIPT_DIR/$SELF setup"
  "$(runtime_py)" -c 'import codecheck' >/dev/null 2>&1 \
    || die "the codecheck package is not installed in $RUNTIME. Run: bash $SCRIPT_DIR/$SELF setup"
}

# ---------------------------------------------------------------- setup

parser_asset() {
  case "$(uname -s):$(uname -m)" in
    Darwin:arm64) printf 'parsers-macos-arm64.tar.zst' ;;
    Darwin:x86_64) printf 'parsers-macos-x86_64.tar.zst' ;;
    Linux:aarch64|Linux:arm64) printf 'parsers-linux-aarch64.tar.zst' ;;
    Linux:x86_64) printf 'parsers-linux-x86_64.tar.zst' ;;
    *) printf '' ;;
  esac
}

seed_parsers() {
  local force=$1 cache version asset url tmp
  cache=$("$(runtime_py)" -c 'import tree_sitter_language_pack as p; print(p.cache_dir())' 2>/dev/null)
  [ -n "$cache" ] || die "tree-sitter-language-pack is not installed in $RUNTIME"
  if [ "$force" -eq 0 ] && [ -n "$(ls "$cache" 2>/dev/null | head -1)" ]; then
    note "  parsers   cached: $(ls "$cache" | wc -l | tr -d ' ') libs -> $cache"
    return 0
  fi
  version=$("$(runtime_py)" -c 'import importlib.metadata as m; print(m.version("tree-sitter-language-pack"))')
  asset=$(parser_asset)
  [ -n "$asset" ] || die "no prebuilt parser bundle for $(uname -s)/$(uname -m)"
  url="https://github.com/xberg-io/tree-sitter-language-pack/releases/download/v$version/$asset"
  tmp=$(mktemp -d)
  note "  parsers   downloading $asset (v$version via curl, which honours the proxy)"
  if ! curl -fsSL -o "$tmp/parsers.tar.zst" "$url"; then
    rm -rf "$tmp"
    die "parser download failed. Fetch $url by hand and extract it into $cache"
  fi
  mkdir -p "$cache"
  if ! zstd -dc "$tmp/parsers.tar.zst" 2>/dev/null | tar -xf - -C "$cache"; then
    rm -rf "$tmp"
    die "parser extract failed (needs zstd: brew install zstd)"
  fi
  rm -rf "$tmp"
  note "  parsers   seeded: $(ls "$cache" | wc -l | tr -d ' ') libs -> $cache"
}

verify_parsers() {
  "$(runtime_py)" - <<'PY'
import sys
from tree_sitter_language_pack import get_parser

wanted = ["clojure", "java", "go", "typescript", "javascript", "rust", "python"]
bad = []
for name in wanted:
    try:
        get_parser(name)
    except Exception as exc:
        bad.append(f"{name}: {exc}")
if bad:
    print("  parsers   FAILED\n           " + "\n           ".join(bad))
    sys.exit(1)
print("  parsers   ready: " + ", ".join(wanted))
PY
}

cmd_setup() {
  while [ $# -gt 0 ]; do
    case "$1" in
      --force) FORCE=1; shift ;;
      --self-test) SELF_TEST=1; shift ;;
      -h|--help) usage; exit 0 ;;
      *) die "setup: unknown option $1" ;;
    esac
  done
  command -v uv >/dev/null 2>&1 || die "uv not found on PATH. Install: https://docs.astral.sh/uv/"
  [ -f "$PY_PROJECT/pyproject.toml" ] || die "python project missing: $PY_PROJECT"

  note "${C_BOLD}check-code setup${C_OFF}  runtime=$RUNTIME  package=$PY_PROJECT"
  if [ -x "$RUNTIME/bin/python" ]; then
    note "  runtime   present: $("$RUNTIME/bin/python" -V 2>&1)"
  else
    note "  runtime   uv venv (python $PY_VERSION)"
    uv venv --python "$PY_VERSION" "$RUNTIME" >/dev/null 2>&1 || die "uv venv failed at $RUNTIME"
  fi

  # Versions before the merge installed three separate packages; one codecheck owns the runtime now.
  VIRTUAL_ENV="$RUNTIME" uv pip uninstall --quiet crapper dryer mutator >/dev/null 2>&1 || true
  note "  install   codecheck (editable)"
  VIRTUAL_ENV="$RUNTIME" uv pip install --quiet -e "$PY_PROJECT" || die "uv pip install failed"

  seed_parsers "$FORCE"
  verify_parsers || die "parser verification failed"

  if [ "$SELF_TEST" -eq 1 ]; then
    note "  self-test the package suite"
    VIRTUAL_ENV="$RUNTIME" uv pip install --quiet pytest || die "pytest install failed"
    ( cd "$PY_PROJECT" && "$(runtime_py)" -m pytest -q 2>&1 | tail -1 | sed 's/^/  self-test /' )
  fi

  note ""
  note "${C_GREEN}setup complete${C_OFF}  next: bash $SELF doctor --root <repo>"
}

# ---------------------------------------------------------------- dispatch

# A bare positional that names a directory is the same as --root DIR.
normalise_args() {
  ARGS=()
  while [ $# -gt 0 ]; do
    case "$1" in
      -h|--help) usage; exit 0 ;;
      --root) ARGS+=("$1" "$2"); shift 2 ;;
      -*) ARGS+=("$1"); shift ;;
      *)
        if [ -d "$1" ]; then ARGS+=(--root "$1"); else ARGS+=("$1"); fi
        shift ;;
    esac
  done
}

COMMAND=${1:-}
case "$COMMAND" in
  ""|-h|--help) usage; exit 0 ;;
  setup) shift; cmd_setup "$@" ;;
  doctor)
    shift
    need_runtime
    normalise_args "$@"
    exec "$(runtime_py)" -m codecheck doctor ${ARGS[@]+"${ARGS[@]}"}
    ;;
  review|crap|complexity|dupes|dry|mutants|mutate|all|ratchet)
    shift
    need_runtime
    case "$COMMAND" in
      complexity|crap) GATE=crap ;;
      dry|dupes) GATE=dupes ;;
      mutate|mutants) GATE=mutants ;;
      *) GATE=$COMMAND ;;
    esac
    normalise_args "$@"
    exec "$(runtime_py)" -m codecheck gate "$GATE" ${ARGS[@]+"${ARGS[@]}"}
    ;;
  *) die "unknown command: $COMMAND (try --help)" ;;
esac
