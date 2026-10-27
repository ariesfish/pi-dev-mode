#!/usr/bin/env bash
# The repo's one verification command: typecheck, tests, then a smoke curl.
set -euo pipefail
npm run typecheck
npm test
curl -fsS http://localhost:8080/accounts >/dev/null
