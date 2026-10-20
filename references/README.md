# References:index 与名称映射

本目录收拢自 addyosmani/agent-skills 的 references/(原文照拷,MIT),供本栈技能按需引用。原文中的命令/技能名按下表映射到本栈:

| 原文名称 | 本栈等价 |
|---|---|
| /spec, /plan, /tasks | `spec` → `tickets` |
| /build, /build auto | `implement-all`(auto 模式) |
| /test | `tdd` + 套件/构建步骤(在 implement-all 的每任务环内) |
| /review | `review`(四镜头管线;镜头 1 = `code-review`) |
| /ship | `review` 过门后的落地流程(`/ship` 生命周期命令,P4 落 pi/lifecycle.ts;pstack shipping 为底) |
| code-review-and-quality | `code-review`(双轴)或 review 管线 |
| incremental-implementation | `implement` / `implement-all` |
| code-reviewer / security-auditor / test-engineer personae | 本包 agents/(code-reviewer、security-auditor;test-engineer 职能并入实现技能与测试纪律) |
| constraints(-driven) | `constraints` |
| spec-driven-development | `spec` |
| shipping-and-launch | `/ship` 生命周期命令(P4;独立 ship 技能未落地) |

各清单的挂靠(收拢时的用法指引):
- definition-of-done / testing-patterns → `tdd`、`implement(-all)`、`spec` 的验收/测试节引用
- security-checklist → `code-review` 镜头、agents/security-auditor
- performance-checklist → perf 流程(P3/P4 落地时挂)
- accessibility / observability-checklist → constraints 的维度清单素材
- orchestration-patterns → implement-all / review 的多代理纪律参考

## 共享格式规范(2026-10-19 单源化)

- `glossary-format.md` / `adr-format.md`——docs/GLOSSARY.md 与 ADR 的写入格式,`grill-me` 与 `refact` 共用的唯一正本(技能内以 `../../references/…` 指针引用);原两技能内副本已撤——撤前已是 adr-format 逐字双拷贝、glossary-format 漂移 2 行。
