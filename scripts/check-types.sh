#!/usr/bin/env bash
# check-types.sh — pi 扩展源码 typecheck 闸(增量执法:先闸"未定义标识符"类)
#
# 门类:TS2304/TS2552(Cannot find name)—— imports 缺口即运行时炸弹。
# 首跑即红于真实历史错误:pi/agents.ts 的 dirname/inspect 未导入
# (pi 前台 spawn 崩溃,2026-10-22);pi/durable-models.ts 的
# ModelTypeMap/ModelType 未入 import 清单。
# 其余精确化类型噪音(TS2322/TS7053/TS2540…)仅计数报告,列
# docs/CONSTRAINTS.md Measured 表为 ratchet 方向,不在本闸拦截。
# tsc 缺场(devDependencies 未安装)→ 可见 SKIP,与 pi 套件同一证据层。

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

TSC=node_modules/.bin/tsc
if [ ! -x "$TSC" ]; then
  echo "check-types: SKIP (no local tsc — npm install once; evidence tier, docs/CONSTRAINTS.md)"
  exit 0
fi

out="$("$TSC" --noEmit 2>&1 || true)"
if [ -z "$out" ]; then
  echo "check-types: OK (0 errors)"
  exit 0
fi

undefined_names="$(printf '%s\n' "$out" | grep -cE "error TS(2304|2552):" || true)"
if [ "$undefined_names" -gt 0 ]; then
  printf '%s\n' "$out" | grep -E "error TS(2304|2552):"
  echo "check-types: FAIL — 未定义标识符类 ${undefined_names} 处(imports 缺口,运行时炸弹)"
  exit 1
fi
others="$(printf '%s\n' "$out" | grep -c "error TS" || true)"
echo "check-types: PASS(未定义标识符类 0;类型精确化噪音 ${others} 行 — Measured 表 ratchet 方向)"
