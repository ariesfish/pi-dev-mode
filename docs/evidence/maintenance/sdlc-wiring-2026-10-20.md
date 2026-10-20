# SDLC 接线真机验收档(2026-10-20)

**特性**:`.dev/sdlc-wiring/spec.md`(六节决策合同,批准于本轮 ask_user)
**票面**:T-001..T-006(`.dev/sdlc-wiring/plan.md`),全程狗粮账本(`.dev/lifecycle/`)
**基线**:939ef86(P1 残余验证轮)→ bootstrap e9d48f4(tracker + gitignore)

## 六票落地(commit × 账本 × tsv)

| 票 | commit | 内容 | 账本要点 |
|---|---|---|---|
| T-001 | 2a28279 | gate.sh 返工预算熔断 + resume + open 幂等 + README 修正 | step2 RED(test-gates 对旧 gate.sh 失败)→ step3 GREEN;`scripts/test-gates.sh` 22 断言全绿 |
| T-002 | 8eaa444 | implement/implement-all exit-4 BLOCKED stop 条款 | step3 断言词 FAIL(exits 4 vs exit 4,真 RED)→ step4 GREEN |
| T-003 | 06245e6 | tickets/triage-issue 出票即开票(幂等) | demo-ac2:scratch 仓出票后 `items/T-101/state.json` 出现 + 复用幂等 |
| T-004 | 4559f33 | diagnose 复现环 = repro 门(RED 在前 GREEN 在后;perf=bench 门) | demo-ac3:同 argv FAIL→PASS;`replay` 报 1 DRIFT = 修复的序列证据 |
| T-005 | 7271825 | review land 读回门(gh pr view / git branch --contains) | demo-ac4:未合并→land red,合并读回→green,close 放行 |
| T-006 | (本档 commit) | 接入表 4→7、README 状态行、本档、push+两仓同步 | 见下"冻结数字" |

决策台账:`.dev/audit/T-00{1..6}.tsv`(七列,每票 ≥1 行 skip_test 全空——无跳过)。

## 冻结数字(mine 终值,含 T-006 自身门与修复验证)

```
mine: D-gates=16 first_pass=9 first-pass-rate=0.56
mine: verdict-flips=0 (disagreement; skip-test rate lives in .audit tsv)
mine: blocked-items=0
```

> 注:先前证据档批冻结于 14/0.50(来计入 T-006 自身 3 门),终值以上表为准;首过失分 7 处全部是故意的 RED 入账。

- 首过率 0.56:首过失败 7 处全部是**故意的 RED 门**(每票条款先行入账失败——tdd 纪律的预期形态,不是质量事故);对照组 check 门首过全绿。
- verdict 翻转 0:本轮 A 类门零裁决文件(技能栈维护轮,无高风险合并; reviewers 走四镜头文本聚合)。
- blocked 0:预算熔断从未触发——六票无一票返工超限。

## replay 语义定档(本轮实测确立)

RED 条目(修复前对旧代码失败的断言)在修复后 replay 会报 `1 DRIFT`——这不是账本缺陷,是**"复现在前、修复在后"的机器重验**:同 argv 旧败新胜,恰为修复成立的证明。T-002 例外佐证:其 step3 FAIL 因条款词序(exits 4 vs exit 4)至今仍败,replay 反而 CLEAN——漂移只报"行为改变了",不报"行为没变"。T-001/T-003/T-004/T-005 的 replay 各报 1 DRIFT,均为各自 RED 条目。

## 边界与诚实注记

1. **T-002..T-006 五票的账本 item 由 implement 侧条款打开**(publish 早于 T-003 落地)。**首个完全走 intake 新条款(出票即开账本)的票将是本仓下一次新发布的票**——T-003 在发布后的第一张新票上即时可用(demo-ac2 已在 scratch 仓验证同构行为)。
2. T-005 tsv 曾因 `head -2` 误截第二行,本档定稿前已修正(append-only 纪律只约束账本 history,tsv 修正以重写整格、保留行为语义完成)。
3. eval 触发回归未跑:六票全部是 body 条款编辑,description/触发面零改动(check-skills frontmatter/description 扫描重复通过 = 静态证据)。retro 可按需补跑。
4. 本验收在 dev 工作仓(dev-skills/pi-dev-mode)完成;`.dev/`(票面/账本/tsv)按 P6 布局 gitignored 不入库,审计入口即本档 + gates 历史 + git log。

## 验收基线(check)

- `bash scripts/test-gates.sh` 绿(22 断言)
- `python3 scripts/check-skills.py` 绿(T-002..T-006 五票 check 门 + T-001 两跑全绿)
- 两仓同步:origin/main 与 `~/.pi/agent/git/github.com/ariesfish/pi-dev-mode` 同 commit(收尾命令见下)

## 追记:同步核对抓出 post-freeze 缺陷并修复(同日)

两仓同步后第一拉验证就在安装仓暴露崩溃:无账本仓跑 `mine` 报 `NameError: name 'sys' is not defined`——`mine` 的 python 缺 `import sys`,而该分支(无 `.dev/lifecycle/` 拒绝)在狗粮仓(账本在场)从未走过,test-gates.sh 也没断言它。修复:`gate.sh` mine 块补 `import sys`;`test-gates.sh` 补断言 `mine without ledger refused (exit 2)`(23 断言);修复 commit 附随本追记,tsv 以 superseding 行记录。**这正是两仓同步验证的存在理由:同一文件在两种仓库状态下必须都成立。**
