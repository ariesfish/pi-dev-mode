"""Command-line plumbing shared by the three engines.

The engines grew up as separate projects, so each carried its own copy of the
same argument and git helpers. This module is the single copy: option taking,
positional resolution, the git change set, source selection, and help printing.
An engine's own `cli.py` keeps only what is specific to its measurement.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

from codecheck.sources.discover import (
    SKIP_DIRS,
    TEST_DIRS,
    is_test_file,
    iter_source_files,
    language_of,
)


class GitError(Exception):
    """git could not describe the working tree. `code` is git's own status."""

    def __init__(self, code: int, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def git_run(root: Path, *args: str) -> bytes:
    """Run one git command under `root`, raising `GitError` on a non-zero exit."""

    result = subprocess.run(
        ["git", "-C", os.fspath(root), *args],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode != 0:
        message = os.fsdecode(result.stderr).strip() or "git status failed"
        raise GitError(result.returncode, message)
    return result.stdout


def changed_files(root: Path) -> list[Path]:
    """Added and modified files under `root`, resolved from the repository root.

    `-z` keeps spaces and non-ASCII names intact. A deletion is left out; a
    rename is the new file only. Limiting to `root` lets `--root` name a
    subdirectory of a larger checkout.
    """

    toplevel = Path(os.fsdecode(git_run(root, "rev-parse", "--show-toplevel")).strip())
    status = git_run(
        root,
        "status",
        "--porcelain",
        "-z",
        "--no-renames",
        "--untracked-files=all",
        "--",
        ".",
    )
    limit = root.resolve()
    found: list[Path] = []
    for entry in status.split(b"\0"):
        if len(entry) <= 3:
            continue
        path = (toplevel / os.fsdecode(entry[3:])).resolve()
        if path.is_file() and path.is_relative_to(limit):
            found.append(path)
    return found


def take(args: list[str], index: int, option: str) -> str:
    """The value after `--option`, or a ValueError naming the option."""

    if index + 1 >= len(args) or not args[index + 1] or args[index + 1].startswith("-"):
        raise ValueError(f"{option} requires a value")
    return args[index + 1]


def positionals(root: Path, args: list[str]) -> tuple[list[Path], list[str]]:
    """Split positionals into existing paths and path filters.

    A path that exists is resolved against `root`; anything else is a filter
    substring, so `codecheck crap src/work` reads as "the files under src/work".
    """

    existing: list[Path] = []
    filters: list[str] = []
    for arg in args:
        candidate = Path(arg)
        if not candidate.is_absolute():
            candidate = root / arg
        if candidate.exists():
            existing.append(candidate.resolve())
        else:
            filters.append(arg)
    return existing, filters


def tracked_source(path: Path, root: Path | None = None) -> bool:
    """True when `path` is source this gate should measure.

    `root` narrows the skipped-directory check to the part below it, which is
    what a subdirectory root needs.
    """

    parts = path.parts
    if root is not None:
        try:
            parts = path.resolve().relative_to(root.resolve()).parts
        except ValueError:
            return False
    if not SKIP_DIRS.isdisjoint(parts):
        return False
    if language_of(path) is None:
        return False
    return not is_test_file(path)


def changed_source_files(root: Path) -> list[Path]:
    return [path for path in changed_files(root) if tracked_source(path, root)]


def explicit_source_files(existing: list[Path]) -> list[Path]:
    """Source files for the paths named on the command line."""

    files: list[Path] = []
    for path in existing:
        if path.is_dir():
            files.extend(iter_source_files([path]))
        elif language_of(path) is not None:
            files.append(path)
    return files


def apply_filters(files: list[Path], filters: list[str]) -> list[Path]:
    if not filters:
        return files
    return [path for path in files if any(item in path.as_posix() for item in filters)]


def select_sources(options, root: Path) -> list[Path]:
    """The files a run measures: `--changed`, `--source-root`, named paths, or all."""

    existing, filters = positionals(root, options.positionals)
    if options.changed:
        files = changed_source_files(root)
    elif options.source_roots:
        files = iter_source_files([(root / path).resolve() for path in options.source_roots])
    elif existing:
        files = explicit_source_files(existing)
    else:
        files = iter_source_files([root])
    files = apply_filters(files, filters)
    return sorted({path.resolve() for path in files}, key=lambda path: path.as_posix())


def skipped_directory_text() -> str:
    """The skip list, spelled the way the walker applies it, for `--help`."""

    ordered = sorted(set(SKIP_DIRS) | set(TEST_DIRS))
    return ", ".join(ordered[:-1]) + ", and " + ordered[-1]


def show_help(options) -> int:
    stream = sys.stdout if options.exit_code == 0 else sys.stderr
    print(options.message, file=stream, end="" if options.message.endswith("\n") else "\n")
    return options.exit_code
