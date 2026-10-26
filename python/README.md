# codecheck — the measuring engines behind the review gate

One Python package holding the three measurements the review gate runs over a
diff. They share one source walker, one tree-sitter helper layer, one EDN
reader, one report loader, and one snapshot path, because those were three
near-identical copies while the engines lived in separate projects.

```bash
codecheck crap     [options]   # CRAP per function
codecheck dupes    [options]   # structural duplication
codecheck mutants  [options]   # mutation survivors
codecheck gate     review --since origin/main    # the gate over all three
codecheck doctor                 # what each language in this repo still needs

# the three engines, usable on their own
codecheck-crap / codecheck-dupes / codecheck-mutants
```

`codecheck gate` is what `scripts/check-code.sh` calls: thresholds, the
`broken`/`unmeasured` classification, the ratchet against
`docs/check-code-baseline.json`, and the evidence file. The shell script only
builds the runtime and seeds the grammar cache.

## Layout

```
src/codecheck/                 one package, one CLI, four commands
├── __main__.py     dispatcher: crap | dupes | mutants | gate | doctor
├── cli.py          shared option taking, positionals, git change set, selection
├── sources/        reading source files
│   ├── discover.py     walker: extensions, skip dirs, test-file detection
│   ├── syntax.py       parser cache and node helpers
│   ├── modulepath.py   file path -> dotted module name
│   ├── model.py        Function: what a reader hands the engines
│   └── languages/      one reader per language, plus the registry
├── reports/        formats on disk
│   ├── edn.py          the snapshot format
│   ├── paths.py        snapshot directory, nearest project marker, write
│   └── coverage.py     LCOV / JaCoCo / Cloverage loaders
├── crap/           complexity x coverage -> CRAP
├── dupes/          normalized fingerprints -> Jaccard similarity
├── mutants/        mutation sites, workers, outcomes
└── gate/           the review gate
    ├── collect.py      which files a run measures
    ├── plan.py         per-language coverage and test commands
    ├── run.py          the three passes, snapshots kept per language
    ├── verdict.py      pass / threshold / broken / unmeasured, and the ratchet
    ├── evidence.py     .dev/audit/evidence/check-code-<sha>-<stamp>.txt
    └── doctor.py       what each language still needs here
```

## Languages

Clojure, Java, Go, TypeScript/JavaScript, Rust, Python — detected per file, each
with its own function extractor, complexity rules, and mutation operators. Test
execution and coverage stay native (`pytest`+`coverage.py`, `vitest`/`c8`,
`go test -coverprofile`, JaCoCo via Maven, `cargo llvm-cov`, `clj -M:cov`).

## Install and test

`bash scripts/check-code.sh setup` builds the uv runtime:

```bash
uv venv --python 3.13 ~/.local/share/check-code
uv pip install -e python
```

The package's own suite runs against the vendored source:

```bash
uv run --project python --with pytest python -m pytest -q
# 327 passed, 1 skipped: the snapshot test needs babashka (bb) for an
# independent EDN reader; it skips with that reason when bb is absent
```

## Duplication inside the package

The gate measures itself. `codecheck dupes --threshold 0.8 src` went from 25
candidate pairs to 4 as the shared modules landed; the four that remain are
cross-grammar shape matches — two ancestor walks with different precedence
rules, two branches of one Go function, and two reader constructors. Merging
those would couple per-language AST handling for no gain, so they stay.

## Provenance

The engines are unclebob's [crapper](https://github.com/unclebob/crapper),
[dryer](https://github.com/unclebob/dryer), and
[mutator](https://github.com/unclebob/mutator) (BSD Zero Clause, see `LICENSE`),
taken at commits `6fd92c4`, `66ff6d2`, and `a5a0cb8`, then merged into one
package with the shared modules factored out. Local behaviour changes are two:
the snapshot directory honors `CODE_CHECK_METRICS_DIR`, and `.dev` joins the
walker's skip list so the gate never measures its own output.
