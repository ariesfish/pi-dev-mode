#!/usr/bin/env python3
"""check-replay.py — 重放函数必须在 pi 的测试里被真实调用过。

为什么存在:T-042 的重复投递来自 AgentRunner.restore 按"第一条记录"重放
历史。当时 pi/agents.test.ts 已经存在,但它只喂了一条结束记录——真实历史
(running → completed → delivered)没人测,靠 user 三次 /reload 才发现。

本闸钉两件事:
  1. 覆盖:pi/ 里名字以 restore / reattach / replay 开头的函数,必须出现在
     某个测试文件里(定义或调用);
  2. 真的调用:至少有一处调用点在 `test(...)` / `it(...)` 的体内——测试文件
     里的一句注释、一个 describe 标题、或函数定义本身都不算(2026-10-26
     审计:旧正则只查 `name(`,`"ask ids are stable"` 那样的空测试能通过)。

文件集合与 scripts/test-extensions.sh 的收集规则一致(`pi/` 下深度 ≤2 的
*.test.ts),所以子目录里的测试既会被 bun 跑到,也会被本闸看见。

语义那一半在 docs/CONSTRAINTS.md 的 Floor 里,靠人守:从持久化历史重建状态
一律按 last-write-per-id 归约,回归用例必须灌真实的多记录历史。

用法: python3 scripts/check-replay.py
退出: 0 全部有真实调用 · 1 有缺口
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SOURCE = REPO / "pi"
# Same collection as the bun invocation in test-extensions.sh.
TESTS = sorted(SOURCE.glob("*.test.ts")) + sorted(SOURCE.glob("*/*.test.ts"))

# Method definition: optional modifiers + a replay-shaped name + the paren.
DEFINITION = re.compile(
    r"^\s+(?:(?:public|private|protected|static|async|readonly)\s+)*"
    r"(restore|reattach|replay[A-Za-z]*)"
    r"\s*\(",
)
# A call site anywhere (definition or invocation — refined by the body check below).
CALL = r"\b{}\s*\("
# A test body opening: test("…", () => { / it("…", async () => { / test.skip(…)
TEST_OPEN = re.compile(r"\b(?:test|it)(?:\.\w+)*\s*\(\s*[\"'`]")


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


def strip_comments(text: str) -> str:
    """Drop comments: a mention in a comment is not a call.

    The 2026-10-26 audit's specimen was a test whose only `restore(` occurrence
    sat in a comment — the gate passed a file that never called it.
    """
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    return re.sub(r"(?m)//.*$", "", text)


def test_bodies(text: str) -> list[str]:
    """The text inside each test(...)/it(...) body.

    Braces are counted from the opening `{` of the callback, so `describe`
    titles, comments above the block, and helper definitions outside a test
    are not part of any body.
    """
    bodies: list[str] = []
    for match in TEST_OPEN.finditer(text):
        depth = 0
        start = text.find("{", match.end())
        if start == -1:
            continue
        i = start
        while i < len(text):
            char = text[i]
            if char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    bodies.append(text[start + 1 : i])
                    break
            i += 1
    return bodies


def main() -> int:
    if "--selftest" in sys.argv[1:]:
        return selftest()
    tests = {
        path.relative_to(SOURCE).as_posix(): strip_comments(path.read_text(encoding="utf-8"))
        for path in TESTS
    }
    bodies = {name: test_bodies(text) for name, text in tests.items()}

    missing: list[str] = []
    for source, name, line in definitions():
        pattern = re.compile(CALL.format(re.escape(name)))
        referenced = [test for test, text in tests.items() if pattern.search(text)]
        called = [test for test, chunks in bodies.items() if any(pattern.search(chunk) for chunk in chunks)]
        if called:
            print(f"check-replay: OK  pi/{source}:{line} {name}() -> {', '.join(called)}")
        elif referenced:
            print(
                f"check-replay: MISSING  pi/{source}:{line} {name}() appears in "
                f"{', '.join(referenced)} but never inside a test(...) body",
                file=sys.stderr,
            )
            missing.append(name)
        else:
            print(
                f"check-replay: MISSING  pi/{source}:{line} {name}() has no test reference",
                file=sys.stderr,
            )
            missing.append(name)

    if missing:
        print(
            "check-replay: FAIL — 重放函数没有回归测试调用:"
            f" {', '.join(missing)}。测试要灌真实的多记录历史,不是单条记录。",
            file=sys.stderr,
        )
        return 1
    return 0


def selftest() -> int:
    """Both 2026-10-26 shapes must go red: a comment-only mention, and a call
    that sits in a module-scope helper instead of a test body."""
    text = """
// restore() is mentioned in a comment only
describe("restore", () => {
  test("mentions it", () => {
    // runner.restore([]) would go here
    expect(1).toBe(1);
  });
});
function drill(runner) { runner.replayAll([]); }
"""
    cleaned = strip_comments(text)
    bodies = test_bodies(cleaned)
    checks = {
        "comment-only mention is not a call": not any(re.search(r"\brestore\s*\(", chunk) for chunk in bodies),
        "module-scope call is outside every body": not any(re.search(r"\breplayAll\s*\(", chunk) for chunk in bodies),
        "a real call inside a body is seen": any(
            re.search(r"\brestore\s*\(", chunk)
            for chunk in test_bodies('test("x", () => { runner.restore([]); });')
        ),
    }
    broken = [name for name, ok in checks.items() if not ok]
    if broken:
        print(f"check-replay selftest: FAIL — {', '.join(broken)}")
        return 1
    print(f"check-replay selftest: PASS — {len(checks)} specimens behave as designed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
