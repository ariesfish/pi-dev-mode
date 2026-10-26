#!/usr/bin/env bash
# check-types.sh — pi 扩展源码 typecheck 闸(增量执法:先闸"名字根本不存在"类)
#
# 门类:TS2304/TS2552(Cannot find name)+ TS2305/TS2459/TS2614(模块没导出这个名字)
# ——imports 缺口或导出缺口都是运行时炸弹/类型洞:
#   - 首跑即红于真实历史错误:pi/agents.ts 的 dirname/inspect 未导入
#     (pi 前台 spawn 崩溃,2026-10-22);pi/durable-models.ts 的
#     ModelTypeMap/ModelType 未入 import 清单。
#   - 2026-10-26:agents.ts 的 11 处幻影 import(导入未 export 的类型)在
#     bun 的类型擦除下绿着跑了一轮 —— 缺的正是 2305/2459 这两类。
# 其余精确化类型噪音(TS2322/TS7053/TS2540…)仅计数报告,列
# docs/CONSTRAINTS.md Measured 表为 ratchet 方向,不在本闸拦截。
# tsc 缺场(devDependencies 未安装)→ 可见 SKIP,与 pi 套件同一证据层;
# .bin 链接缺失但 typescript 包在场时走 node_modules/typescript/bin/tsc。

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

BIN=node_modules/.bin/tsc
PKG=node_modules/typescript/bin/tsc
if [ -x "$BIN" ]; then
  run_tsc() { "$BIN" --noEmit; }
elif [ -f "$PKG" ]; then
  run_tsc() { node "$PKG" --noEmit; }
else
  echo "check-types: SKIP (no local tsc — npm install once; evidence tier, docs/CONSTRAINTS.md)"
  exit 0
fi

out="$(run_tsc 2>&1 || true)"
if [ -z "$out" ]; then
  echo "check-types: OK (0 errors)"
  exit 0
fi

missing_names="$(printf '%s\n' "$out" | grep -cE "error TS(2304|2552|2305|2459|2614):" || true)"
if [ "$missing_names" -gt 0 ]; then
  printf '%s\n' "$out" | grep -E "error TS(2304|2552|2305|2459|2614):"
  echo "check-types: FAIL — 缺失名字/缺失导出类 ${missing_names} 处(imports 或 export 缺口,运行时炸弹)"
  exit 1
fi
others="$(printf '%s\n' "$out" | grep -c "error TS" || true)"
echo "check-types: PASS(缺失名字类 0;类型精确化噪音 ${others} 行 — Measured 表 ratchet 方向)"
