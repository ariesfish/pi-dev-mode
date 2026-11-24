#!/usr/bin/env python3
"""check-evidence.py — tsv 证据指针可达 + 证据目录非空(增量执法)

为什么存在:T-034(2026-10-22)证据拷贝链被前置断言失败中断,tsv 行照写、
目录为空,直到特性收尾盘点才靠 /tmp 残留抓回——"照写不照验"是这一类的
事故形状,收尾再人工盘点已经晚了一整轮。

规则(.dev/audit/ 下台账两种命名都认:`T-XXX.tsv` 旧账与 `<slug>-T-XXX.tsv`
需求限定;Append-only;--from 起的行才执法,历史行豁免):
  - evidence 列(第 5)与 show 列(第 7)里的 evidence/<path> 指针:
    .dev/audit/<指针> 必须存在;若为目录,必须非空
  - 其余 token(commit 号、URL、行内说明)不清点——本闸只对指针类执法

用法:
  python3 scripts/check-evidence.py                      # 从最早行全量
  python3 scripts/check-evidence.py --from T-031         # 旧账:数字截断,跨所有 tsv
  python3 scripts/check-evidence.py --from feature-x/T-004  # 特性收尾:只执法该特性的行
  python3 scripts/check-evidence.py --selftest           # 用 T-034 事故形状证明会红
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

TOKEN = re.compile(r"evidence/[A-Za-z0-9._/-]+")
HEADER = "id\tdecision\treason\tevidence\tverdict\tskip_test\tshow"
# 两种 tsv 名:旧账 T-034.tsv 与需求限定 feature-x-T-010.tsv(slug 取贪婪切分)
TSV_NAME = re.compile(r"^(?:(?P<slug>[A-Za-z0-9._-]+)-)?T-(?P<num>\d+)$")
FROM_ID = re.compile(r"^(?:(?P<slug>[A-Za-z0-9._-]+)/)?T-(?P<num>\d+)$")

# 历史豁免(CONSTRAINTS.md Floor：过程证据档 2026-10-22 经 owner 决定移除，
# 归档即 git history——tsv 只追加，已知断链指针按清单豁免；新断链不豁免)
KNOWN_REMOVED = {
    "evidence/maintenance/sdlc-wiring-2026-10-20.md",
}


def parse_tsv(path: Path) -> tuple[str | None, str] | None:
    m = TSV_NAME.match(path.stem)
    return (m.group("slug"), m.group("num")) if m else None


def audit_files(audit_dir: Path) -> list[tuple[Path, str | None, str]]:
    found: list[tuple[Path, str | None, str]] = []
    for path in sorted(audit_dir.glob("*.tsv")):
        parsed = parse_tsv(path)
        if parsed:
            found.append((path, parsed[0], parsed[1]))
    return found


def check_tree(audit_dir: Path, from_id: str) -> list[str]:
    failures: list[str] = []
    tsvs = audit_files(audit_dir)
    if not tsvs:
        return [f"no .dev/audit/T-*.tsv or <slug>-T-*.tsv under {audit_dir}"]
    scope = FROM_ID.match(from_id)
    from_slug = scope.group("slug") if scope else None
    from_num = int(scope.group("num")) if scope else 0
    for tsv, slug, num in tsvs:
        # A qualified --from scopes to its own namespace; a bare one keeps the
        # repo-wide numeric cutoff of the legacy ledger.
        if from_slug is not None:
            if slug != from_slug or int(num) < from_num:
                continue
        elif int(num) < from_num:
            continue
        tid = f"{slug}/T-{num}" if slug else f"T-{num}"
        for lineno, line in enumerate(tsv.read_text().splitlines(), 1):
            if lineno == 1 and line.startswith("id\t"):
                continue
            cells = line.split("\t")
            if len(cells) < 7:
                continue
            for cell in (cells[4], cells[6]):
                for tok in TOKEN.findall(cell):
                    tok = tok.rstrip("(/.,;:)")
                    if tok in KNOWN_REMOVED:
                        continue
                    target = audit_dir / tok
                    if not target.exists():
                        failures.append(f"{tid} 行{lineno}: 指针 {tok} 不存在")
                    elif target.is_dir() and not any(target.iterdir()):
                        failures.append(f"{tid} 行{lineno}: 指针 {tok} 是空目录(T-034 事故形状)")
    return failures


def selftest() -> int:
    tmp = Path(tempfile.mkdtemp(prefix="check-evidence-selftest-"))
    try:
        audit = tmp / ".dev" / "audit"
        evidence = audit / "evidence" / "design-core" / "t034"
        evidence.mkdir(parents=True)  # 空目录 — T-034 事故形状
        ok_dir = audit / "evidence" / "design-core" / "t031"
        ok_dir.mkdir(parents=True)
        (ok_dir / "DESIGN.md").write_text("x")
        ns_ok_dir = audit / "evidence" / "feature-x" / "t004"
        ns_ok_dir.mkdir(parents=True)
        (ns_ok_dir / "DESIGN.md").write_text("x")
        row_bad = "T-034\tdemo\tRED 拷贝链断\tevidence/design-core/t034/(断链)\tgreen\t—\tevidence/design-core/t034/\n"
        row_good = "T-031\t骨架\t—\tevidence/design-core/t031/DESIGN.md\tgreen\t—\t—\n"
        row_ns_good = "T-004\t骨架\t—\tevidence/feature-x/t004/DESIGN.md\tgreen\t—\t—\n"
        row_ns_bad = "T-010\t拼接\t断链\t—\tevidence/feature-y/t010/gone.md\tgreen\t—\n"
        (audit / "T-034.tsv").write_text(HEADER + "\n" + row_bad)
        (audit / "T-031.tsv").write_text(HEADER + "\n" + row_good)
        (audit / "feature-x-T-004.tsv").write_text(HEADER + "\n" + row_ns_good)
        (audit / "feature-y-T-010.tsv").write_text(HEADER + "\n" + row_ns_bad)
        failures = check_tree(audit, "T-000")
        if not any("空目录" in f for f in failures):
            print("selftest: FAIL — 检查器未在 T-034 事故形状上翻红")
            return 1
        if any(f.startswith("T-031 ") for f in failures):
            print("selftest: FAIL — 正常指针被误报")
            return 1
        if not any(f.startswith("feature-y/T-010 ") and "不存在" in f for f in failures):
            print("selftest: FAIL — <slug>-T-XXX.tsv 的断链未被执法")
            return 1
        if any(f.startswith("feature-x/T-004") for f in failures):
            print("selftest: FAIL — 限定名的正常指针被误报")
            return 1
        if check_tree(audit, "feature-x/T-005"):
            print("selftest: FAIL — 限定 --from 越界执法了更早的行或别的特性")
            return 1
        if not check_tree(audit, "feature-y/T-010"):
            print("selftest: FAIL — 限定 --from 漏掉了本特性该票的断链")
            return 1
        print("selftest: PASS — T-034 空目录形状与 <slug>-T-XXX 断链翻红,限定 --from 只扫本特性")
        return 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main() -> int:
    ap = argparse.ArgumentParser(description="tsv evidence pointers: reachable and non-empty")
    ap.add_argument("--from", dest="from_id", default="T-000", help="first ticket to enforce: T-XXX (numeric cutoff) or <slug>/T-XXX (that feature only)")
    ap.add_argument("--selftest", action="store_true", help="prove the T-034 shape turns red")
    args = ap.parse_args()
    if args.selftest:
        return selftest()
    from_id = args.from_id
    root = Path(__file__).resolve().parent.parent
    audit_dir = root / ".dev" / "audit"
    if not audit_dir.is_dir():
        print(f"check-evidence: no .dev/audit/ under {root} — nothing to check, exit 0")
        return 0
    # A directory without decision rows is not a broken ledger: `.dev/audit/`
    # also hosts evidence for review runs and audit reports. Only rows make a
    # claim, and only claims have pointers to verify (T-034).
    if not audit_files(audit_dir):
        print(f"check-evidence: no .dev/audit/T-*.tsv or <slug>-T-*.tsv under {root} — no rows to check, exit 0")
        return 0
    failures = check_tree(audit_dir, from_id)
    if failures:
        for f in failures:
            print(f"check-evidence: FAIL — {f}")
        return 1
    print(f"check-evidence: PASS — {from_id} 起的 tsv 指针全可达、证据目录非空")
    return 0


if __name__ == "__main__":
    sys.exit(main())
