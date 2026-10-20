#!/usr/bin/env python3
"""check-prose.py — prose lint for living docs (T-008, the deslop equivalent).

Enforces the reply contract's prose discipline on the repo's own prose
surfaces with a bilingual slop blacklist: filler, empty summaries, and
unlabeled hedging. Every pattern carries its why and a canonical specimen
the --selftest proves it fails on (correct's "prove each check fails on a
real specimen" rule).

Enforcement is INCREMENTAL by default (correct's legacy rule: a pattern
already common only fails when a change adds more): default mode checks
added lines only — vs HEAD locally (working tree), vs HEAD~1 on a CI push,
vs the PR base ref in CI. --all checks every line of every surface (the
ratchet audit; only run it when you intend to fix the baseline).

Surfaces (living prose): skills/*/SKILL.md, README.md, gates/README.md,
docs/<digit>*.md at docs root. Frozen records (docs/evidence/**) and
ported material (references/**) are out of scope by default.

Exit: 0 clean · 1 slop found · 2 usage. Stdlib only.
"""

from __future__ import annotations

import argparse
import fnmatch
import os
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

# id, regex, why, specimen-that-must-fail
PATTERNS = [
    ("e-empty-summary", re.compile(r"\b(in conclusion|to sum up|to summarize)\b", re.I),
     "empty summary opener — the summary says nothing the body didn't",
     "In conclusion, the system works."),
    ("e-worth-noting", re.compile(r"\bit(?:['\u2019]s| is) worth noting\b", re.I),
     "throat-clearing hedge — state the fact or label real uncertainty",
     "It's worth noting that this may fail."),
    ("e-needless", re.compile(r"\bneedless to say\b", re.I),
     "if it needs saying, say it; if not, the line is filler",
     "Needless to say, tests matter."),
    ("e-honest", re.compile(r"\bto be honest\b", re.I),
     "confessional filler — adds no information",
     "To be honest, this was tricky."),
    ("e-seems", re.compile(r"\bit seems like\b", re.I),
     "unlabeled hedge — conclude, or mark measured/inferred/guess",
     "It seems like this is slow."),
    ("e-simply-put", re.compile(r"\bsimply put\b", re.I),
     "narration filler before the actual point",
     "Simply put, the cache wins."),
    ("e-as-we-all-know", re.compile(r"\b(as we all know|everybody knows)\b", re.I),
     "appeal to common knowledge — evidence or drop it",
     "As we all know, lint is good."),
    ("e-at-the-end", re.compile(r"\bat the end of the day\b", re.I),
     "rhetorical summary phrase — the finding should stand without it",
     "At the end of the day, it shipped."),
    ("e-humble", re.compile(r"\b(in my humble opinion|imho)\b", re.I),
     "humility performance — judgment with reasons, or nothing",
     "IMHO this is fine."),
    ("z-empty-summary", re.compile(r"(综上所述|总而言之)"),
     "空总结开场——正文没说的话总结里也不会有",
     "综上所述,本轮改动完成。"),
    ("z-known-all", re.compile(r"众所周知"),
     "诉诸常识——要么给证据要么删",
     "众所周知,测试很重要。"),
    ("z-worth-mention", re.compile(r"(值得一提的是|值得注意的是)"),
     "清嗓式对冲——直接给事实,或标注 measured/inferred/guess",
     "值得注意的是,这个流程可能很慢。"),
    ("z-obvious", re.compile(r"(不难看出|显而易见)"),
     "伪推理连接词——推理写出来,读者自己会看出",
     "不难看出,方案 A 更好。"),
]

FROZEN_EXCUSES: dict[str, str] = {}


def is_surface(p: str) -> bool:
    if p in ("README.md", "gates/README.md"):
        return True
    if fnmatch.fnmatch(p, "skills/*/SKILL.md"):
        return True
    m = re.match(r"^docs/([^/]+)$", p)
    if m and p.endswith(".md") and m.group(1)[0].isdigit():
        return True
    return False


def lint_lines(lines: list[tuple[int, str]]) -> list[str]:
    hits = []
    for lineno, text in lines:
        for pid, rx, why, _spec in PATTERNS:
            m = rx.search(text)
            if m:
                hits.append(f"{lineno}: [{pid}] {m.group(0)!r} — {why}")
    return hits


def full_surfaces() -> dict[str, list[tuple[int, str]]]:
    out: dict[str, list[tuple[int, str]]] = {}
    for root in ("skills", "docs", "gates", "references"):
        base = REPO / root
        if not base.is_dir():
            continue
        for f in base.rglob("*.md"):
            rel = f.relative_to(REPO).as_posix()
            if is_surface(rel):
                out[rel] = [
                    (i, line) for i, line in enumerate(
                        f.read_text(encoding="utf-8").splitlines(), start=1)
                ]
    top = REPO / "README.md"
    if top.exists():
        out["README.md"] = [
            (i, line) for i, line in enumerate(top.read_text(encoding="utf-8").splitlines(), start=1)
        ]
    return out


def added_lines(base: str) -> dict[str, list[tuple[int, str]]]:
    out: dict[str, list[tuple[int, str]]] = {}
    proc = subprocess.run(
        ["git", "diff", "-U0", base, "--"], cwd=REPO, capture_output=True, text=True
    )
    current: str | None = None
    lineno = 0
    for line in proc.stdout.splitlines():
        if line.startswith("+++ b/"):
            current = line[6:]
        elif line.startswith("@@"):
            m = re.search(r"\+(\d+)", line)
            lineno = int(m.group(1)) - 1 if m else 0
        elif line.startswith("+") and current is not None:
            lineno += 1
            out.setdefault(current, []).append((lineno, line[1:]))
    # untracked files are all added lines
    ls = subprocess.run(
        ["git", "ls-files", "--others", "--exclude-standard"],
        cwd=REPO, capture_output=True, text=True,
    )
    for f in ls.stdout.splitlines():
        if is_surface(f):
            text = (REPO / f).read_text(encoding="utf-8").splitlines()
            out[f] = [(i, line) for i, line in enumerate(text, start=1)]
    return {f: ls for f, ls in out.items() if is_surface(f)}


def default_base() -> str:
    if os.environ.get("GITHUB_ACTIONS") == "true":
        if os.environ.get("GITHUB_EVENT_NAME") == "pull_request":
            return "origin/" + os.environ.get("GITHUB_BASE_REF", "main")
        return "HEAD~1"
    return "HEAD"


def selftest() -> int:
    clean = [
        "The check runs at task end and in CI.",
        "每个论断同句携带证据或标签:measured / inferred / guess。",
        "Exit 0 = green, exit 1 = FAIL.",
    ]
    bad = 0
    for pid, rx, why, spec in PATTERNS:
        if not rx.search(spec):
            print(f"selftest FAIL: [{pid}] does not match its own specimen: {spec}")
            bad += 1
        for c in clean:
            if rx.search(c):
                print(f"selftest FAIL: [{pid}] false-positives on clean line: {c}")
                bad += 1
    if bad:
        print(f"selftest: {bad} pattern(s) broken")
        return 1
    print(f"selftest: {len(PATTERNS)} patterns each fail on their specimen, clean lines pass")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="prose lint (deslop) for living doc surfaces")
    mode = ap.add_mutually_exclusive_group()
    mode.add_argument("--all", action="store_true", help="check every line of every surface (baseline audit)")
    mode.add_argument("--selftest", action="store_true", help="prove each pattern fails on its specimen")
    ap.add_argument("--base", help=f"diff base for incremental mode (default: {default_base()!r})")
    args = ap.parse_args()

    if args.selftest:
        return selftest()

    base = args.base or default_base()
    surfaces = full_surfaces() if args.all else added_lines(base)
    scope = "all lines (--all)" if args.all else f"added lines vs {base}"
    total = 0
    for f in sorted(surfaces):
        hits = lint_lines(surfaces[f])
        for h in hits:
            print(f"{f}:{h}")
        total += len(hits)
    print(f"check-prose: {total} slop hit(s), {len(surfaces)} surface file(s), {scope}")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())
