#!/usr/bin/env python3
"""check-evidence.py — tsv 证据指针可达 + 证据目录非空(增量执法)

为什么存在:T-034(2026-10-22)证据拷贝链被前置断言失败中断,tsv 行照写、
目录为空,直到特性收尾盘点才靠 /tmp 残留抓回——"照写不照验"是这一类的
事故形状,收尾再人工盘点已经晚了一整轮。

规则(.dev/audit/<T-ID>.tsv,Append-only;--from 起的行才执法,历史行豁免):
  - evidence 列(第 5)与 show 列(第 7)里的 evidence/<path> 指针:
    .dev/audit/<指针> 必须存在;若为目录,必须非空
  - 其余 token(commit 号、URL、行内说明)不清点——本闸只对指针类执法

用法:
  python3 scripts/check-evidence.py                      # 从最早行全量
  python3 scripts/check-evidence.py --from T-031         # 特性收尾:本特性首票起
  python3 scripts/check-evidence.py --selftest           # 用 T-034 事故形状证明会红
"""

from __future__ import annotations

import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

TOKEN = re.compile(r"evidence/[A-Za-z0-9._/-]+")
HEADER = "id\tdecision\treason\tevidence\tverdict\tskip_test\tshow"

# 历史豁免(CONSTRAINTS.md Floor：过程证据档 2026-10-22 经 owner 决定移除，
# 归档即 git history——tsv 只追加，已知断链指针按清单豁免；新断链不豁免)
KNOWN_REMOVED = {
    "evidence/maintenance/sdlc-wiring-2026-10-20.md",
}


def ordered(tid: str) -> int:
    m = re.match(r"T-(\d+)", tid)
    return int(m.group(1)) if m else 0


def check_tree(audit_dir: Path, from_id: str) -> list[str]:
    failures: list[str] = []
    tsvs = sorted(audit_dir.glob("T-*.tsv"))
    if not tsvs:
        return [f"no .dev/audit/T-*.tsv under {audit_dir}"]
    for tsv in tsvs:
        tid = tsv.stem
        if ordered(tid) < ordered(from_id):
            continue
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
        row_bad = "T-034\tdemo\tRED 拷贝链断\tevidence/design-core/t034/(断链)\tgreen\t—\tevidence/design-core/t034/\n"
        row_good = "T-031\t骨架\t—\tevidence/design-core/t031/DESIGN.md\tgreen\t—\t—\n"
        (audit / "T-034.tsv").write_text(HEADER + "\n" + row_bad)
        (audit / "T-031.tsv").write_text(HEADER + "\n" + row_good)
        failures = check_tree(audit, "T-000")
        expected = {"T-034 空目录"}
        if len(failures) < 1 or "空目录" not in failures[0]:
            print("selftest: FAIL — 检查器未在 T-034 事故形状上翻红")
            return 1
        if any("T-031" in f for f in failures):
            print("selftest: FAIL — 正常指针被误报")
            return 1
        print("selftest: PASS — T-034 空目录形状翻红,正常指针零误报")
        return 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main() -> int:
    args = sys.argv[1:]
    if "--selftest" in args:
        return selftest()
    from_id = "T-000"
    if "--from" in args:
        from_id = args[args.index("--from") + 1]
    root = Path(__file__).resolve().parent.parent
    audit_dir = root / ".dev" / "audit"
    if not audit_dir.is_dir():
        print(f"check-evidence: no .dev/audit/ under {root} — nothing to check, exit 0")
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
