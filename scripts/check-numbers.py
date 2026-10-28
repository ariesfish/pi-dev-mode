#!/usr/bin/env python3
"""check-numbers.py — suite counts claimed in docs/CONSTRAINTS.md vs the suites.

The quality contract claims counts in its Enforced/Measured rows. Numbers that
no run re-derives drift — the pi-suite rows sat at 59/59-6-files for two
rounds after the suite had grown to 82/82-10-files, and nothing failed. This
checker closes that hole: for every suite the current run actually executed
(its tee-captured log handed in), the live count is compared against every row
claiming it; rows are also cross-checked against each other, so a half-updated
table fails even where the suite did not run.

Claims — each regex must match exactly one row; a moved or reworded row fails
with a pointer here, by design (update ROW_PATTERNS with the table, not
around it):

  gates     Enforced "Gates semantics ..." + Measured "test-gates 断言数" (slot: ok)
  adapters  Enforced "adapters N 件缝测试" (tests) + Measured "adapters 缝测试 | N/N"
  pi        Enforced "bun test N/N(P 文件)" + Measured "pi 扩展测试 | N/N"

Live sources (check.sh tee-captures each suite; a missing log → that suite's
claims are cross-checked only, and the output says so):

  gates     `ok:` line count             (test-gates.sh)
  adapters  `ℹ pass/tests N` summary     (node --test)
  pi        `N pass` + `Ran N tests across P files` (bun test)

Exit: 0 synced · 1 findings (drift, or unparseable/ambiguous claim rows) ·
2 usage. Stdlib only.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
CONSTRAINTS = REPO / "docs" / "CONSTRAINTS.md"

# slot per live value; every claim row is a (partial) slot assignment
SLOTS: dict[str, tuple[str, ...]] = {
    "gates": ("ok",),
    "adapters": ("pass", "tests"),
    "pi": ("pass", "tests", "files"),
    "evals": ("covered", "skills"),
}

# suite → [(row label, exactly-one row regex, slots the regex groups assign)]
ROW_PATTERNS: dict[str, list[tuple[str, re.Pattern[str], tuple[str, ...]]]] = {
    "gates": [
        ("Enforced/Gates semantics", re.compile(r"\| Gates semantics \|.*当前 (\d+)"), ("ok",)),
        ("Measured/test-gates 断言数", re.compile(r"\| test-gates 断言数 \| (\d+) \|"), ("ok",)),
    ],
    "adapters": [
        ("Enforced/Full acceptance", re.compile(r"adapters (\d+) 件缝测试"), ("tests",)),
        (
            "Measured/adapters 缝测试",
            re.compile(r"\| adapters 缝测试 \| (\d+)/(\d+) \|"),
            ("pass", "tests"),
        ),
    ],
    "evals": [
        ("Measured/eval 覆盖技能", re.compile(r"\| eval 覆盖技能[^|]*\| (\d+)/(\d+) \|"), ("covered", "skills")),
    ],
    "pi": [
        (
            "Enforced/pi 扩展套件",
            re.compile(r"\| pi 扩展套件 \| bun test (\d+)/(\d+)\((\d+) 文件\)"),
            ("pass", "tests", "files"),
        ),
        (
            "Measured/pi 扩展测试",
            re.compile(r"\| pi 扩展测试 \| (\d+)/(\d+) \|"),
            ("pass", "tests"),
        ),
    ],
}


@dataclass
class Claim:
    row: str
    line: int
    values: dict[str, int] = field(default_factory=dict)

    def at(self) -> str:
        return f"{CONSTRAINTS.name}:{self.line} ({self.row})"


def parse_claims(text: str) -> tuple[dict[str, list[Claim]], list[str]]:
    claims: dict[str, list[Claim]] = {}
    findings: list[str] = []
    lines = text.splitlines()
    for suite, rows in ROW_PATTERNS.items():
        per: list[Claim] = []
        for label, pat, slots in rows:
            hits = [
                (i + 1, m.groups()) for i, line in enumerate(lines) for m in [pat.search(line)] if m
            ]
            if not hits:
                findings.append(
                    f"{CONSTRAINTS.name}: no `{label}` claim row matches — the table moved or "
                    f"was reworded; update scripts/check-numbers.py ROW_PATTERNS with it"
                )
                continue
            if len(hits) > 1:
                at = ", ".join(str(n) for n, _ in hits)
                findings.append(
                    f"{CONSTRAINTS.name}: `{label}` claim row matches {len(hits)} times "
                    f"(lines {at}) — make the claim unique"
                )
                continue
            line_no, groups = hits[0]
            per.append(Claim(label, line_no, dict(zip(slots, (int(g) for g in groups)))))
        claims[suite] = per
    return claims, findings


def live_gates(log: str) -> dict[str, int]:
    return {"ok": sum(1 for line in log.splitlines() if line.startswith("ok:"))}


def live_adapters(log: str) -> dict[str, int]:
    tests = re.findall(r"ℹ tests (\d+)", log)
    passed = re.findall(r"ℹ pass (\d+)", log)
    if not tests or not passed:
        return {}
    return {"pass": int(passed[-1]), "tests": int(tests[-1])}


def live_pi(log: str) -> dict[str, int]:
    ran = re.findall(r"Ran (\d+) tests across (\d+) files", log)
    passed = re.findall(r"^ *(\d+) pass$", log, re.MULTILINE)
    if not ran or not passed:
        return {}
    n, files = ran[-1]
    return {"pass": int(passed[-1]), "tests": int(n), "files": int(files)}


LIVE_FROM: dict[str, tuple[str, object]] = {
    "gates": ("gates_log", live_gates),
    "adapters": ("adapters_log", live_adapters),
    "pi": ("pi_log", live_pi),
}


def live_evals(root: Path) -> dict[str, int]:
    """Model-invoked skills only: a `disable-model-invocation: true` skill never
    reaches the model's prompt, so it has no trigger surface a case could test.
    Counting it in the denominator would demand a case that cannot exist."""
    skills = set()
    for p in (root / "skills").glob("*/SKILL.md"):
        fm = re.match(r"^---\n(.*?)\n---\n", p.read_text(encoding="utf-8"), re.S)
        if fm and re.search(r"^disable-model-invocation:\s*true\s*$", fm.group(1), re.M):
            continue
        skills.add(p.parent.name)
    covered = {p.name for p in (root / "evals").iterdir() if p.is_dir() and any(p.glob("*/prompt.md"))}
    return {"covered": len(covered & skills), "skills": len(skills)}


def describe(suite: str, values: dict[str, int]) -> str:
    p, t = values.get("pass"), values.get("tests")
    if suite == "evals":
        return f"{values.get('covered', '?')}/{values.get('skills', '?')}"
    if suite == "gates":
        return str(values.get("ok", "?"))
    if suite == "adapters":
        return f"{p if p is not None else '?'}/{t if t is not None else '?'}"
    f = values.get("files")
    return f"{p if p is not None else '?'}/{t if t is not None else '?'}" + (
        f"({f} 文件)" if f is not None else ""
    )


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Claimed suite counts vs captured suite logs")
    ap.add_argument("--gates-log", type=Path, help="tee-captured test-gates.sh output")
    ap.add_argument("--adapters-log", type=Path, help="tee-captured node --test output")
    ap.add_argument("--pi-log", type=Path, help="tee-captured test-extensions.sh output")
    args = ap.parse_args(argv)

    if not CONSTRAINTS.is_file():
        print(f"check-numbers: {CONSTRAINTS} missing — the contract itself is the finding")
        return 1
    claims, findings = parse_claims(CONSTRAINTS.read_text(encoding="utf-8"))

    skipped: list[str] = []
    live: dict[str, dict[str, int]] = {"evals": live_evals(REPO)}
    for suite, (attr, live_fn) in LIVE_FROM.items():
        log_path: Path | None = getattr(args, attr)
        if log_path is None:
            skipped.append(suite)
            continue
        got: dict[str, int] = live_fn(log_path.read_text(encoding="utf-8"))
        if not got:
            print(f"check-numbers: could not parse a live count out of {log_path} ({suite})")
            return 1
        live[suite] = got

    for suite, per in claims.items():
        # rows must agree on every shared slot
        for slot in SLOTS[suite]:
            holders = [(c, c.values[slot]) for c in per if slot in c.values]
            vals = {v for _, v in holders}
            if len(vals) > 1:
                span = " vs ".join(f"{c.at()} {v}" for c, v in holders)
                findings.append(
                    f"{span} — rows disagree on `{suite}.{slot}`; update them together"
                )
        # claims must survive every suite that actually ran
        if suite not in live:
            continue
        for c in per:
            bad = {
                slot: (claimed, live[suite][slot])
                for slot, claimed in c.values.items()
                if slot in live[suite] and claimed != live[suite][slot]
            }
            if bad:
                drift = ", ".join(
                    f"{slot} {claimed} ≠ {actual}" for slot, (claimed, actual) in bad.items()
                )
                findings.append(
                    f"{c.at()} claims {drift} — this run measured "
                    f"{describe(suite, live[suite])}; update the claim rows"
                )

    live_note = ", ".join(f"{s} {describe(s, v)}" for s, v in sorted(live.items())) or "none"
    skip_note = f"; cross-check only (no live log): {', '.join(skipped)}" if skipped else ""
    if findings:
        print(f"check-numbers: {len(findings)} finding(s) — live: {live_note}{skip_note}")
        for f in findings:
            print(f"  {f}")
        return 1
    print(f"check-numbers: synced — live: {live_note}{skip_note}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
