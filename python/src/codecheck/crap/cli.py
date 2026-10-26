"""Command line for the multi-language CRAP tool."""

from __future__ import annotations

import sys
from dataclasses import dataclass, field
from pathlib import Path

from codecheck.crap.analyze import analyze_files
from codecheck.reports.coverage import CoverageBundle, load_bundle
from codecheck.cli import (
    GitError,
    apply_filters as _apply_filters,
    changed_files as _changed_files,
    changed_source_files as _changed_source,
    explicit_source_files as _explicit_files,
    positionals as _positionals,
    select_sources as _select_sources,
    show_help as _show_help,
    take as _take,
    tracked_source,
)
from codecheck.sources.discover import (
    CLOJURE_TEST_SUFFIXES,
    GO_TEST_SUFFIX,
    JS_TEST_SUFFIXES,
    SKIP_DIRS,
    TEST_DIRS,
    is_test_file,
    iter_source_files,
    language_of,
)
from codecheck.crap.snapshot import write_metrics
from codecheck.crap.report import format_report
from codecheck.crap.runners import run_coverage

_SKIPPED_DIRS = ", ".join(sorted(SKIP_DIRS | TEST_DIRS))
_TEST_PATTERNS = ", ".join(
    [
        f"*{GO_TEST_SUFFIX}",
        *[f"*{suffix}" for suffix in CLOJURE_TEST_SUFFIXES],
        *[f"*{suffix}" for suffix in JS_TEST_SUFFIXES],
        "test_*.py",
        "*_test.py",
        "conftest.py",
    ]
)

HELP = f"""\
Usage: codecheck crap [options] [path-or-filter ...]

Detect the language of each source file and score it with the CRAP metric
CRAP = CC² × (1 − coverage)³ + CC. Writes .metrics/crap.edn for the review gate
and prints a report sorted worst first.

Languages: Clojure (.clj .cljc .cljs .bb), Java (.java), Go (.go),
TypeScript and JavaScript (.ts .tsx .mts .cts .js .jsx .mjs .cjs),
Rust (.rs), Python (.py).

Options:
  -h, --help                    Print this help and exit.
  --root <path>                 Project root. Metrics are written here.
                                Default: the current directory.
  -s, --source-root <path>      Walk this tree instead of the project root.
                                May be repeated.
  --changed                     Analyze added and modified source files from
                                git status.
  --no-coverage                 Score complexity only. Coverage and CRAP are N/A.
  --use-existing-coverage       Read coverage already on disk. Do not rerun tests.
  --coverage-command <cmd>      Run this command instead of the per-language
                                coverage tools, then read the reports it wrote.
  --threshold <number>          Exit 2 when the worst CRAP score is above this.

Arguments:
  path              File or directory to analyze. Test paths are included when
                    you name them explicitly.
  filter            When the argument is not a path, only source files whose
                    path contains this text are analyzed.

With no paths, source files under the project root are analyzed. Directories
named {_SKIPPED_DIRS} are skipped, as are {_TEST_PATTERNS}.

Coverage, when it is produced:
  Clojure      clj -M:cov --lcov, then Cloverage form counts or LCOV
  Java         Maven JaCoCo instruction coverage, for each pom.xml module
  Go           go test ./... -coverprofile=...
  TypeScript   npm run coverage, Vitest's own LCOV, or c8 around npm test
  Rust         cargo llvm-cov, or cargo tarpaulin, in the nearest Cargo.toml
  Python       coverage.py LCOV, via pytest or unittest, per project

uml-viewer joins .metrics/crap.edn on :namespace and :name.
  Clojure      the ns, and the defn name
  Java         package.Class, and the method name
  Go           import path, or import.path.Receiver for methods
  TypeScript   dotted module path, or module.Class for methods
  Rust         crate::module, or crate::module::Type for methods
  Python       dotted module path, or module.Class for methods
"""


@dataclass
class Options:
    action: str
    message: str = ""
    exit_code: int = 0
    project_root: Path = field(default_factory=lambda: Path("."))
    source_roots: list[str] = field(default_factory=list)
    positionals: list[str] = field(default_factory=list)
    no_coverage: bool = False
    use_existing_coverage: bool = False
    coverage_command: str | None = None
    threshold: float | None = None
    changed: bool = False


def parse_args(argv: list[str] | None = None) -> Options:
    args = list(sys.argv[1:] if argv is None else argv)
    if any(arg in {"-h", "--help"} for arg in args):
        return Options(action="help", message=HELP, exit_code=0)
    options = Options(action="analyze")
    index = 0
    try:
        while index < len(args):
            arg = args[index]
            if arg in {"-s", "--source-root"}:
                options.source_roots.append(_take(args, index, arg))
                index += 2
                continue
            if arg == "--root":
                options.project_root = Path(_take(args, index, arg))
                index += 2
                continue
            if arg == "--coverage-command":
                options.coverage_command = _take(args, index, arg)
                index += 2
                continue
            if arg == "--threshold":
                raw = _take(args, index, arg)
                try:
                    options.threshold = float(raw)
                except ValueError as exc:
                    raise ValueError("--threshold requires a number") from exc
                index += 2
                continue
            if arg == "--no-coverage":
                options.no_coverage = True
                index += 1
                continue
            if arg == "--use-existing-coverage":
                options.use_existing_coverage = True
                index += 1
                continue
            if arg == "--changed":
                options.changed = True
                index += 1
                continue
            if arg.startswith("-"):
                raise ValueError(f"Unknown option: {arg}")
            options.positionals.append(arg)
            index += 1
    except ValueError as exc:
        return Options(action="help", message=f"{exc}\n\n{HELP}", exit_code=1)
    if options.no_coverage and options.coverage_command:
        return Options(
            action="help",
            message=f"--no-coverage cannot be combined with --coverage-command\n\n{HELP}",
            exit_code=1,
        )
    return options


def select_files(options: Options) -> list[Path]:
    return _select_sources(options, options.project_root.resolve())


def _coverage_bundle(options: Options, root: Path, files: list[Path]):
    if options.no_coverage:
        return None
    if options.use_existing_coverage:
        return load_bundle(root)
    status = run_coverage(root, files, options.coverage_command)
    if options.coverage_command and status not in (0, None):
        return CoverageBundle()
    return load_bundle(root)


def _threshold_status(options: Options, entries) -> int:
    if options.threshold is None:
        return 0
    scored = [entry.crap for entry in entries if entry.crap is not None]
    if scored and max(scored) > options.threshold:
        print(
            f"CRAP threshold exceeded: {max(scored):.1f} > {options.threshold:.1f}",
            file=sys.stderr,
        )
        return 2
    return 0


def run(argv: list[str] | None = None) -> int:
    options = parse_args(argv)
    if options.action == "help":
        return _show_help(options)

    root = options.project_root.resolve()
    try:
        files = select_files(options)
    except GitError as exc:
        print(str(exc), file=sys.stderr)
        return exc.code
    if not files:
        print("No source files to analyze.")
        return 0

    entries = analyze_files(files, root, _coverage_bundle(options, root, files))
    metrics = write_metrics(entries, root)
    print(format_report(entries), end="", flush=True)
    print(f"Wrote {metrics}", file=sys.stderr)
    return _threshold_status(options, entries)


def main(argv: list[str] | None = None) -> None:
    sys.exit(run(argv))
