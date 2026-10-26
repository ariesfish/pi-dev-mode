#!/usr/bin/env bash
# gate.sh — SDLC ledger gates (P5, opt-in). Shim over gates/ledger.py.
#
# The state machine lives in ledger.py (stdlib only); this file keeps the
# command name and the python3 presence check. Run from the target project
# root. Exit codes: 0 PASS · 1 FAIL · 2 refusal/usage · 3 missing python3 ·
# 4 BLOCKED. See gates/README.md.
set -euo pipefail
command -v python3 >/dev/null 2>&1 || { echo "gate.sh: python3 required" >&2; exit 3; }
DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
exec python3 "$DIR/ledger.py" "$@"
