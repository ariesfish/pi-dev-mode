# P1 ⑧ setup 缺失姿态统一 — Mode A 触发回归(2026-10-20)

改动:implement / code-review / scout 三处 "tell the user to run `setup`" /
"run `setup` first" 硬停/绕路姿态,统一为路由器规定的 in-place bootstrap
(读证据 → 一次确认问题带推荐 → 继续),与 tickets / triage-issue 已有姿态
对齐。改动面:纯 body 行为子句,description/触发词零改动。

## 运行(runner v3 形状:per-case skills 拷贝 + 机械 cheat 检查 + 全量转写喂 judge)

| 用例 | 档位 | 结果 |
|---|---|---|
| evals/scout/fog-destination | dialogue,bare(触发判别档,无扩展,无 fixture) | **PASS** |
| evals/implement/multi-area-block | dialogue,routing 档(--no-extensions + -e pi/index.ts,fixture multi-area) | **PASS** |

- 机械 cheat 检查(transcript 无 `pi-dev-mode/evals/` 路径):两案 CLEAN。
- 判分:独立 judge 运行(pi -p --no-skills --no-extensions,grader 规则 + 全量 transcript/reply @file),首行 PASS。
- scout 案直接验证了改动面:回复以 `.dev/<slug>/scout-map.md` 为默认落点继续推进,
  没有把用户送去跑 setup(旧子句的失败形态)。

## 未跑与原因

- `implement/multi-area-fulltools`:standing instrument,建档即红(design 记录:
  mandate 层执法缺口,与本次 tracker 子句不同轴),重跑无增量信息。
- `implement/visual-parity`:视觉梯子轴,与 tracker 子句正交(execution 档 1500s,可按需补跑)。
- `code-review`:**无 case bank**(评估发现的本体缺口)——本次编辑无回归网。
  补齐 case bank 需要 organic 真实会话来源(README 纪律),记 retro 候选。
- Mode B(变体 A/B)未跑:⑧ 是窄幅姿态统一,Mode A 子集 + lint 绿 + 描述面零改动
  记录在案;要金标准可随时补。

## Runner 坑(已回写 evals/README.md 运行节)

路由档必须 `--no-extensions` 与 `-e <repo>/pi/index.ts` 同时用:`-e` 单用时与
自动加载的 git 安装版 pi-dev-mode 扩展同名工具(agent/send_message/…)冲突,
两个扩展都加载失败,候选裸奔(2026-10-20 实测)。
