#!/usr/bin/env bash
# test-extensions.sh — pi/ 扩展模块的本地证据闸(evidence 闸,不进 check.sh:CI 无 pi 运行时)
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
