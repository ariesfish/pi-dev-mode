# gates/ — SDLC 账本门(P5,opt-in)

账本 = 目标项目里的 `.dev/lifecycle/`,**目录在场即开启,不在场即关闭**——关闭时一切技能照旧(P1-P4 行为,零副作用;P5 验收档见 git history)。`gate.sh` 零依赖(bash + python3),从目标项目根运行。

## 门的两类(规范源即本文件;技能侧条款见各 SKILL.md 的 Ledger 节,接入表见文末)

- **D 类(脚本门)**:可判定命令直接判定——tdd 绿、check 类验收标准、CONSTRAINTS 门槛。每跑一次入一行 history(argv+dir+exit 可重放)。
- **A 类(裁决门)**:独立裁决 verdict 文件(`.dev/audit/evidence/review-<slug>/verdict.json` 形态)——入账只记 sha256 + 解析出的 verdict;重放 = 复核哈希。

## 返工预算(item 级,防无人值守自旋)

- 同一 item 内,`run` FAIL / `verdict` FAIL(BLOCKED 同)按**同门连续**计数;达到预算(默认 3,`open --budget N` 可调)→ `state.blocked` 写结构化原因,当次退出 **4**,此后该 item 的 `run`/`verdict`/`close` 一律 exit 4 拒绝。
- 解除只有一条路:`gate.sh resume <id> --note "<人写的理由>"`(note 必填,入 history,计数清零)。PASS(命令绿 / PASS 类裁决)也清零计数。
- blocked 是 **item 级**——同一 ticket 整票停,防相邻门绕道;其他 ticket 不受影响。`show`/`replay`/`mine` 只读,blocked 时照常可用。

## CLI

```
gates/gate.sh open <票号> "<标题>" [--budget N]   # 开账本(.dev/lifecycle/ 由此建立)+ 开票;幂等,重开=复用
gates/gate.sh run <票号> <门名> -d <dir> -- <cmd...>   # D 类门:tdd/check/repro/land...
gates/gate.sh verdict <票号> --from <verdict.json>     # A 类门:裁决入账(PASS/PASS+NOTES→0,FAIL/BLOCKED→1)
gates/gate.sh resume <票号> --note "<理由>"            # 人解除 blocked(必填理由),清零计数
gates/gate.sh close <票号> --note "<理由>"             # 关票(blocked 时拒绝)
gates/gate.sh show <票号>     # 看状态(blocked 时可用)
gates/gate.sh replay <票号>   # 只读重放:重跑 D 类 + 复哈希 A 类,报漂移
gates/gate.sh mine            # retro 三率之两率:D 门首过率 + A 裁决翻转数 + blocked 数
```

退出码:**0 = 门过;1 = 门败(裁决 FAIL 同);4 = BLOCKED(预算熔断或 blocked 拒绝);2 = 拒绝(无账本/用法错);3 = 缺 python3**。implement/implement-all 把 exit 4 当机器 stop-condition。关闭账本时所有命令拒绝且不触碰任何目标仓文件——技能一律把它当"无账本,走 P1-P4 原行为"。

自检杠杆:`bash scripts/test-gates.sh`(T-001 起;预算/幂等/拒绝语义全断言,green 才许上线)。

## state.json(history 每步可重放)

`gates` = 每门当前态(`class/pass/runs/first_pass/fails` 或 `verdict/file/sha256/fails`)、`budget` = item 预算、`blocked` = 当前熔断(gate/理由/时间);`history` = append-only 事件流——`run` 条目带全量重放要素(argv、dir、exit、pass),`verdict` 条目带文件哈希,`blocked`/`resume` 条目记录熔断与人为解除。**history 永不重写**——`replay` 是只读的。

## retro 三率(P5 item 3)

skip_test 率标准挖法(不手搓,retro 直接用):

```
awk -F'\t' 'NR>1 && $1!="id" && $6!="" && $6!="N/A" {n++} END{print "skip:", n, "/", NR-1}' .dev/audit/T-*.tsv
```

`gate.sh mine` 出 D 门首过率 + 裁决翻转(分歧)+ blocked 数;skip-test 率在 `.dev/audit/*.tsv` 的 `skip_test` 列(七列定稿),retro 技能合并三率,编码为 constraints 行或吞进 lint(correct 的最高层级修复)。

## observe 桩(P5 item 4,立桩不实现)

`.dev/lifecycle/observe/` 由 `open` 生成:部署后基线对比 + 回归自动开 intake 票——L4 尾端,**故意不实现**,桩内 README 声明格式,不承诺行为。

## 接入的技能(条件性,opt-in)

**intake → build → verify → land → 回路 全链(7 技能)**:triage-issue(`ready-for-agent` 即开票)/ tickets(出票即开票)/ implement(tdd 绿后 run tdd 门 + exit 4 停票)/ implement-all(票 open→…→close + check 门 + BLOCKED 停票)/ diagnose(repro 门:RED 在前 GREEN 在后;perf 另有 bench 门)/ review(独立裁决 verdict 入账 + merge 读回 land 门)/ retro(mine 三率 + blocked 数)。各技能内的账本条款都以 `.dev/lifecycle/` 在场为前提——不在场一字不改行为。
