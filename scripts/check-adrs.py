#!/usr/bin/env python3
"""check-adrs.py — mechanical ADR hygiene for docs/adr/ trees.

Multi-writer ADR directories rot in three known ways: duplicate numbers from
concurrent creation, gaps from hand renumbering, and a decision overturned
whose old half never got marked (the writer was thinking about the new ADR,
not the one it replaced). This checker makes the rot fail a check instead of
waiting for a retrospective to notice.

Per ADR directory — each directory is its own numbering sequence (`docs/adr/`
system-wide, one `src/*/docs/adr/` per context):

1. names: `NNNN-slug.md` — zero-padded 4+ digit number, lowercase slug
2. numbers: unique and gap-free (the format contract is "scan for the
   highest and increment"; both rot modes break that contract)
3. status frontmatter, when present: `proposed` | `accepted` |
   `deprecated` | `superseded by ADR-NNNN`
4. supersede closure, both ends:
   - ADR-0007 marked `superseded by ADR-0012` requires 0012 to exist in the
     same directory and say `Supersedes ADR-0007`
   - an ADR saying `supersedes ADR-0007` requires 0007's status frontmatter
     to read `superseded by ADR-NNNN` pointing back

A pair marked on one end only is exactly the drift multi-writer repos
accumulate; the closure check fails it. Format contract: this package's
references/adr-format.md — `constraints` copies this script into a target
repo's scripts/ and wires it into the check command or CI.

Exit: 0 clean · 1 findings · 2 usage. Stdlib only. --selftest builds fixture
trees proving each numbered check fails on its specimen and a healthy tree
passes (check.sh runs that, not a scan of this repo's own nonexistent ADRs).
"""

from __future__ import annotations

import argparse
import re
import sys
import tempfile
from collections import Counter
from pathlib import Path

NAME_RE = re.compile(r"^(\d{4,})-([a-z0-9][a-z0-9-]*)\.md$")
SUPERSEDED_RE = re.compile(r"^superseded by ADR-(\d{4,})$", re.IGNORECASE)
SUPERSEDES_RE = re.compile(r"\bsupersedes?\s+ADR-(\d{4,})", re.IGNORECASE)
SUPERSEDES_FM_RE = re.compile(r"ADR-(\d{4,})", re.IGNORECASE)
PLAIN_STATUS = ("proposed", "accepted", "deprecated")


def frontmatter(text: str) -> dict[str, str]:
    """Minimal frontmatter reader: leading --- block, `key: value` lines."""
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}
    for i, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            fm: dict[str, str] = {}
            for body in lines[1:i]:
                key, sep, value = body.partition(":")
                if sep:
                    fm[key.strip().lower()] = value.strip()
            return fm
    return {}


def check_dir(root: Path, adr_dir: Path, findings: list[str]) -> None:
    rel = adr_dir.relative_to(root)
    entries = sorted(p for p in adr_dir.iterdir() if p.is_file() and p.suffix == ".md")
    if not entries:
        return
    by_num: dict[int, Path] = {}
    counter: Counter[int] = Counter()
    for p in entries:
        m = NAME_RE.match(p.name)
        if not m:
            findings.append(
                f"{rel}/{p.name}: name must be NNNN-slug.md (zero-padded number, lowercase slug)"
            )
            continue
        n = int(m.group(1))
        counter[n] += 1
        by_num.setdefault(n, p)
    for n, count in sorted(counter.items()):
        if count > 1:
            dupes = ", ".join(p.name for p in entries if self_num(p.name) == n)
            findings.append(f"{rel}: ADR {n:04d} claimed by more than one file: {dupes}")
    if counter:
        missing = sorted(set(range(1, max(counter) + 1)) - set(counter))
        if missing:
            joined = ", ".join(f"{n:04d}" for n in missing)
            findings.append(f"{rel}: numbering gap(s) — no ADR {joined}")
    # status token + forward closure (old says who replaced it)
    claims: dict[int, list[int]] = {}  # replacement number -> [old numbers it claims]
    for n, p in sorted(by_num.items()):
        text = p.read_text(encoding="utf-8")
        status = frontmatter(text).get("status")
        if status is None:
            continue
        if status.lower() in PLAIN_STATUS:
            continue
        m = SUPERSEDED_RE.match(status)
        if not m:
            findings.append(
                f"{rel}/{p.name}: status must be one of "
                f"proposed | accepted | deprecated | superseded by ADR-NNNN (got {status!r})"
            )
            continue
        target = int(m.group(1))
        if target not in by_num:
            findings.append(
                f"{rel}/{p.name}: status `superseded by ADR-{target:04d}` — no such ADR in {rel}"
            )
        else:
            claims.setdefault(target, []).append(n)
    # reverse closure (new says what it replaced) + pair backlink
    replaced: dict[int, list[int]] = {}  # old number -> [new numbers claiming it]
    for n, p in sorted(by_num.items()):
        text = p.read_text(encoding="utf-8")
        claimed: set[int] = {int(m.group(1)) for m in SUPERSEDES_RE.finditer(text)}
        fm = frontmatter(text)
        if "supersedes" in fm:
            claimed |= {int(m.group(1)) for m in SUPERSEDES_FM_RE.finditer(fm["supersedes"])}
        for old in sorted(claimed):
            if old not in by_num:
                findings.append(f"{rel}/{p.name}: supersedes ADR-{old:04d} — no such ADR in {rel}")
                continue
            replaced.setdefault(old, []).append(n)
        # this ADR is named as a replacement — it must claim each old back
        for old in claims.get(n, []):
            if old not in claimed:
                findings.append(
                    f"{rel}/{p.name}: marked `superseded by ADR-{n:04d}` but this ADR "
                    f"does not say `Supersedes ADR-{old:04d}` — mark both ends"
                )
    for old, replacers in sorted(replaced.items()):
        old_p = by_num[old]
        old_status = frontmatter(old_p.read_text(encoding="utf-8")).get("status")
        new_statutes = [f"ADR-{r:04d}" for r in replacers]
        for r in replacers:
            m = SUPERSEDED_RE.match(old_status or "")
            if not m or int(m.group(1)) != r:
                findings.append(
                    f"{rel}/{old_p.name}: superseded by {new_statutes[0]} per its own text, "
                    f"but status is {old_status!r} — set `status: superseded by ADR-{r:04d}`"
                )
                break  # one finding per old ADR is enough to route the fix


def self_num(name: str) -> int | None:
    m = NAME_RE.match(name)
    return int(m.group(1)) if m else None


def adr_dirs(root: Path) -> list[Path]:
    dirs: list[Path] = []
    main = root / "docs" / "adr"
    if main.is_dir():
        dirs.append(main)
    dirs += sorted(p for p in root.glob("src/*/docs/adr") if p.is_dir())
    return dirs


def run(root: Path) -> int:
    dirs = adr_dirs(root)
    if not dirs:
        print(f"check-adrs: no docs/adr/ under {root} — nothing to check")
        return 0
    findings: list[str] = []
    for d in dirs:
        check_dir(root, d, findings)
    if findings:
        print(f"check-adrs: {len(findings)} finding(s)")
        for f in findings:
            print(f"  {f}")
        return 1
    print(f"check-adrs: {len(dirs)} ADR director{'y' if len(dirs) == 1 else 'ies'} clean")
    return 0


def selftest() -> int:
    healthy = [
        ("docs/adr/0001-postgres-write-model.md", "# Postgres write model\n\nDecided: event-sourced writes, projected reads.\n"),
        ("docs/adr/0002-rest-not-graphql.md", "---\nstatus: accepted\n---\n\n# REST over GraphQL\n\nReasons recorded below.\n"),
        ("docs/adr/0003-manual-sql.md", "---\nstatus: superseded by ADR-0004\n---\n\n# Manual SQL\n\nORM arrives in 0004.\n"),
        ("docs/adr/0004-orm-mapper.md", "---\nsupersedes: ADR-0003\n---\n\n# ORM mapper\n\nSupersedes ADR-0003.\n"),
        ("src/billing/docs/adr/0001-sync-http.md", "# Synchronous HTTP\n\nBilling calls are synchronous.\n"),
    ]
    specimens: list[tuple[str, list[str], str]] = [
        (
            "names",
            [("docs/adr/0001_ok-ish.md", "# x\n"), ("docs/adr/0002-two.md", "# x\n")],
            "name must be NNNN-slug.md",
        ),
        (
            "duplicates",
            [("docs/adr/0001-a.md", "# x\n"), ("docs/adr/0001-b.md", "# x\n"), ("docs/adr/0002-two.md", "# x\n")],
            "claimed by more than one file",
        ),
        (
            "gaps",
            [("docs/adr/0001-one.md", "# x\n"), ("docs/adr/0003-three.md", "# x\n")],
            "numbering gap",
        ),
        (
            "status-token",
            [("docs/adr/0001-one.md", "---\nstatus: accepted-ish\n---\n\n# x\n")],
            "status must be one of",
        ),
        (
            "dangling-replacement",
            [("docs/adr/0001-one.md", "---\nstatus: superseded by ADR-0009\n---\n\n# x\n")],
            "no such ADR",
        ),
        (
            "one-way-old-marked",
            [
                ("docs/adr/0001-one.md", "---\nstatus: superseded by ADR-0002\n---\n\n# x\n"),
                ("docs/adr/0002-two.md", "# Two\n\nFresh decision, old never mentioned.\n"),
            ],
            "does not say `Supersedes",
        ),
        (
            "one-way-new-marked",
            [
                ("docs/adr/0001-one.md", "# One\n\nOld decision, status never updated.\n"),
                ("docs/adr/0002-two.md", "# Two\n\nSupersedes ADR-0001.\n"),
            ],
            "set `status: superseded by",
        ),
    ]
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        for rel, body in healthy:
            p = root / rel
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(body, encoding="utf-8")
        findings: list[str] = []
        for d in adr_dirs(root):
            check_dir(root, d, findings)
        if findings:
            print(f"check-adrs selftest: FAILED — healthy fixture has findings: {findings}")
            return 1
    for label, files, needle in specimens:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for rel, body in files:
                p = root / rel
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text(body, encoding="utf-8")
            findings = []
            for d in adr_dirs(root):
                check_dir(root, d, findings)
            if not any(needle in f for f in findings):
                print(f"check-adrs selftest: FAILED — specimen `{label}` did not produce `{needle}` (got: {findings})")
                return 1
    print(f"check-adrs selftest: healthy fixture passes, {len(specimens)} specimens fail as designed")
    return 0


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Mechanical ADR hygiene check (see module docstring)")
    ap.add_argument("root", nargs="?", default=".", help="repo root to scan (default: CWD)")
    ap.add_argument("--selftest", action="store_true", help="prove each check fails on its specimen")
    args = ap.parse_args(argv)
    if args.selftest:
        return selftest()
    return run(Path(args.root).resolve())


if __name__ == "__main__":
    sys.exit(main())
