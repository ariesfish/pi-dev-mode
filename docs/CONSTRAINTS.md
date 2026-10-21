# Constraints

Last reviewed: 2026-10-22 by the refactor-audit round (user-approved; dimensions and block/warn numbers stated as defaults, adjustable via an Exceptions row)

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
| Full acceptance | 一条命令全绿:skills/gates/prose + adapters 12 件缝测试 | `bash scripts/check.sh` | task end + CI |
| pi 扩展套件 | bun test 59/59(6 文件) | `bash scripts/check.sh` 第 5 级:pi 运行时 + bun 在场时执行,缺场**可见 SKIP**(CI 无 pi 运行时——证据层不是静默通过) | task end(本机满装时) |
| Trigger surface | description/触发词改动须经 eval 门(触发回归) | `eval` 技能 × `evals/` 用例库 | 技能 frontmatter/description 变更时 |
| Install parity | 落地后安装面与 origin/main 一致 | local-path 安装(现行):加载即仓库本体,零漂移天然成立;git/npm 源安装(未来):`pi update --extensions` reconcile 后 `pi list` 核对 | 落地收尾 |

## Measured, not yet enforced

| Metric | Today (2026-10-22) | Direction |
|--------|-------|-----------|
| test-gates 断言数 | 23 | must not fall(降 = 逃逸) |
| adapters 缝测试 | 12/12 | must not fall |
| pi 扩展测试 | 59/59 | must not fall |
| 账本 D 门首过率 | 0.56 | 观察(RED-first 纪律刻意压低,非事故) |
| blocked items / verdict flips | 0 / 0 | 0 |
| skip-test 率(`.dev/audit/*.tsv`) | 0 | 0 |

## Exceptions

| ID | Rule | Path | Reason | Owner | Expires |
|----|------|------|--------|-------|---------|
| — | (无在任例外;首例 XP-01 show-me WIP 于 2026-10-21 随技能完结、check 全绿而撤) | | | | |
| — | — | — | 空表:新例外必须有日期行、理由、owner、到期(correct 的例外四要素) | — | — |
