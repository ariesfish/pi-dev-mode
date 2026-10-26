# Constraints

Last reviewed: 2026-10-26 by the attention-notify round (T-041: pi suite 120/11 -> 154/12, tsc noise 45 -> 44). Dimensions and block/warn numbers are stated as defaults, adjustable via an Exceptions row.

本仓是技能/文档栈:没有产品运行时,质量维度全部落在**检查可执行**上。规则↔enforcement 配对(correct 的规则表):每行命令 = 本地与 CI 同一条(`scripts/check.sh`)。

## Floor (always enforced, no setup required)

- 任何检查不得为了让改动通过而被削弱、删除或绕过——包括本文件(diff watch)
- 账本 history 只追加:gates 裁决账本与 `.dev/audit/` 不得改写或删除(过程证据档已于 2026-10-22 经 owner 决定移除,归档即 git history)
- 新增 prose 行零 slop(13 条双语黑名单,check-prose 增量执法;存量不拦、增量拦)
- 技能/文档改动必须有 `bash scripts/check.sh` 全绿才 commit
- 源码无 secrets

## Enforced with numbers

| Dimension | Rule | Checked by | Runs at |
|-----------|------|-----------|---------|
| Skill-tree integrity | frontmatter/H1/交叉引用/指针 lint exit 0 | `python3 scripts/check-skills.py` | task end + CI(check.sh) |
| Gates semantics | test-gates 全断言绿(当前 23) | `bash scripts/test-gates.sh` | task end + CI(check.sh) |
| Prose(deslop) | 新增行 slop 命中 = 0 | `python3 scripts/check-prose.py`(增量,环境感知 base) | task end + CI(check.sh) |
| Full acceptance | 一条命令全绿:skills/gates/prose/ADR checker selftest + adapters 12 件缝测试 + pi 扩展套件(在场时)+ numbers sync + pi typecheck + tsv 证据指针 | `bash scripts/check.sh` | task end + CI |
| pi 扩展套件 | bun test 154/154(12 文件) | `bash scripts/check.sh` 第 6 级:pi 运行时 + bun 在场时执行,缺场**可见 SKIP**(CI 无 pi 运行时——证据层不是静默通过);bun 由 devDependencies 提供(`node_modules/.bin`,仓库根 `npm install` 一次) | task end(本机满装时) |
| pi 类型闸 | pi/ 源码未定义标识符类(TS2304/TS2552)= 0——imports 缺口即运行时炸弹(2026-10-22 事故类:dirname/inspect 未导入致前台 spawn 崩溃) | `bash scripts/check-types.sh`(check.sh 第 8 级;tsc 来自 devDependencies,缺场可见 SKIP) | task end + CI(装依赖后) |
| tsv 证据指针 | `.dev/audit/*.tsv` 的 evidence/show 指针可达且目录非空(照写不照验 = T-034 事故形状;已移除的历史档显式豁免清单) | `python3 scripts/check-evidence.py`(check.sh 第 8 级;无 .dev 环境 no-op) | task end + feature 收尾 |
| Trigger surface | description/触发词改动须经 eval 门(触发回归) | `eval` 技能 × `evals/` 用例库 | 技能 frontmatter/description 变更时 |
| Install parity | 落地后安装面与 origin/main 一致 | local-path 安装(现行):加载即仓库本体,零漂移天然成立;git/npm 源安装(未来):`pi update --extensions` reconcile 后 `pi list` 核对 | 落地收尾 |

## Measured, not yet enforced

| Metric | Today (2026-10-22) | Direction |
|--------|-------|-----------|
| test-gates 断言数 | 23 | must not fall(降 = 逃逸) |
| adapters 缝测试 | 12/12 | must not fall |
| pi 扩展测试 | 154/154 | must not fall |
| pi 类型精确化噪音(tsc 错误实例,非行数) | 44 | ratchet 向下(增量严化,不走一次性清零) |
| 账本 D 门首过率 | 0.56 | 观察(RED-first 纪律刻意压低,非事故) |
| blocked items / verdict flips | 0 / 0 | 0 |
| skip-test 率(`.dev/audit/*.tsv`) | 0 | 0 |

## Exceptions

| ID | Rule | Path | Reason | Owner | Expires |
|----|------|------|--------|-------|---------|
| — | (无在任例外;首例 XP-01 show-me WIP 于 2026-10-21 随技能完结、check 全绿而撤) | | | | |
| — | — | — | 空表:新例外必须有日期行、理由、owner、到期(correct 的例外四要素) | — | — |
