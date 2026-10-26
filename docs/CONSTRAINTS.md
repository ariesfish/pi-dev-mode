# Constraints

Last reviewed: 2026-10-26 by the review-gate round (quantitative gate: CRAP / duplication / mutation measured in `python/`, evidence required per verdict, adapters resolve their own browser). Previous round: attention-notify (T-041/T-042: pi suite 120/11 -> 158/14, tsc noise 45 -> 43, replay-coverage gate added). Dimensions and block/warn numbers are stated as defaults, adjustable via an Exceptions row.

本仓是技能/文档栈:没有产品运行时,质量维度全部落在**检查可执行**上。规则↔enforcement 配对(每条规则都有执行者):每行命令 = 本地与 CI 同一条(`scripts/check.sh`)。

## Floor (always enforced, no setup required)

- 任何检查不得为了让改动通过而被削弱、删除或绕过——包括本文件(diff watch)
- 账本 history 只追加:gates 裁决账本与 `.dev/audit/` 不得改写或删除(过程证据档已于 2026-10-22 经 owner 决定移除,归档即 git history)
- 新增 prose 行零 slop(13 条双语黑名单,check-prose 增量执法;存量不拦、增量拦)
- 技能/文档改动必须有 `bash scripts/check.sh` 全绿才 commit
- 源码无 secrets
- 从持久化历史重建状态(restore/reattach/replay*)一律按 last-write-per-id 归约;回归用例必须灌真实多记录历史,单条记录不算(T-042:三次 /reload 才暴露的重复投递)
- 裁决里的每个数字都要能指到 `.dev/audit/evidence/` 下的文件;指不到的数字不上裁决

## Enforced with numbers

| Dimension | Rule | Checked by | Runs at |
|-----------|------|-----------|---------|
| Skill-tree integrity | frontmatter/H1/交叉引用/指针 lint exit 0 | `python3 scripts/check-skills.py` | task end + CI(check.sh) |
| Gates semantics | test-gates 全断言绿(当前 29) | `bash scripts/test-gates.sh` | task end + CI(check.sh) |
| Prose(deslop) | 新增行 slop 命中 = 0 | `python3 scripts/check-prose.py`(增量,环境感知 base) | task end + CI(check.sh) |
| Full acceptance | 一条命令全绿:skills/gates/prose/ADR checker selftest + adapters 12 件缝测试 + pi 扩展套件(在场时)+ numbers sync + pi typecheck + tsv 证据指针 | `bash scripts/check.sh` | task end + CI |
| Review gate | `review` / `code-review` 开跑前先量同一固定点,evidence 落 `.dev/audit/evidence/check-code-*.txt`;裁决首行与 evidence 的 gate 结果一致,`broken`(每个函数 0% 覆盖 = 测试命令没匹配到测试)按失败处理 | `bash scripts/check-code.sh review --since <fixed-point>`(工具链缺场用 `check-code.sh setup`;装不上 = 该 review 标 INCONCLUSIVE,不算通过) | review 开始前 |
| pi 扩展套件 | bun test 159/159(14 文件) | `bash scripts/check.sh` 第 6 级:pi 运行时 + bun 在场时执行,缺场**可见 SKIP**(CI 无 pi 运行时——证据层不是静默通过);bun 由 devDependencies 提供(`node_modules/.bin`,仓库根 `npm install` 一次) | task end(本机满装时) |
| pi 类型闸 | pi/ 源码缺失名字/缺失导出类(TS2304/TS2552/TS2305/TS2459/TS2614)= 0——imports 缺口即运行时炸弹(2026-10-22 事故类:dirname/inspect 未导入致前台 spawn 崩溃),导出缺口是类型洞(2026-10-26 审计:agents.ts 11 处幻影 import 在 bun 擦除下绿着跑) | `bash scripts/check-types.sh`(check.sh 第 8 级;tsc 来自 devDependencies,缺场可见 SKIP;.bin 缺链接但 typescript 包在场时走包内 tsc) | task end + CI(装依赖后) |
| tsv 证据指针 | `.dev/audit/*.tsv` 的 evidence/show 指针可达且目录非空(照写不照验 = T-034 事故形状;已移除的历史档显式豁免清单) | `python3 scripts/check-evidence.py`(check.sh 第 8 级;无 .dev 或无 tsv 行 → no-op,exit 0) | task end + feature 收尾 |
| Replay coverage | pi/ 的 restore/reattach/replay* 每个都在 pi/*.test.ts 被引用 | `python3 scripts/check-replay.py` | task end + CI(check.sh 第 8 级) |
| Trigger surface | description/触发词改动须经 eval 门(触发回归) | `eval` 技能 × `evals/` 用例库 | 技能 frontmatter/description 变更时 |
| Install parity | 落地后安装面与 origin/main 一致 | local-path 安装(现行):加载即仓库本体,零漂移天然成立;git/npm 源安装(未来):`pi update --extensions` reconcile 后 `pi list` 核对 | 落地收尾 |

## Measured, not yet enforced

| Metric | Today (2026-10-22) | Direction |
|--------|-------|-----------|
| test-gates 断言数 | 29 | must not fall(降 = 逃逸) |
| adapters 缝测试 | 12/12 | must not fall |
| pi 扩展测试 | 159/159 | must not fall |
| pi 类型精确化噪音(tsc 错误实例,非行数) | 26(2026-10-26 审计后;原 43 含 11 处幻影 import) | ratchet 向下(增量严化,不走一次性清零) |
| 账本 D 门首过率 | 0.56 | 观察(RED-first 纪律刻意压低,非事故) |
| blocked items / verdict flips | 0 / 0 | 0 |
| 重放函数覆盖数 | 2(AgentRunner.restore / DurableEngine.reattach) | must not fall |
| skip-test 率(`.dev/audit/*.tsv`) | 0 | 0 |
| 最差 CRAP(ratchet) | 未播种:播种要一次全量且覆盖可信的 run。TS 侧命令须限定 `pi/`(`bun test --coverage --coverage-reporter=lcov pi/`,158 绿;不限定时 bun 也会收 adapters 的浏览器用例),而 `--coverage-command` 是全局的,同一次 run 里 Python 侧(scripts/)会被判 broken——所以要么在包里声明 per-language 计划,要么先补 `package.json` 的 coverage script,再 `bash scripts/check-code.sh ratchet --update-baseline` | 只降不升;抬高 baseline 必须是独立 diff,在 review 里单独看 |
| 变异存活(ratchet) | 未播种(同上,追加 `--mutants`) | 只降不升;新分支的 survivor 视为缺断言 |
| 重复候选(≥0.8,ratchet) | 0(2026-10-26 审计后 `bash scripts/check-code.sh dupes` 全量 0:UTF-8 截断收进 `pi/agent-text.ts`,intercom 的 req/reply 路径合并为 `rowPath`) | 只降不升;随 baseline 入档 |

## Exceptions

| ID | Rule | Path | Reason | Owner | Expires |
|----|------|------|--------|-------|---------|
| — | (无在任例外;首例 XP-01 show-me WIP 于 2026-10-21 随技能完结、check 全绿而撤) | | | | |
| — | — | — | 空表:新例外必须有日期行、理由、owner、到期(例外四要素) | — | — |
