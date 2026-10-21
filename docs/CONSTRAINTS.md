# Constraints

Last reviewed: 2026-10-20 by the SDLC wiring round (user-approved; dimensions and block/warn numbers stated as defaults, adjustable via an Exceptions row)

本仓是技能/文档栈:没有产品运行时,质量维度全部落在**检查可执行**上。规则↔enforcement 配对(correct 的规则表):每行命令 = 本地与 CI 同一条(`scripts/check.sh`)。

## Floor (always enforced, no setup required)

- 任何检查不得为了让改动通过而被削弱、删除或绕过——包括本文件(diff watch)
- 证据与账本 history 只追加:已记录的裁决/证据(ledger history、`docs/evidence/`、` .dev/audit/`)不得改写或删除
- 新增 prose 行零 slop(13 条双语黑名单,check-prose 增量执法;存量不拦、增量拦)
- 技能/文档改动必须有 `bash scripts/check.sh` 全绿才 commit
- 源码无 secrets

## Enforced with numbers

| Dimension | Rule | Checked by | Runs at |
|-----------|------|-----------|---------|
| Skill-tree integrity | frontmatter/H1/交叉引用/指针 lint exit 0 | `python3 scripts/check-skills.py` | task end + CI(check.sh) |
| Gates semantics | test-gates 全断言绿(当前 23) | `bash scripts/test-gates.sh` | task end + CI(check.sh) |
| Prose(deslop) | 新增行 slop 命中 = 0 | `python3 scripts/check-prose.py`(增量,环境感知 base) | task end + CI(check.sh) |
| Full acceptance | 一条命令全绿 | `bash scripts/check.sh` | task end + CI |
| Trigger surface | description/触发词改动须经 eval 门(触发回归) | `eval` 技能 × `evals/` 用例库 | 技能 frontmatter/description 变更时 |
| Two-repo sync | 落地后安装仓 = origin/main | `git -C ~/.pi/agent/git/github.com/ariesfish/pi-dev-mode log --oneline -1` | 落地收尾 |

## Measured, not yet enforced

| Metric | Today (2026-10-20) | Direction |
|--------|-------|-----------|
| test-gates 断言数 | 23 | must not fall(降 = 逃逸) |
| 账本 D 门首过率 | 0.56 | 观察(RED-first 纪律刻意压低,非事故) |
| blocked items / verdict flips | 0 / 0 | 0 |
| skip-test 率(`.dev/audit/*.tsv`) | 0 | 0 |

## Exceptions

| ID | Rule | Path | Reason | Owner | Expires |
|----|------|------|--------|-------|---------|
| XP-01 | Skill-tree integrity(CHECK 十字:中文触发词/H1/清录一致性) | `skills/show-me/**` 及其对 pi-dev-mode / dev-mode-help 清录的两处波及 | 所有者自建 WIP,性质 disable-model-invocation 的自助技能;未完成前不动(用户指令 2026-10-21);check-skills 红全部由此起 | ariesfish | show-me 完成时(补中文触发词/H1/清录两行) |
| — | — | — | 空表:新例外必须有日期行、理由、owner、到期(correct 的例外四要素) | — | — |
