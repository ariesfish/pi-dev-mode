# Rejected Skill Changes

Eval 证据否决的技能/描述改动账本(append-only,一行一拒)。retro 提案先查这里,再决定要不要重提。

| Date | Affected skill | Attempted change | Eval outcome | Outcome |
|---|---|---|---|---|
| 2026-10-17 | pi-dev-mode (mandate) | Scope-gate hardening: "Before your first edit" multi-area stop-and-route paragraph in the session-start mandate + a mirror sentence in the skill's scope test (retro candidate E, P1 direct-implementation trap) | Case evals/implement/multi-area-fulltools (execution, fixture multi-area, deepseek-v4-pro, full tools): red run FAIL reproduced (8+ edits across all areas, no split); green run FAIL (mandate line verified delivered in the system prompt, candidate still implemented all three areas directly) | Rejected — docs-level wording does not bind a full-tool v4-pro session. Edits reverted. The case stays in the bank as the standing instrument (currently red on both trees); re-propose only with an enforcement level above prose. |
| 2026-10-18 | issues (case: bootstrap-then-split) | Fixture wire-in for the lost-plan axis (evals/fixtures/unconfigured-w6) + mandate scope note excluding stack-config seeding from the B tell-me no-edit rule — both aimed at restoring the one-confirmation tracker dance | 8 trials across shapes (bare ×4, fixtured pre/post-scope-note ×4): the fixture fixed the lost-plan wall (slicing now proceeds from W6.md), but the one-confirmation-then-seed tracker protocol never returns — candidates slice and offer file formats instead. P3-edited neighbors all PASS (merge-gate, stays-quiet, answer-only, tdd-cost, multi-routing), so the P3 verifier/routing edits' blast radius is green | Candidate stays in the bank as a standing instrument on the confirmation-protocol axis (fixture kept — it fixed the environment axis). Re-propose only with an insight above prose (base-model interaction drift suspected, like the row above). The mandate scope note stays: it documents the designed boundary and breaks nothing. |

| 2026-10-18 | issues §4 + implement visual + pi-dev-mode routing row + mandate dedup (standing instruments B/G/I/E clearance round, user-ordered) | B: §4 'Quiz the user' (four questions/turn — the skill itself commanded the interrogation; prose patches on bootstrap could never fix a structural interrogator) rewritten to stated-defaults + one bundle question. G/E: mode routing row gains the action shape (first reply = the split table itself; file contents before split confirmation = breach shape). I: visual ladder reordered — render+pixel-diff FIRST closes the gate, viewer = optional background enhancement (a foreground spawn on a config-archaeology model id hung the turn twice; wrong-guess ids can hang), foreground viewer (deepseek-flash pinned) only when nothing renders headless. Runner: execution-tier timeout 700→1500s; skills copied per-case (eval-blind); judge anti-cheat gate (transcript touching pi-dev-mode/evals/ = FAIL) | Mode A full bank on new texts: 9/9 formal PASS (A/B×2/C/D/E-tdd/F/G/H) — B×2 and G flip to PASS, no regression. E (multi-area-fulltools) retried: v1 reached a split but had READ THE GRADER (transcript grep hit the bank path) — invalidated as contaminated; v2 under the isolated runner: formal PASS (split surfaced 4 tickets with dependency graph, zero file edits, viewer report legitimate, anti-cheat clean). I: PASS (real esbuild+headless-Chrome render, 634/128000 px diff on AA arcs only, multimodal viewer VERDICT PASS, text-label removal surfaced as an explicit decision for the user) | Cleared — B, G, E, I all green. E's first rerun exposed an eval-blindness hole (candidates can reach the bank from absolute skill paths) — structurally closed by per-case skill copies + the judge cheat gate. Runner v3 shape recorded in evals/README. |

## 2026-10-26 — 补满 fires 覆盖，两个案例翻红后改技能

新增 11 个技能的第一张 fires 案（`create-verification-skill`、`maintain-verification-skill`、
`doubt`、`eval`、`proto`、`refact`、`repo-map`、`research`、`retro`、`setup`、`dev-mode-help`），
同时新增 runner `scripts/run-eval.sh`（隔离、超时、作弊检查都在脚本里）。

首轮 11 案：6 PASS / 5 FAIL，其中 4 个 FAIL 是**材料错配**而不是技能问题——
prompt 问的是真实仓库 / 联网 / 可执行动作，而 dialogue 车道只给 `read` 且 cwd 为空。
处置：`doubt`、`refact`、`repo-map`、`research` 改为 `execution` + 同伦 fixture
（`migration-plan`、`tangled-billing`、`small-service`、`vite-migration-docs`）；
`eval` 案的 prompt 改成"先讲清楚 Gate 怎么判"，并重写 grader 使其判协议形状而非执行。

重跑 4 案：`doubt` PASS（真的 spawn 了 fresh-context reviewer 并逐条核对）、
`repo-map` PASS。两个仍然 FAIL，是技能正文的真实缺口：

- `research`：来源引用完全正确，但**没写文件**，只在结尾"要不要我把清单整理成脚本"。
  技能正文加了硬门：文件是交付物，先写 `.dev/<slug>/research.md` 再报告，报告以指针形式给出；
  够不到的来源在文件里记成 gap，不从记忆补。
- `refact`：架构判断正确，但直接给了接口签名、推荐了方案 A、并排好了执行顺序,
  即跳过了技能第 2 步"先给候选、让人挑"。技能正文加输出契约：第一轮是 pick-list,
  以编号候选 + "想先探哪个?" 结尾,不许出现签名 / 推荐赢家 / 工作排序。

改动后各重跑一次复核：**两个仍然 FAIL**，原因与材料、措辞都无关：

- `research`：来源引用逐条正确（`docs/known-issues.md` 第 1/2 条都被准确引用），但执行车道
  有 write 工具却**一次都没写**，结论只活在回复正文里。注意此时 prompt 是"想搞清楚…别给我泛泛的
  优缺点"——用户要答案，模型就给答案，技能顶部那句"文件是交付物"没有转成动作。
- `refact`：加了"第一轮是 pick-list、不许签名/推荐赢家/排顺序"的契约后，回复照样给出
  `orders.markRefunded(id)` 这类签名、照样写"先切这个,收益最大"、照样排 1-2-3 步骤。
  三轮一致的行为，说明**散文禁令对这条输出形状不具约束力**。

结论（两条可复用的判断，不是情绪）：

1. **散文禁令只对"有别的正当事可做"的越界有效**；当用户的问题本身可以在聊天里答完时，
   "先写文件再报告"要求模型主动增加工作量，措辞加强不改变服从率。
2. 要真正约束输出形状，得给**结构**（模板槽位、checklist 让它逐项填）或改 **description**
   （模型最早读到的那一层），两者都要各自过一轮 eval——不是这轮的副产品。

这两案保留为仪表：它们现在能稳定复现该缺口，任何一次"以为已经修好"的改动都会被它们顶回来。
