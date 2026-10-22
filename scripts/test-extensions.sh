#!/usr/bin/env bash
# test-extensions.sh — pi/ 扩展模块的本地证据闸(evidence 闸,check.sh 第 6 级的执行体:
# 本地 pi 运行时 + bun 在场才执行,缺场走 check.sh 的可见 SKIP——CI 无 pi 运行时,永不静默通过)
#
# 机制:按 pi 启动器同款逻辑定位活体 pi 运行时 node_modules,生成临时 tsconfig
# (paths 把 @earendil-works/* 与 typebox 指向运行时),bun test 以
# --tsconfig-override 运行 pi/*.test.ts。零物理 node_modules 宿主副本。
set -euo pipefail
cd "$(dirname "$0")/.."

pi_launcher="$(command -v pi)" || { echo "test-extensions: pi not on PATH" >&2; exit 2; }
pi_launcher="$(readlink -f "$pi_launcher")"
agent_dir="$(dirname "$(dirname "$pi_launcher")")"
version_file="$agent_dir/install/current-version"
[ -r "$version_file" ] || { echo "test-extensions: no managed pi install at $agent_dir" >&2; exit 2; }
pi_nm="$agent_dir/install/releases/$(cat "$version_file")/node_modules"
[ -d "$pi_nm/@earendil-works" ] || { echo "test-extensions: runtime node_modules missing: $pi_nm" >&2; exit 2; }

tsconfig="$(mktemp -t pi-ext-tsconfig.XXXXXX.json)"
trap 'rm -f "$tsconfig"' EXIT
cat > "$tsconfig" <<EOF
{
  "compilerOptions": {
    "paths": {
      "@earendil-works/chord": ["./node_modules/@earendil-works/chord/dist/index.js"],
      "@earendil-works/chord/context": ["./node_modules/@earendil-works/chord/dist/context.js"],
      "@earendil-works/pi-durable": ["./node_modules/@earendil-works/pi-durable/dist/index.js"],
      "@earendil-works/pi-durable/tools": ["./node_modules/@earendil-works/pi-durable/dist/tools/index.js"],
      "@earendil-works/pi-durable/env": ["./node_modules/@earendil-works/pi-durable/dist/env/index.js"],
      "@earendil-works/pi-durable/env/node": ["./node_modules/@earendil-works/pi-durable/dist/env/node.js"],
      "@earendil-works/pi-durable/storage/memory": ["./node_modules/@earendil-works/pi-durable/dist/storage/memory/index.js"],
      "@earendil-works/pi-durable/storage/sqlite/node": ["./node_modules/@earendil-works/pi-durable/dist/storage/sqlite/node/index.js"],
      "@earendil-works/*": ["$pi_nm/@earendil-works/*"],
      "typebox": ["$pi_nm/typebox/build/index.mjs"],
      "typebox/value": ["$pi_nm/typebox/build/value/index.mjs"],
      "typebox/compile": ["$pi_nm/typebox/build/compile/index.mjs"]
    }
  }
}
EOF

echo "test-extensions: runtime=$pi_nm"
tests=()
while IFS= read -r f; do tests+=("$f"); done < <(find pi -maxdepth 2 -name "*.test.ts" | sort)
[ "${#tests[@]}" -gt 0 ] || { echo "test-extensions: no pi/*.test.ts found" >&2; exit 1; }
bun test --tsconfig-override "$tsconfig" "${tests[@]}"
