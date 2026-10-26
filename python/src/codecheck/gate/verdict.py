"""The gate's own decisions: what fails, what the ratchet compares, what the summary says."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from .run import BROKEN, FAIL, PASS, SKIP, THRESHOLD, UNMEASURED, CrapResult, Passes


@dataclass
class Finding:
    """One line of the gate's report."""

    status: str
    label: str

    @property
    def blocking(self) -> bool:
        return self.status in (THRESHOLD, BROKEN, UNMEASURED, FAIL)


def crap_findings(results: list[CrapResult]) -> list[Finding]:
    findings: list[Finding] = []
    for result in results:
        if result.status == SKIP:
            findings.append(Finding(SKIP, f"{result.language}: no functions in scope"))
            continue
        label = result.summary
        if result.detail:
            label = f"{label}, {result.detail}"
        findings.append(Finding(result.status, label))
    return findings


def dupes_finding(count: int, budget: int, exit_code: int) -> Finding:
    if exit_code != 0:
        return Finding(FAIL, f"dupes: the duplication engine exited {exit_code}")
    if count > budget:
        return Finding(FAIL, f"dupes: {count} candidate(s), budget {budget}")
    return Finding(PASS, f"dupes: {count} candidate(s) at or above the threshold")


def mutants_finding(killed: int, survived: int, uncovered: int, exit_code: int) -> Finding:
    if exit_code == 2:
        return Finding(FAIL, "mutants: baseline tests fail")
    if survived > 0:
        return Finding(FAIL, f"mutants: {survived} survivor(s), {killed} killed")
    if killed == 0 and uncovered > 0:
        return Finding(FAIL, f"mutants: nothing measured ({uncovered} uncovered site(s), 0 run)")
    if killed == 0:
        return Finding(SKIP, "mutants: no mutation sites in scope")
    return Finding(PASS, f"mutants: {killed} killed, 0 survived")


def ratchet(
    passes: Passes,
    *,
    root: Path,
    baseline: Path,
    coverage_command: str | None,
    scope_is_full: bool,
    update: bool,
) -> Finding | None:
    """Compare today's worst numbers against the committed baseline."""

    if passes.broken:
        return Finding(SKIP, "ratchet: this run measured 0% coverage everywhere, so it cannot seed or compare")
    if update:
        baseline.parent.mkdir(parents=True, exist_ok=True)
        baseline.write_text(
            json.dumps(
                {
                    "note": (
                        "Full-scope check-code baseline. Raising any number here is a "
                        "deliberate, reviewable change. null = that metric was not measured "
                        "by this run, so the ratchet skips it."
                    ),
                    "coverage_command": coverage_command or "",
                    "worst_crap": passes.worst_crap if passes.coverage_seen else None,
                    "dupes": passes.dupes,
                    "mutants_killed": passes.mutants_killed if passes.mutants_ran else None,
                    "mutants_survivors": passes.mutants_survived if passes.mutants_ran else None,
                    "measured": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                },
                indent=2,
                ensure_ascii=False,
            )
            + "\n",
            encoding="utf-8",
        )
        return Finding(PASS, f"ratchet: baseline written to {baseline}")
    if not scope_is_full:
        return Finding(SKIP, "ratchet: a partial scope measures a subset, so it cannot be compared")
    if not baseline.is_file():
        return Finding(SKIP, f"ratchet: no {baseline} yet (seed it with --update-baseline)")
    try:
        saved = json.loads(baseline.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return Finding(SKIP, f"ratchet: unreadable baseline ({exc})")
    saved_coverage = saved.get("coverage_command") or ""
    if saved_coverage != (coverage_command or ""):
        return Finding(
            SKIP,
            "ratchet: baseline was measured under a different coverage command "
            f"({saved_coverage or 'builtin'} != {coverage_command or 'builtin'})",
        )

    raised: list[str] = []
    saved_worst = saved.get("worst_crap")
    if saved_worst is not None and passes.worst_crap > saved_worst:
        raised.append(f"worst CRAP {passes.worst_crap:.1f} > {saved_worst}")
    if passes.dupes > (saved.get("dupes") or 0):
        raised.append(f"duplicates {passes.dupes} > {saved.get('dupes')}")
    saved_survivors = saved.get("mutants_survivors")
    if saved_survivors is not None and passes.mutants_survived > saved_survivors:
        raised.append(f"survivors {passes.mutants_survived} > {saved_survivors}")
    if raised:
        return Finding(THRESHOLD, "ratchet: " + "; ".join(raised))
    return Finding(PASS, f"ratchet: worst CRAP {passes.worst_crap:.1f}, dupes {passes.dupes}, survivors {passes.mutants_survived}")


def summarize(findings: list[Finding]) -> tuple[bool, str]:
    blocking = [finding for finding in findings if finding.blocking]
    green = len([finding for finding in findings if finding.status == PASS])
    verdict = "PASS" if not blocking else "FAIL"
    return (not blocking), f"{verdict}  {green} green, {len(blocking)} blocking"
