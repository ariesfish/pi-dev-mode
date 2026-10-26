"""`codecheck gate` — the review gate's command line.

Options mirror the old shell script so existing invocations keep working:

    codecheck gate review --since origin/main --evidence
    codecheck gate crap  --changed --langs typescript,python
    codecheck gate dupes --threshold-dupe 0.8
    codecheck gate mutants --max-workers 6
    codecheck gate ratchet --update-baseline
"""

from __future__ import annotations

import contextlib
import os
import sys
from dataclasses import dataclass, field
from pathlib import Path

from codecheck.reports.paths import metrics_root

from . import collect as collect_module
from . import doctor as doctor_module
from . import evidence as evidence_module
from . import run as run_module
from . import verdict as verdict_module
from .verdict import Finding

HELP = """\
Usage: codecheck gate <command> [options]

Commands:
  review       complexity + dupes, the numbers a review verdict cites (writes evidence)
  crap         CRAP per function against --threshold-crap
  dupes        structural duplication against --threshold-dupe and --max-dupes
  mutants      mutation survivors (slow: runs the suite once per mutant)
  all          crap + dupes (+ mutants with --mutants)
  ratchet      full-scope run compared against docs/check-code-baseline.json

Options:
  --root DIR               repository root (default: the git root, else cwd)
  --changed                measure the working tree's added and modified files
  --since REF              measure REF...HEAD (implies --changed)
  --langs LIST             comma-separated languages to include
  --threshold-crap N       CRAP ceiling per function (default 10)
  --threshold-dupe N       similarity floor for reporting (default 0.8)
  --max-dupes N            how many duplicate pairs are tolerated (default 0)
  --mutants                include the mutation pass in review/all
  --max-workers N          mutants running at once, per file
  --coverage-command CMD   use this instead of the per-language default
  --test-command CMD       use this instead of the engine's test command
  --reuse-coverage         do not regenerate coverage before the mutation pass
  --require-coverage       treat a language with no coverage as blocking
  --evidence               write .dev/audit/evidence/code-check-<sha>-<stamp>.txt
  --update-baseline        rewrite the ratchet baseline (full scope only)
  --quiet, --verbose

Exit: 0 pass · 1 a blocking finding · 2 usage or environment error.
"""


class UsageError(Exception):
    pass


@dataclass
class Options:
    command: str
    root: Path = field(default_factory=lambda: Path("."))
    scope: str = "all"
    since: str | None = None
    languages: set[str] = field(default_factory=set)
    threshold_crap: float = 10.0
    threshold_dupe: float = 0.8
    max_dupes: int = 0
    with_mutants: bool = False
    max_workers: int | None = None
    coverage_command: str | None = None
    test_command: str | None = None
    reuse_coverage: bool = False
    require_coverage: bool = False
    evidence: bool = False
    update_baseline: bool = False
    quiet: bool = False
    verbose: bool = False


def _take(argv: list[str], index: int, option: str) -> str:
    if index + 1 >= len(argv) or not argv[index + 1] or argv[index + 1].startswith("-"):
        raise UsageError(f"{option} requires a value")
    return argv[index + 1]


def parse_args(argv: list[str]) -> Options:
    args = list(argv)
    if not args or args[0] in {"-h", "--help"}:
        raise UsageError(HELP)
    command = args.pop(0)
    if command in {"complexity", "crap"}:
        command = "crap"
    elif command in {"dry", "dryer"}:
        command = "dupes"
    elif command in {"mutate", "mutator"}:
        command = "mutants"
    if command not in {"review", "crap", "dupes", "mutants", "all", "ratchet"}:
        raise UsageError(f"unknown gate command: {command}\n\n{HELP}")

    options = Options(command=command)
    index = 0
    while index < len(args):
        arg = args[index]
        if arg == "--root":
            options.root = Path(_take(args, index, arg))
            index += 2
        elif arg == "--changed":
            options.scope = "changed"
            index += 1
        elif arg == "--since":
            options.scope = "changed"
            options.since = _take(args, index, arg)
            index += 2
        elif arg == "--langs":
            options.languages = {
                name.strip() for name in _take(args, index, arg).split(",") if name.strip()
            }
            index += 2
        elif arg == "--threshold-crap":
            options.threshold_crap = float(_take(args, index, arg))
            index += 2
        elif arg == "--threshold-dupe":
            options.threshold_dupe = float(_take(args, index, arg))
            index += 2
        elif arg == "--max-dupes":
            options.max_dupes = int(_take(args, index, arg))
            index += 2
        elif arg == "--mutants":
            options.with_mutants = True
            index += 1
        elif arg == "--max-workers":
            options.max_workers = int(_take(args, index, arg))
            index += 2
        elif arg == "--coverage-command":
            options.coverage_command = _take(args, index, arg)
            index += 2
        elif arg == "--test-command":
            options.test_command = _take(args, index, arg)
            index += 2
        elif arg == "--reuse-coverage":
            options.reuse_coverage = True
            index += 1
        elif arg == "--require-coverage":
            options.require_coverage = True
            index += 1
        elif arg == "--evidence":
            options.evidence = True
            index += 1
        elif arg == "--update-baseline":
            options.update_baseline = True
            index += 1
        elif arg in {"--quiet", "-q"}:
            options.quiet = True
            index += 1
        elif arg in {"--verbose", "-v"}:
            options.verbose = True
            index += 1
        elif arg.startswith("-"):
            raise UsageError(f"unknown option: {arg}")
        else:
            raise UsageError(f"unexpected argument: {arg}")
    if options.command == "review":
        options.evidence = True
    return options


@contextlib.contextmanager
def _snapshot_directory(relative: str = ".dev/metrics"):
    """Point the engines at .dev/metrics for this run, then put the environment back."""

    key = "CODE_CHECK_METRICS_DIR"
    previous = os.environ.get(key)
    os.environ[key] = relative
    try:
        yield
    finally:
        if previous is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = previous


def _resolve_root(given: Path) -> Path:
    root = given.expanduser()
    if not root.is_dir():
        raise UsageError(f"--root is not a directory: {root}")
    return root.resolve()


def run(argv: list[str]) -> int:
    try:
        options = parse_args(argv)
    except UsageError as exc:
        print(exc, file=sys.stderr)
        return 0 if str(exc) == HELP else 2
    except ValueError as exc:
        print(f"{exc}", file=sys.stderr)
        return 2

    root = _resolve_root(options.root)
    with _snapshot_directory():
        return _run(options, root)


def _run(options: Options, root: Path) -> int:
    metrics = metrics_root(root)

    try:
        scope = collect_module.collect(
            root, scope=options.scope, since=options.since, languages=options.languages or None
        )
    except collect_module.ScopeError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    say = (lambda *parts: None) if options.quiet else print
    passes = run_module.Passes()
    findings: list[Finding] = []
    logs: list[str] = []

    if options.command in {"review", "crap", "all", "ratchet", "mutants"}:
        if options.command != "mutants":
            say(f"complexity (CRAP < {options.threshold_crap:g})")
            results, log = run_module.crap_pass(scope, options)
            logs.append(log)
            passes.crap = results
            passes.coverage_seen = any(item.unmeasured < item.entries for item in results)
            passes.broken = any(item.status == run_module.BROKEN for item in results)
            crap_findings = verdict_module.crap_findings(results)
            for finding in crap_findings:
                say(f"  {finding.status:<9}{finding.label}")
            findings += crap_findings

    if options.command in {"review", "dupes", "all", "ratchet"}:
        say(f"dupes (similarity >= {options.threshold_dupe:g}, budget {options.max_dupes})")
        count, code, log = run_module.dupes_pass(scope, options)
        logs.append(log)
        passes.dupes = count
        finding = verdict_module.dupes_finding(count, options.max_dupes, code)
        say(f"  {finding.status:<9}{finding.label}")
        findings.append(finding)

    wants_mutants = options.command == "mutants" or (
        options.command in {"review", "all"} and options.with_mutants
    ) or (options.command == "ratchet" and options.with_mutants)
    if wants_mutants:
        say("mutants (survivors must be 0)")
        if not options.reuse_coverage and options.command != "mutants":
            _results, log = run_module.crap_pass(scope, options)
            logs.append(log)
            say("  coverage regenerated for the mutation pass")
        (killed, survived, uncovered), code, log = run_module.mutants_pass(scope, options)
        logs.append(log)
        passes.mutants_ran = True
        passes.mutants_killed = killed
        passes.mutants_survived = survived
        passes.mutants_uncovered = uncovered
        finding = verdict_module.mutants_finding(killed, survived, uncovered, code)
        say(f"  {finding.status:<9}{finding.label}")
        findings.append(finding)
    elif options.command in {"review", "all", "ratchet"}:
        say("mutants (skipped: add --mutants)")

    if options.command == "ratchet" or options.update_baseline:
        baseline_path = Path(os.environ.get("CODE_CHECK_BASELINE") or root / "docs" / "check-code-baseline.json")
        finding = verdict_module.ratchet(
            passes,
            root=root,
            baseline=baseline_path,
            coverage_command=options.coverage_command,
            scope_is_full=options.scope == "all",
            update=options.update_baseline,
        )
        if finding is not None:
            say(f"{finding.status:<9}{finding.label}")
            findings.append(finding)

    passed, line = verdict_module.summarize(findings)
    say("")
    say(line)
    if options.verbose:
        for log in logs:
            for log_line in log.splitlines():
                print(f"    | {log_line}")

    if options.evidence:
        path = evidence_module.write(
            root,
            findings,
            scope=options.scope,
            since=options.since,
            files=len(scope.files),
            languages=scope.languages,
            thresholds=(
                f"CRAP < {options.threshold_crap:g}, dupes >= {options.threshold_dupe:g} "
                f"(budget {options.max_dupes}), survivors 0"
            ),
            runtime=str(Path(sys.executable).parent),
            metrics=str(Path(".dev/metrics")),
        )
        say("")
        say(f"evidence  {path}")

    return 0 if passed else 1


def doctor(argv: list[str]) -> int:
    root = Path(".")
    if argv and argv[0] in {"-h", "--help"}:
        print("Usage: codecheck doctor [--root DIR]")
        return 0
    if argv:
        if argv[0] != "--root" or len(argv) < 2:
            print("Usage: codecheck doctor [--root DIR]", file=sys.stderr)
            return 2
        root = Path(argv[1])
    root = _resolve_root(root)
    try:
        scope = collect_module.collect(root)
    except collect_module.ScopeError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    print(f"doctor  {root}  ({len(scope.files)} source files)")
    for line in doctor_module.doctor(root, scope):
        print(f"  {line}")
    print("")
    print(f"runtime: {Path(sys.executable).parent}   snapshots: .dev/metrics")
    return 0


def main(argv: list[str] | None = None) -> int:
    return run(list(sys.argv[1:] if argv is None else argv))
