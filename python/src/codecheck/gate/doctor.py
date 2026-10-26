"""What each language still needs before its coverage can be trusted."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from . import plan


def _ok(text: str) -> str:
    return f"ok       {text}"


def _partial(text: str, fix: str) -> list[str]:
    return [f"partial  {text}", f"         fix: {fix}"]


def _missing(text: str) -> str:
    return f"missing  {text}"


def _typescript(root: Path, files: int) -> list[str]:
    package = root / "package.json"
    label = f"typescript  {files} files"
    if not package.is_file():
        return [_missing(f"{label}  no package.json")]
    if plan._typescript_runner(root):
        return [_ok(f"{label}  coverage via the project's own runner")]
    return _partial(
        f"{label}  no coverage runner",
        "add a `test` or `coverage` script (vitest or c8 is then auto-detected)",
    )


def doctor(root: Path, scope) -> list[str]:
    """One line per language present in `scope`, plus the repo's ignore state."""

    report: list[str] = []
    for language in scope.languages:
        files = len(scope.by_language[language])
        label = f"{language:<11} {files} files"
        if language == "python":
            interpreter = plan.python_interpreter(root)
            if interpreter is None:
                report.append(_missing(f"{label}  no interpreter (create .venv, or install uv)"))
            elif plan.python_pytest_ready(root):
                report.append(_ok(f"{label}  {interpreter}"))
            else:
                report += _partial(f"{label}  pytest or coverage missing", f"{interpreter} -m pip install pytest coverage")
        elif language == "typescript":
            report += _typescript(root, files)
        elif language == "go":
            report.append(
                _ok(f"{label}  go test -coverprofile")
                if shutil.which("go")
                else _missing(f"{label}  go not on PATH")
            )
        elif language == "rust":
            if not shutil.which("cargo"):
                report.append(_missing(f"{label}  cargo not on PATH"))
            elif shutil.which("cargo-llvm-cov") or shutil.which("cargo-tarpaulin"):
                report.append(_ok(f"{label}  cargo llvm-cov / tarpaulin"))
            else:
                report += _partial(f"{label}  no Rust coverage tool", "cargo install cargo-llvm-cov")
        elif language == "java":
            report.append(
                _ok(f"{label}  JaCoCo via Maven")
                if shutil.which("mvn")
                else _missing(f"{label}  mvn not on PATH")
            )
        elif language == "clojure":
            report.append(
                _ok(f"{label}  clj -M:cov")
                if shutil.which("clj")
                else _missing(f"{label}  clj not on PATH")
            )
    if not (root / ".dev").exists() or not _gitignored(root):
        report.append("note     .dev/ is not gitignored here; snapshots must not be committed")
    return report


def _gitignored(root: Path) -> bool:
    import subprocess

    result = subprocess.run(
        ["git", "-C", str(root), "check-ignore", "-q", ".dev/metrics"],
        capture_output=True,
        check=False,
    )
    return result.returncode == 0


def package_json_summary(path: Path) -> str:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return "unreadable"
    return "yes" if (data.get("scripts") or {}).get("test") else "no"
