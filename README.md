# ariesfish stack

以你自己的 `dev-*` 11 件(`~/.agents/skills/`)为基座,融合 pstack、mattp、addyosmani 三栈升级的 pi-agent 技能栈,mode 定名 **pie-mode**。
**大 mode 一键进场,单点技能独立爆破,工件契约是心脏。**

```
dev-*(11件) →基座 宿主      align code/diagnose issues prd proto refact repo setup tdd triage
pstack      →升级包 验证的心脏    证据标准 独立裁决 数字纪律 verify 生成器 反馈环冻结复用
mattp       →血统确认          grilling domain 哲学 tracker 管道 已在 dev-* 落地
addyosmani  →升级包 生命周期与质量合同  SPEC build auto CONSTRAINTS 三类验收标注 停止条件
```

融合原则:**dev-* 是宿主,三栈是升级包,不推翻、可回滚**(见 docs/02 §7)。

## 文档地图

| 文档 | 内容 | 什么时候读 |
|---|---|---|
| [docs/01-analysis-three-stacks.md](docs/01-analysis-three-stacks.md) | 三栈深度分析与互性矩阵、我方既有资产对账 | 想知道"为什么这样融合" |
| [docs/02-fusion-architecture.md](docs/02-fusion-architecture.md) | 四层架构、工件契约、路由表、八条冲突裁决、**§7 dev-* 基座策略** | 想知道"融合成什么样" |
| [docs/03-skill-matrix.md](docs/03-skill-matrix.md) | **§0 dev-* 升级包矩阵(11 件逐件升级项)** + 新增收编/放弃清单 | 找某个技能的出处与处置 |
| [docs/04-implementation.md](docs/04-implementation.md) | P0-P5 路线图(基于 dev-* 迁入路径)、每阶段验收标准、风险登记 | 动手实施 |

## 一页总览

**三层使用方式:**
1. 大 mode:`/skill:pie-mode` 或让它经 mandate 自动进场——路由表按"阶段 × 类型 × 雾级"派发
2. 生命周期命令(显式):`/spec` `/build`(含 `/build auto`)`/review` `/ship`
3. 单点:`/skill:dev-align`、`/skill:benchmark-checklist`、`/skill:constraints`……任何技能独立跑,靠工件在场咬合,不在场就降级

**技能构成:dev-* 基座 11 + 三栈新增 ~12(pie-mode、spec 工厂、build、wayfinder、constraints、review、benchmark、perf、ship、verify×2、retro、use-the-stack)+ 扩展 + opt-in 账本。**
(散件说明:`~/.agents/skills/` 里非 dev- 前缀的 `handoff` 等按引用归类,不重复收编。)

**本仓目标形态:**
```
ariesfish/
  package.json          pi 声明 skills 与 extension
  pi/index.ts           扩展 取自 pstack-harness agent 工具组 loop mandate 注入
  skills/               dev-* 11 件迁入 升级 三栈新增 12 件
  references/           dev-workflow 已有 领域清单 pi-tools 映射
  adapters/control-web/ browser-harness fork 三处纠偏 自起/ARIA/冻结
  gates/(opt-in)        gate.sh 与 .sdlc 账本
  docs/                 四份文档  证据目录
```

## 路线图(摘要,全文见 docs/04)

- **P0** 地基可装(1-2 天)→ **P1** 意图链全通(3-5 天)→ **P2** 单点库 31 件(3-4 天)
- **P3** 验证心脏(1-2 周,唯一硬编码块:control-web fork + verify 生成器 + 独立裁决)
- **P4** mode/命令/自主成型(2-3 天)→ **P5(opt-in)** 账本与改进回路(1 周+)

实施纪律:每阶段端到端跑真实场景留证据(P3 铁律:没跑通的生成器是草稿)。

## 状态

- [x] 三栈分析(docs/01)+ dev-* 语料盘点(§0 基座,docs/03)
- [x] 融合架构与冲突裁决(docs/02,mode 定名 pie-mode)
- [x] 技能矩阵:dev-* 升级包 + 新增收编(docs/03)
- [x] 实施路线图(docs/04)
- [x] **P0 部分完成:dev-* 11 件已迁入 `skills/` 并同步 mattp@49dd158**(报告见 docs/05;含 GLOSSARY 改名、红证明、sub-issue、标签创建等七项上游收敛;待办:package.json + pi 扩展 vendor + mandate)
- [ ] P0 余下:pi 包骨架(package.json + pi/index.ts + 空 pie-mode)

> 命名已定:**pie-mode**(与 pi-agent 呼应,继承 XX-mode 命名传统)。mandate、mode 主体、matrix 三处统一使用。
