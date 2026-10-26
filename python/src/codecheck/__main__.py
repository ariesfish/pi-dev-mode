"""One entry point for the three engines.

    python -m codecheck crap [options]     CRAP per function (complexity x coverage)
    python -m codecheck dupes [options]    structural duplication
    python -m codecheck mutants [options]  mutation survivors

Each engine prints its own report and writes its own snapshot; the gate in
`scripts/check-code.sh` is the human interface over all three.
"""

from __future__ import annotations

import importlib
import sys

USAGE = """\
Usage: codecheck <engine> [options]

Engines:
  crap     CRAP per function: cyclomatic complexity priced by coverage
  dupes    structural duplication, Jaccard similarity per pair
  mutants  mutation testing: survivors are assertions the tests never made

Gate:
  gate     the review gate over all three: thresholds, evidence, ratchet
  doctor   what each language in this repo still needs before it can be measured

Aliases: complexity -> crap, dry -> dupes, mutate -> mutants

Run `codecheck <engine> --help` for that engine's options.
"""

_ENGINES = {
    "crap": "codecheck.crap.cli",
    "complexity": "codecheck.crap.cli",
    "dupes": "codecheck.dupes.cli",
    "dry": "codecheck.dupes.cli",
    "mutants": "codecheck.mutants.cli",
    "mutate": "codecheck.mutants.cli",
}

_GATE = {"gate": "codecheck.gate.cli", "doctor": "codecheck.gate.cli"}


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    if not args:
        print(USAGE, file=sys.stderr)
        return 2
    if args[0] in {"-h", "--help"}:
        print(USAGE, end="")
        return 0
    if args[0] in _GATE:
        gate = importlib.import_module("codecheck.gate.cli")
        if args[0] == "doctor":
            return gate.doctor(args[1:])
        return gate.run(args[1:])
    module = _ENGINES.get(args[0])
    if module is None:
        print(f"unknown engine: {args[0]}\n\n{USAGE}", file=sys.stderr)
        return 2
    importlib.import_module(module).main(args[1:])
    return 0


def crap() -> int:
    return main(["crap", *sys.argv[1:]])


def dupes() -> int:
    return main(["dupes", *sys.argv[1:]])


def mutants() -> int:
    return main(["mutants", *sys.argv[1:]])


if __name__ == "__main__":
    sys.exit(main())
