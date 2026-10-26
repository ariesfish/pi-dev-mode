#!/usr/bin/env python3
"""check-replay.py — 重放函数必须在 pi/*.test.ts 里被引用。

为什么存在:T-042 的重复投递来自 AgentRunner.restore 按"第一条记录"重放
历史。当时 pi/agents.test.ts 已经存在,但它只喂了一条结束记录——真实历史
(running → completed → delivered)没人测,靠 user 三次 /reload 才发现。

本闸不做语义判断,只钉住最低门槛:pi/ 里名字以 restore / reattach / replay
开头的函数,必须在某个测试文件里被引用。删掉那个测试,闸立刻红。

语义那一半在 docs/CONSTRAINTS.md 的 Floor 里,靠人守:从持久化历史重建状态
一律按 last-write-per-id 归约,回归用例必须灌真实的多记录历史。

用法: python3 scripts/check-replay.py
退出: 0 全部有引用 · 1 有缺口
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SOURCE = REPO / "pi"

# 方法定义:可选修饰符 + 重放类函数名 + 括号(调用点前面是 `.`,不会命中)
DEFINITION = re.compile(
    r"^\s+(?:(?:public|private|protected|static|async|readonly)\s+)*"
    r"(restore|reattach|replay[A-Za-z]*)"
    r"\s*\(",
)


def definitions() -> list[tuple[str, str, int]]:
    found: list[tuple[str, str, int]] = []
    for path in sorted(SOURCE.glob("*.ts")):
        if path.name.endswith(".test.ts"):
            continue
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            match = DEFINITION.match(line)
            if match:
                found.append((path.name, match.group(1), number))
    return found


def main() -> int:
    tests = {path.name: path.read_text(encoding="utf-8") for path in sorted(SOURCE.glob("*.test.ts"))}
    missing: list[str] = []
    for source, name, line in definitions():
        users = [test for test, body in tests.items() if re.search(rf"\b{name}\s*\(", body)]
        if users:
            print(f"check-replay: OK  pi/{source}:{line} {name}() -> {', '.join(users)}")
        else:
            print(f"check-replay: MISSING  pi/{source}:{line} {name}() has no test reference", file=sys.stderr)
            missing.append(name)

    if missing:
        print(
            "check-replay: FAIL — 重放函数没有回归测试引用:"
            f" {', '.join(missing)}。测试要灌真实的多记录历史,不是单条记录。",
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
