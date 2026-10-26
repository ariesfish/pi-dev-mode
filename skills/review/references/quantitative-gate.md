# Quantitative gate — the numbers behind a review verdict

`scripts/check-code.sh` is the measuring half of `review` and `code-review`.
It answers three questions with numbers a verdict can cite:

| Metric | Engine | Question | Threshold |
| --- | --- | --- | --- |
| `complexity` | crapper | how hard is this function to test, and is it tested? | CRAP < 10 per function |
| `dupes` | dryer | is this structure already written somewhere else? | similarity < 0.8, budget 0 |
| `mutants` | mutator | do the tests actually assert, or only execute? | 0 survivors |

CRAP is `CC² × (1 − coverage)³ + CC`: cyclomatic complexity priced by the
coverage that does not exist. A CC 25 function at 100% line coverage still scores
25 — complexity alone can fail the gate.

## Commands

```bash
bash scripts/check-code.sh setup                    # once per machine: uv runtime, pinned engines, grammars
bash scripts/check-code.sh doctor                   # per language: what coverage tool is missing here
bash scripts/check-code.sh review --changed         # the gate for a working tree
bash scripts/check-code.sh review --since origin/main --evidence
bash scripts/check-code.sh review --since HEAD~3 --langs typescript \
  --coverage-command "bun test --coverage --coverage-reporter=lcov" \
  --test-command "bun test" --mutants --max-workers 6
bash scripts/check-code.sh ratchet --update-baseline   # seed/refresh docs/check-code-baseline.json
```

Exit `0` pass, `1` gate failed, `2` usage or environment error. `review` always
writes `.dev/audit/evidence/check-code-<sha>-<stamp>.txt`; snapshots live in
`.dev/metrics/` (`crap.edn` merged across languages, `crap.<lang>.edn`,
`dry.edn`, `mutate/`).

## Reading a result

Four states, and only one of them is quiet:

- `pass` — measured, under threshold.
- `threshold` — measured, over. Blocking.
- `broken` — every function scored 0% coverage. The pinned test command matched
  no tests, so the CRAP numbers are fiction. Blocking, and the fix is the
  coverage command, not the code.
- `unmeasured` — no coverage report at all (`--no-coverage`, no venv, no test
  script). Not blocking by default; `--require-coverage` makes it blocking.

A language with no test toolchain is reported as `missing` by `doctor` and as
`unmeasured` by the gate. The gate never rounds that up to a pass.

## Engine setup

The three engines are one Python package under `python/`, one tool with three
measurement commands (`codecheck crap|dupes|mutants`) plus the gate itself
(`codecheck gate`), merging unclebob's crapper, dryer, and mutator and factoring
out what they duplicated: one source walker, one tree-sitter layer, one EDN
reader, one coverage loader, one snapshot path. The gate's rules — thresholds,
the `broken`/`unmeasured` classification, the ratchet — live in
`python/src/codecheck/gate/`, so `scripts/check-code.sh` is a bootstrap and a
dispatcher rather than the source of truth.
`setup` builds one uv-managed runtime (`~/.local/share/check-code`) and installs
that package editable; nothing is fetched from the network.

`bash scripts/check-code.sh setup --self-test` runs the package suite (327
passing, one skip: a snapshot test wants babashka for an independent EDN reader).
The
`python/` tree is upstream's code, so the gate skips it — its suite is the
check, not this repo's thresholds.

Two environment failures the setup exists to prevent, both reproduced:

- `python3 -m venv` against a uv-managed CPython writes a `pyvenv.cfg` pointing
  at `/usr/local/bin` and dies on `No module named 'encodings'`.
- `tree-sitter-language-pack` 1.x downloads grammars through a client that
  ignores `HTTP(S)_PROXY`; `setup` fetches the platform bundle with curl and
  seeds the pack's own cache, so parsing works offline afterwards.

## Ratchet

`.dev/metrics` is per developer; `docs/check-code-baseline.json` is committed.
`ratchet` runs at full scope and fails when today's worst CRAP, duplicate count,
or survivor count rises above the baseline. Raising the baseline is a deliberate
edit in its own diff, so a downgrade is visible in review.

A ratchet comparison is only valid under the same coverage command that produced
the baseline: the baseline stores it, and a mismatch reports a skip instead of a
false verdict.
