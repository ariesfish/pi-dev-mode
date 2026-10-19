# gates/ — SDLC 账本门(P5,opt-in)

账本 = 目标项目里的 `.dev/lifecycle/`,**目录在场即开启,不在场即关闭**——关闭时一切技能照旧(P1-P4 行为,零副作用,验收见 docs/evidence/p5/)。`gate.sh` 零依赖(bash + python3),从目标项目根运行。

## 门的两类(docs/04 P5;源设计稿 `../sdlc-unified-design.md` 已不在盘,以此节与 docs/01 §10 为准)

- **D 类(脚本门)**:可判定命令直接判定——tdd 绿、check 类验收标准、CONSTRAINTS 门槛。每跑一次入一行 history(argv+dir+exit 可重放)。
- **A 类(裁决门)**:独立裁决 verdict 文件(`.dev/audit/evidence/review-<sha>/verdict.json` 形态)——入账只记 sha256 + 解析出的 verdict;重放 = 复核哈希。

## CLI

```
gates/gate.sh open <票号> "<标题>"              # 开账本(.dev/lifecycle/ 由此建立)+ 开票
gates/gate.sh run <票号> <门名> -d <dir> -- <cmd...>   # D 类门:tdd/check/constraints...
gates/gate.sh verdict <票号> --from <verdict.json>     # A 类门:裁决入账
gates/gate.sh close <票号> --note "<理由>"             # 关票
gates/gate.sh show <票号>   # 看状态
gates/gate.sh replay <票号> # 只读重放:重跑 D 类 + 复哈希 A 类,报漂移
gates/gate.sh mine          # retro 三率之两率:D 门首过率 + A 裁决翻转数
```

退出码：0 = 门过；1 = 门败（replay 漂移同）；**非零拒绝（1/2，统一视为“无账本/用法错”）**；3 = 缺 python3。关闭账本时所有命令拒绝且不触碰任何目标仓文件——技能一律把它当“无账本，走 P1-P4 原行为”。

## state.json(history 每步可重放)

`gates` = 每门当前态(`class/pass/runs/first_pass` 或 `verdict/file/sha256`);`history` = append-only 事件流,`run` 条目带全量重放要素(argv、dir、exit、pass),`verdict` 条目带文件哈希。**history 永不重写**——`replay` 是只读的。

## retro 三率(P5 item 3)

skip_test 率标准挖法(不手搓,retro 直接用):

```
awk -F'\t' 'NR>1 && $1!="id" && $6!="" && $6!="N/A" {n++} END{print "skip:", n, "/", NR-1}' .dev/audit/T-*.tsv
```

`gate.sh mine` 出 D 门首过率 + 裁决翻转(分歧);skip-test 率在 `.dev/audit/*.tsv` 的 `skip_test` 列(七列定稿),retro 技能合并三率,编码为 constraints 行或吞进 lint(correct 的最高层级修复)。

## observe 桩(P5 item 4,立桩不实现)

`.dev/lifecycle/observe/` 由 `open` 生成:部署后基线对比 + 回归自动开 intake 票——L4 尾端,**故意不实现**,桩内 README 声明格式,不承诺行为。

## 接入的技能(条件性,opt-in)

implement(tdd 绿后 run tdd 门)/ implement-all(票 open→…→close + check 门)/ review(独立裁决 verdict 入账)/ retro(mine 三率)。各技能内的账本条款都以 `.dev/lifecycle/` 在场为前提——不在场一字不改行为。
