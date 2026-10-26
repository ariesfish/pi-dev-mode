"""Which files a gate run measures."""

from __future__ import annotations

import os
import subprocess
from dataclasses import dataclass, field
from pathlib import Path

from codecheck.sources.discover import (
    SKIP_DIRS,
    language_of,
    is_test_file,
)


class ScopeError(Exception):
    """The requested scope cannot be resolved (no repo, unknown ref, no files)."""


def _git(root: Path, *args: str) -> bytes:
    result = subprocess.run(
        ["git", "-C", os.fspath(root), *args],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if result.returncode != 0:
        message = os.fsdecode(result.stderr).strip() or "git failed"
        raise ScopeError(message)
    return result.stdout


def _all_files(root: Path) -> list[str]:
    try:
        tracked = _git(root, "ls-files", "-z").split(b"\0")
        untracked = _git(root, "ls-files", "-z", "--others", "--exclude-standard").split(b"\0")
    except ScopeError:
        found: list[str] = []
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [name for name in dirnames if name not in SKIP_DIRS]
            for name in filenames:
                found.append(os.path.relpath(os.path.join(dirpath, name), root))
        return found
    return [os.fsdecode(entry) for entry in tracked + untracked if entry]


def _changed_files(root: Path, since: str | None) -> list[str]:
    if since:
        try:
            _git(root, "rev-parse", "--verify", "--quiet", since)
        except ScopeError as exc:
            raise ScopeError(f"unknown ref: {since}") from exc
        try:
            out = _git(root, "diff", "--name-only", "--diff-filter=ACMR", f"{since}...HEAD")
        except ScopeError as exc:
            raise ScopeError(f"cannot diff against {since}: {exc}") from exc
        return [line for line in out.decode("utf-8", "replace").splitlines() if line]
    status = _git(root, "status", "--porcelain", "--untracked-files=all")
    found: list[str] = []
    for line in status.decode("utf-8", "replace").splitlines():
        path = line[3:]
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        found.append(path.strip('"'))
    return found


@dataclass
class Scope:
    """Source files grouped by language, plus the test files each language has."""

    root: Path
    all_files: int = 0
    by_language: dict[str, list[str]] = field(default_factory=dict)
    tests_by_language: dict[str, list[str]] = field(default_factory=dict)

    @property
    def languages(self) -> list[str]:
        return [name for name in ("clojure", "java", "go", "typescript", "rust", "python")
                if self.by_language.get(name)]

    @property
    def files(self) -> list[str]:
        return [path for paths in self.by_language.values() for path in paths]


def _ignored_prefixes(root: Path) -> tuple[str, ...]:
    """Prefixes listed in `.check-code-ignore`, one per line.

    A vendored tree or a generated client is not this repository's code, so its
    numbers should not fail this repository's gate.
    """

    path = root / ".check-code-ignore"
    if not path.is_file():
        return ()
    prefixes = []
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if stripped and not stripped.startswith("#"):
            prefixes.append(stripped.rstrip("/") + "/")
    return tuple(prefixes)


def collect(
    root: Path,
    *,
    scope: str = "all",
    since: str | None = None,
    languages: set[str] | None = None,
) -> Scope:
    """Walk `root` (or the git change set) and group the source files."""

    raw = _changed_files(root, since) if scope == "changed" else _all_files(root)
    ignored = _ignored_prefixes(root)
    result = Scope(root=root)
    for relative in raw:
        if not relative:
            continue
        if ignored and relative.startswith(ignored):
            continue
        parts = Path(relative).parts
        if not SKIP_DIRS.isdisjoint(parts):
            continue
        absolute = root / relative
        if not absolute.is_file():
            continue
        language = language_of(absolute)
        if language is None:
            continue
        bucket = result.tests_by_language if is_test_file(absolute) else result.by_language
        bucket.setdefault(language, []).append(relative)
        if bucket is result.by_language:
            result.all_files += 1
    if languages:
        result.by_language = {
            name: paths for name, paths in result.by_language.items() if name in languages
        }
    if not result.languages:
        wanted = ", ".join(sorted(languages)) if languages else "any language"
        raise ScopeError(f"no source files in scope ({wanted})")
    return result
