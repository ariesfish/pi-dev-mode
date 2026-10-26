"""The artefact a review verdict cites: one file per gate run."""

from __future__ import annotations

import subprocess
from datetime import datetime, timezone
from pathlib import Path

from .verdict import Finding


def _git(root: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", "-C", str(root), *args], capture_output=True, text=True, check=False
    )
    return result.stdout.strip() if result.returncode == 0 else ""


def write(
    root: Path,
    findings: list[Finding],
    *,
    scope: str,
    since: str | None,
    files: int,
    languages: list[str],
    thresholds: str,
    runtime: str,
    metrics: str,
) -> Path:
    sha = _git(root, "rev-parse", "--short", "HEAD") or "nogit"
    subject = _git(root, "log", "-1", "--format=%s") or "-"
    stamp = datetime.now().strftime("%Y%m%dT%H%M%S")
    directory = root / ".dev" / "audit" / "evidence"
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / f"check-code-{sha}-{stamp}.txt"
    lines = [
        "check-code evidence",
        f"repo:    {root}",
        f"commit:  {sha} {subject}",
        f"scope:   {scope}{' since ' + since if since else ''}",
        f"files:   {files}",
        f"langs:   {' '.join(languages)}",
        f"date:    {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}",
        f"gate:    {thresholds}",
        f"runtime: {runtime}",
        "",
    ]
    lines += [f"{finding.status} {finding.label}".rstrip() for finding in findings]
    lines += ["", f"metrics dir: {metrics}", "snapshots:   crap.edn, crap.<lang>.edn, dry.edn, mutate/"]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path
