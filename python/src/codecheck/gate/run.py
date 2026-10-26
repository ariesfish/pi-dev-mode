"""The three measurement passes, run over one scope."""

from __future__ import annotations

import contextlib
import io
import shutil
from dataclasses import dataclass, field
from pathlib import Path

from codecheck.crap import cli as crap_cli
from codecheck.dupes import cli as dupes_cli
from codecheck.mutants import cli as mutants_cli
from codecheck.reports.edn import loads
from codecheck.reports.paths import metrics_root

from . import plan

PASS = "pass"
THRESHOLD = "threshold"
BROKEN = "broken"
UNMEASURED = "unmeasured"
FAIL = "fail"
SKIP = "skip"


def _capture(runner, argv: list[str]) -> tuple[int, str]:
    """Run an engine in-process, keeping its console output out of our report."""

    buffer = io.StringIO()
    with contextlib.redirect_stdout(buffer), contextlib.redirect_stderr(buffer):
        code = runner(argv)
    return code, buffer.getvalue()


def _read(path: Path) -> dict:
    if not path.is_file() or not path.stat().st_size:
        return {}
    try:
        data = loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    return data if isinstance(data, dict) else {}


@dataclass
class CrapResult:
    language: str
    entries: int
    worst: float
    max_complexity: int
    uncovered: int
    unmeasured: int
    status: str
    detail: str = ""

    @property
    def summary(self) -> str:
        return (
            f"{self.language}: {self.entries} fn, worst CRAP {self.worst:.1f}, "
            f"CC max {self.max_complexity}"
        )


@dataclass
class Passes:
    crap: list[CrapResult] = field(default_factory=list)
    dupes: int = 0
    dupes_exit: int = 0
    mutants_killed: int = 0
    mutants_survived: int = 0
    mutants_uncovered: int = 0
    mutants_exit: int = 0
    mutants_ran: bool = False
    coverage_seen: bool = False
    broken: bool = False

    @property
    def worst_crap(self) -> float:
        return max((item.worst for item in self.crap), default=0.0)


def _snapshot(root: Path, name: str) -> Path:
    return metrics_root(root) / name


def crap_pass(scope, options) -> tuple[list[CrapResult], str]:
    """Score every language, keeping one snapshot per language."""

    results: list[CrapResult] = []
    logs: list[str] = []
    for language in scope.languages:
        files = scope.by_language[language]
        chosen = plan.coverage_plan(scope, language, options.coverage_command)
        argv = ["--root", str(scope.root)]
        if chosen == plan.NONE:
            argv.append("--no-coverage")
        elif chosen != plan.BUILTIN:
            argv += ["--coverage-command", chosen]
        argv += files
        code, output = _capture(crap_cli.run, argv)
        logs.append(output)

        produced = _snapshot(scope.root, "crap.edn")
        target = _snapshot(scope.root, f"crap.{language}.edn")
        if produced.is_file():
            shutil.copyfile(produced, target)
        data = _read(target)
        entries = data.get("entries", [])
        scored = [entry["crap"] for entry in entries if entry.get("crap") is not None]
        result = CrapResult(
            language=language,
            entries=len(entries),
            worst=max(scored, default=0.0),
            max_complexity=max((entry.get("complexity", 0) for entry in entries), default=0),
            uncovered=len([entry for entry in entries if entry.get("coverage") == 0]),
            unmeasured=len([entry for entry in entries if entry.get("coverage") is None]),
            status=PASS,
        )
        if not entries:
            result.status = SKIP
            results.append(result)
            continue
        if result.unmeasured == len(entries):
            result.status = UNMEASURED if options.require_coverage else PASS
            result.detail = "coverage unmeasured"
        elif result.uncovered == len(entries):
            result.status = BROKEN
            result.detail = "coverage 0% everywhere (the pinned test command matched no tests)"
        elif code != 0 and chosen not in (plan.BUILTIN, plan.NONE):
            result.status = BROKEN
            result.detail = f"coverage command exited {code}"
        elif result.worst > options.threshold_crap:
            result.status = THRESHOLD
            result.detail = f"over {options.threshold_crap:g}"
        results.append(result)

    merged = _merge_crap(scope.root, scope.languages)
    return results, merged + "\n" + "\n".join(logs)


def _merge_crap(root: Path, languages: list[str]) -> str:
    entries: list[dict] = []
    for language in languages:
        entries.extend(_read(_snapshot(root, f"crap.{language}.edn")).get("entries", []))
    entries.sort(key=lambda entry: (entry.get("crap") is None, -(entry.get("crap") or 0)))
    from codecheck.reports.edn import dumps

    target = _snapshot(root, "crap.edn")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(dumps({"entries": entries}) + "\n", encoding="utf-8")
    return f"{target} ({len(entries)} entries)"


def dupes_pass(scope, options) -> tuple[int, int, str]:
    """One pass over every source file: candidates are only compared within a language."""

    argv = ["--root", str(scope.root), "--threshold", f"{options.threshold_dupe:g}"]
    argv += scope.files
    code, output = _capture(dupes_cli.run, argv)
    data = _read(_snapshot(scope.root, "dry.edn"))
    return len(data.get("candidates", [])), code, output


def mutants_pass(scope, options) -> tuple[tuple[int, int, int], int, str]:
    """One pass per language: each engine run owns its own snapshots."""

    shutil.rmtree(_snapshot(scope.root, "mutate"), ignore_errors=True)
    killed = survived = uncovered = 0
    exit_code = 0
    logs: list[str] = []
    for language in scope.languages:
        chosen = plan.test_plan(scope, language, options.test_command)
        argv = ["--root", str(scope.root), "--use-existing-coverage"]
        if chosen != plan.DEFAULT:
            argv += ["--test-command", chosen]
        if options.max_workers is not None:
            argv += ["--max-workers", str(options.max_workers)]
        argv += scope.by_language[language]
        code, output = _capture(mutants_cli.run, argv)
        logs.append(output)
        exit_code = code if code not in (0,) else exit_code
        for path in _snapshot(scope.root, "mutate").rglob("*.edn"):
            for form in _read(path).get("forms", []):
                killed += form.get("killed") or 0
                survived += form.get("survived") or 0
                uncovered += form.get("uncovered") or 0
    return (killed, survived, uncovered), exit_code, "".join(logs)
