# References:index 与名称映射

本目录收拢自 addyosmani/agent-skills 的 references/(原文照拷,MIT),供本栈技能按需引用。原文中的命令/技能名按下表映射到本栈:

| 原文名称 | 本栈等价 |
|---|---|
| /spec, /plan, /tasks | `spec` → `tickets` |
| /build, /build auto | `implement-all`(auto 模式) |
| /test | `tdd` + 套件/构建步骤(在 implement-all 的每任务环内) |
| /review | `review`(五镜头管线;镜头 1 = `code-review`) |
| /ship | `review` 过门后的落地流程(`/ship` 生命周期命令,P4 落 pi/lifecycle.ts;pstack shipping 为底) |
| code-review-and-quality | `code-review`(双轴)或 review 管线 |
| incremental-implementation | `implement` / `implement-all` |
| code-reviewer / security-auditor / test-engineer personae | 本包 agents/(code-reviewer、security-auditor;test-engineer 职能并入实现技能与测试纪律) |
| constraints(-driven) | `constraints` |
| spec-driven-development | `spec` |
| shipping-and-launch | `/ship` 生命周期命令(P4;独立 ship 技能未落地) |
| `security-and-hardening` | 不落地;清单挂 security-checklist(`code-review` Standards 轴) |
| `frontend-ui-engineering` | 不落地;清单挂 accessibility-checklist(同轴) |
| `performance-optimization` | 不落地;清单挂 performance-checklist(`constraints` 维度素材) |
| `observability-and-instrumentation` | 不落地;清单挂 observability-checklist(`constraints` 维度素材) |
| `test-driven-development` | `tdd`(testing-patterns 为其示例库) |

各清单的挂靠(2026-10-20 通电,均为已接线实态):
- security-checklist / accessibility-checklist → `code-review` Standards 轴(域命中时审)
- performance-checklist / observability-checklist → `constraints` 维度素材
- definition-of-done → `implement` 完成报告前的常设门槛
- skill-writing → `retro` / `eval` 的写作判据(**本仓原创**,非挂载;原文依据 mattp `writing-for-agents`)
- testing-patterns → `tdd` 原则的 JS/TS 示例
- orchestration-patterns → `implement-all` PARALLEL 编排纪律(含 persona 资料)

## 共享格式规范(2026-10-19 单源化)

- `glossary-format.md` / `adr-format.md`——docs/GLOSSARY.md 与 ADR 的写入格式,`grill-me` 与 `refact` 共用的唯一正本(技能内以 `../../references/…` 指针引用);原两技能内副本已撤——撤前已是 adr-format 逐字双拷贝、glossary-format 漂移 2 行。
