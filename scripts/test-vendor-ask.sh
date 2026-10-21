#!/usr/bin/env bash
# test-vendor-ask.sh — pi/vendor/pi-ask-user 的测试闸(evidence 闸,不进 check.sh:CI 无 pi 运行时)
#
# 机制:按 pi 启动器同款逻辑定位活体 pi 运行时 node_modules,生成临时 tsconfig
# (paths 把 @earendil-works/* 与 @sinclair/typebox 指向运行时),bun test 以
# --tsconfig-override 运行。零物理 node_modules 副本。
set -euo pipefail
cd "$(dirname "$0")/.."

pi_launcher="$(command -v pi)" || { echo "test-vendor-ask: pi not on PATH" >&2; exit 2; }
pi_launcher="$(readlink -f "$pi_launcher")"
agent_dir="$(dirname "$(dirname "$pi_launcher")")"
version_file="$agent_dir/install/current-version"
[ -r "$version_file" ] || { echo "test-vendor-ask: no managed pi install at $agent_dir" >&2; exit 2; }
pi_nm="$agent_dir/install/releases/$(cat "$version_file")/node_modules"
[ -d "$pi_nm/@earendil-works" ] || { echo "test-vendor-ask: runtime node_modules missing: $pi_nm" >&2; exit 2; }

tsconfig="$(mktemp -t pi-vendor-ask-tsconfig.XXXXXX.json)"
trap 'rm -f "$tsconfig"' EXIT
cat > "$tsconfig" <<EOF
{
  "compilerOptions": {
    "paths": {
      "@earendil-works/*": ["$pi_nm/@earendil-works/*"],
      "@sinclair/typebox": ["$pi_nm/typebox"]
    }
  }
}
EOF

echo "test-vendor-ask: runtime=$pi_nm"
bun test --tsconfig-override "$tsconfig" pi/vendor/pi-ask-user/
