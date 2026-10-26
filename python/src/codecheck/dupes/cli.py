"""Command line for the multi-language duplication finder."""

from __future__ import annotations

import sys
from dataclasses import dataclass, field
from pathlib import Path

from codecheck.cli import (
    GitError,
    apply_filters as _apply_filters,
    changed_files as _changed_files,
    explicit_source_files as _explicit_files,
    positionals as _positionals,
    select_sources as _select_sources,
    show_help as _show_help,
    skipped_directory_text as _skipped_directory_text,
    take as _take,
    tracked_source as _tracked_source,
)
from codecheck.sources.discover import SKIP_DIRS, TEST_DIRS, is_test_file, iter_source_files, language_of
from codecheck.dupes.report import format_text, render_edn, write_metrics
from codecheck.dupes.scan import find_duplicates, scan_files


@dataclass
class Options:
    action: str
    message: str = ""
    exit_code: int = 0
    project_root: Path = field(default_factory=lambda: Path("."))
    source_roots: list[str] = field(default_factory=list)
    positionals: list[str] = field(default_factory=list)
    threshold: float = 0.82
    min_lines: int = 4
    min_nodes: int = 20
    format: str = "text"
    changed: bool = False


def _number(value: str, option: str) -> float:
    try:
        return float(value)
    except ValueError as exc:
        raise ValueError(f"{option} requires a number") from exc


def _count(value: str, option: str) -> int:
    try:
        parsed = int(value)
    except ValueError as exc:
        raise ValueError(f"{option} requires an integer") from exc
    if parsed < 0:
        raise ValueError(f"{option} requires a non-negative integer")
    return parsed


HELP = f"""\
Usage: codecheck dupes [options] [path-or-filter ...]

Find candidate duplicate code in Clojure, Java, Go, TypeScript, Rust, and
Python. Each form is normalized — call and method names, operators, and
tree shape stay; local names, field names, and literals do not — and compared
with the other forms of the same language. The score is Jaccard similarity of
those structural fingerprints, the same score as dry4clj.

Prints a report and writes .metrics/dry.edn.

Languages: Clojure (.clj .cljc .cljs .cljd .bb), Java (.java), Go (.go),
TypeScript (.ts .tsx .mts .cts), Rust (.rs), Python (.py).

Options:
  -h, --help                    Print this help and exit.
  --root <path>                 Project root. Metrics are written here.
                                Default: the current directory.
  -s, --source-root <path>      Walk this tree instead of the project root.
                                May be repeated.
  --changed                     Compare added and modified source files from
                                git status.
  --threshold N                 Minimum similarity score, default 0.82.
  --min-lines N                 Minimum source lines in a candidate form,
                                default 4.
  --min-nodes N                 Minimum normalized syntax nodes, default 20.
  --format F                    text or edn, default text.
  --edn                         Same as --format edn.
  --text                        Same as --format text.

Arguments:
  path              File or directory to compare. Test paths are included when
                    you name them explicitly.
  filter            When the argument is not a path, only source files whose
                    path contains this text are compared.

With no paths, source files under the project root are compared. Directories
named {_skipped_directory_text()} are skipped, as are *_test.go, *.test.cts,
*.spec.cts, *.spec.ts, test_*.py, and *_test.py files.

Clojure compares every top-level form except ns. The other languages compare
functions and methods. A form is only compared with forms in the same language.

Exit codes:
  0  the report was written
  1  usage error
  2  unknown output format
"""


def parse_args(argv: list[str] | None = None) -> Options:
    args = list(sys.argv[1:] if argv is None else argv)
    if any(arg in {"-h", "--help"} for arg in args):
        return Options(action="help", message=HELP, exit_code=0)
    options = Options(action="scan")
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
            if arg == "--threshold":
                options.threshold = _number(_take(args, index, arg), arg)
                index += 2
                continue
            if arg == "--min-lines":
                options.min_lines = _count(_take(args, index, arg), arg)
                index += 2
                continue
            if arg == "--min-nodes":
                options.min_nodes = _count(_take(args, index, arg), arg)
                index += 2
                continue
            if arg == "--format":
                options.format = _take(args, index, arg)
                index += 2
                continue
            if arg == "--edn":
                options.format = "edn"
                index += 1
                continue
            if arg == "--text":
                options.format = "text"
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
    if options.format not in {"text", "edn"}:
        return Options(
            action="format",
            message=f"Unknown format: {options.format}\n",
            exit_code=2,
        )
    return options


GitStatusError = GitError


def select_files(options: Options) -> list[Path]:
    return _select_sources(options, options.project_root.resolve())


def run(argv: list[str] | None = None) -> int:
    options = parse_args(argv)
    if options.action == "help":
        return _show_help(options)
    if options.action == "format":
        print(options.message, file=sys.stderr, end="")
        return options.exit_code

    root = options.project_root.resolve()
    try:
        files = select_files(options)
    except GitStatusError as exc:
        print(exc.message, file=sys.stderr)
        return exc.code
    if not files:
        print("No source files to analyze.")
        return 0

    entries, warnings = scan_files(files, root, options.min_lines, options.min_nodes)
    for warning in warnings:
        print(f"dupes: {warning}", file=sys.stderr)
    candidates = find_duplicates(entries, options.threshold)
    metrics = write_metrics(candidates, root)
    if options.format == "edn":
        print(render_edn(candidates), end="")
    else:
        print(format_text(candidates), end="")
    print(f"Wrote {metrics}", file=sys.stderr)
    return 0


def main(argv: list[str] | None = None) -> None:
    sys.exit(run(argv))
