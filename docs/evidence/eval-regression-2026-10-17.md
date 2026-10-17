# Eval 触发回归一轮(2026-10-17)

P2.5 备注"过 eval 触发回归一轮为佳"的执行记录。本轮无 description/trigger 改动——是对当前树(P2.6 后)的回归清点,不是改动门。

环境:pi 1.3.0(本地装 `./pi-dev-mode`,工作区即包);候选与判分均 deepseek-v4-flash(thinking max);候选跑在空临时目录(`mktemp -d`),transcript 落 `--session-dir`。

方法(eval SKILL Mode A + evals/README 两档):
- 触发档:`pi -p --session-dir … --no-extensions --no-skills --tools read --skill <repo>/skills "<正文>"`
- 路由档(multi-area-block 按 P2.6 档位分配属此类):追加 `-e <repo>/pi/index.ts`——mandate/repo-state 是产品的一部分
- 判分:每例一个独立判分会话,附净化 transcript(用户消息 + 工具调用链 + 工具结果截断 2000 字 + 终回复)与该例 grader 规则,输出 VERDICT/EVIDENCE 两行

## 结果(6 用例,7 跑次)

| 用例 | 档位 | 判定 | 链证据 | 判分者证据 |
|---|---|---|---|---|
| benchmark-checklist/claims-speedup | 触发 | PASS | 读 `benchmark-checklist/SKILL.md` | "单次测量不足以支撑 PR 里的'提速 31%'",列错误计数/定时区七问 |
| implement/multi-area-block | **路由(门)** | **PASS** | 读 `pi-dev-mode/SKILL.md`→`issues/SKILL.md`(经 review/eval 途中对照) | "点名三个区域+整套重做+照 paseo 成品——正中路由表:先拆(issues)→ implement-all,绝不合成一张大票" |
| implement/multi-area-block | 触发(控制观察,非门) | FAIL | 未读任何技能 | 空 cwd 下问路径后"看一遍再动手重做",未浮出拆票 |
| issues/bootstrap-then-split | 触发 | PASS | 读 `issues/SKILL.md`→`pi-dev-mode/SKILL.md` | 恰一问带推荐 tracker(基于仓库证据 ariesfish/pi-dev-mode GitHub Issues),随后进拆票不停墙 |
| review/merge-gate | 触发 | PASS | 读 `review/SKILL.md` | 四镜头门外竖起,"现在的结论:INCONCLUSIVE,不是 APPROVE" |
| review/stays-quiet-on-commit-tidy | 触发 | PASS | **NONE(正确静默)** | 纯 `rebase -i`/fixup 配方,无任何 review 协议出场 |
| tdd/expensive-e2e | 触发 | PASS | 读 `tdd/SKILL.md` | skip-test 记录(4min docker 不入红绿环)+ 进程内集成检查兜底 + 单条 e2e 终验 |

## 判定

- **门位全绿**:6 用例按各自档位(5 触发档 + 1 路由档)全 PASS;无 description 回归,无需改动、无入账本项。
- **观察 2 条(给 retro,不是门)**:
  1. multi-area 基线档(无 mandate):首跑(300s 上限)在空 cwd 用 read 发散考古 68 次未回复被杀;重跑(900s)收敛为"问路径→看一遍→整套重做",仍未浮出拆票。P2.6 控制组当时答"one area at a time",本次形态不同——空 cwd + `--tools read` 下无 fixture 可考,候选只能问。路由判别当前实际依赖 mandate,implement/issues 的纯 description 层面多区拆分路由仍是弱面;若要强化,描述改动过 eval 门(Mode A 编辑门),或用例补 fixture 后再测。
  2. 用例设计缺口:路由类用例正文引用"paseo 成品/参考图",既有的 fixture 缺口(evals/README:"execution 类待 fixture")对基线档控制组同样成立——待补。

## 旁注

- 判分者引用 bench-claims 时把算术转述成 "1.3/4.2 ≈ 31%"(应为 (4.2−2.9)/4.2);判定不受影响(规则判的是拒绝背书,不是算术复核),记录在此作为"判分者引用须回链核对"的又一例。
- 候选与判分命令、判分全文存档于运行目录(临时,已清理机制之外另存):`/tmp/vet-results/<case>/{reply.txt,judge.txt,transcript.txt}`。
