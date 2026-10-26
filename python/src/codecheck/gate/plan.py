"""What it takes to measure one language in this repository.

The metric layer is language-agnostic; running the tests and producing a
coverage report is not. Each language answers the same two questions here:
how do I produce coverage, and how do I run the tests.
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

BUILTIN = "builtin"
NONE = "none"
DEFAULT = "default"


def python_interpreter(root: Path) -> str | None:
    """The project's interpreter, else uv, else nothing."""

    for candidate in (root / ".venv" / "bin" / "python", root / "venv" / "bin" / "python"):
        if candidate.is_file():
            return str(candidate)
    if shutil.which("uv"):
        return "uv run --no-project --with coverage --with pytest python"
    return None


def python_pytest_ready(root: Path) -> bool:
    interpreter = python_interpreter(root)
    if interpreter is None:
        return False
    import subprocess

    command = interpreter.split() + ["-c", "import pytest, coverage"]
    return subprocess.run(command, capture_output=True, check=False).returncode == 0


def _has_tests(scope, language: str) -> bool:
    return bool(scope.tests_by_language.get(language))


def _typescript_runner(root: Path) -> bool:
    """True when the project names a runner the duplication-free engine can drive."""

    package = root / "package.json"
    if not package.is_file():
        return False
    for name in ("vitest.config.ts", "vitest.config.js", "vitest.config.mts", "vitest.config.mjs"):
        if (root / name).is_file():
            return True
    try:
        data = json.loads(package.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return False
    scripts = data.get("scripts") or {}
    dependencies = {**(data.get("devDependencies") or {}), **(data.get("dependencies") or {})}
    return bool(
        scripts.get("coverage")
        or scripts.get("test")
        or "c8" in dependencies
        or "vitest" in dependencies
    )


def coverage_plan(scope, language: str, override: str | None) -> str:
    """`builtin` (engine default), `none` (complexity only), or a shell command."""

    if override:
        return override
    if language == "typescript":
        return BUILTIN if _typescript_runner(scope.root) else NONE
    if language == "python":
        if not _has_tests(scope, "python"):
            return NONE
        interpreter = python_interpreter(scope.root)
        if interpreter is None:
            return NONE
        data = "target/coverage/python/.coverage"
        report = "target/coverage/python/lcov.info"
        return (
            f"{interpreter} -m coverage run --data-file={data} -m pytest -q && "
            f"{interpreter} -m coverage lcov --data-file={data} -o {report}"
        )
    return BUILTIN


def test_plan(scope, language: str, override: str | None) -> str:
    """`default` (engine's own command) or the command to run instead."""

    if override:
        return override
    if language != "python":
        return DEFAULT
    interpreter = python_interpreter(scope.root)
    if interpreter is None:
        return DEFAULT
    return f"{interpreter} -m pytest -q"
