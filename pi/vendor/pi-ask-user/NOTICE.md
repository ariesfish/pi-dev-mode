# NOTICE

`pi/vendor/pi-ask-user/` 下的源码移植自 edlsh/pi-ask-user @0.17.0(MIT,LICENSE 随行,上游仓库 https://github.com/edlsh/pi-ask-user)。

- 移植日期:2026-10-21;自移植日起独立维护,不再跟踪上游。
- 改动记录于本仓 git log;后续对本目录的一切修改由本仓负责。
- 测试解析:scripts/test-vendor-ask.sh 在测试时把 `@earendil-works/*` 与
  `@sinclair/typebox` 映射到本机活体 pi 运行时,物理 node_modules 副本为零
  (宿主包不得进 dependencies 的 pi 规则)。
