# pi-dev-mode

以你自己的 15 件基座技能(源自 `~/.agents/skills/dev-*`,2026-10 迁入并去前缀)为底座,融合 pstack、mattp、addyosmani 三栈升级的 pi-agent 技能栈,mode 定名 **pi-dev-mode**。
**大 mode 一键进场,单点技能独立爆破,工件契约是心脏。**

```
基座(15件) →基座 宿主      align code/diagnose issues implement* prd proto refact repo research review setup tdd triage
pstack      →升级包 验证的心脏    证据标准 独立裁决 数字纪律 verify 生成器 反馈环冻结复用
mattp       →血统确认          grilling domain 哲学 tracker 管道 + 工程件第二轮补齐已在 基座 落地
addyosmani  →升级包 生命周期与质量合同  SPEC CONSTRAINTS 三类验收标注 停止条件(已并入 implement-all auto)
```

融合原则:**基座 是宿主,三栈是升级包,不推翻、可回滚**(见 docs/02 §7)。

## 文档地图

| 文档 | 内容 | 什么时候读 |
|---|---|---|
| [docs/01-analysis-three-stacks.md](docs/01-analysis-three-stacks.md) | 三栈深度分析与互性矩阵、我方既有资产对账 | 想知道"为什么这样融合" |
| [docs/02-fusion-architecture.md](docs/02-fusion-architecture.md) | 四层架构、工件契约、路由表、八条冲突裁决、**§7 基座 基座策略** | 想知道"融合成什么样" |
| [docs/03-skill-matrix.md](docs/03-skill-matrix.md) | **§0 基座 升级包矩阵(11 件逐件升级项)** + 新增收编/放弃清单 | 找某个技能的出处与处置 |
| [docs/04-implementation.md](docs/04-implementation.md) | P0-P5 路线图(基于 基座 迁入路径)、每阶段验收标准、风险登记 | 动手实施 |

## 一页总览

**三层使用方式:**
1. 大 mode:`/skill:pi-dev-mode` 或让它经 mandate 自动进场——路由表按"阶段 × 类型 × 雾级"派发
2. 显式技能直调:`/skill:spec` `/skill:implement-all`(auto / parallel 模式)`/skill:code-review` …(独立执行技能无生命周期命令层,直接用具名技能)
3. 单点:`/skill:align`、`/skill:benchmark-checklist`、`/skill:constraints`……任何技能独立跑,靠工件在场咬合,不在场就降级

**技能构成:P2.5 后 25 件** = 基座 15 + P1 新增 5(pi-dev-mode、spec、constraints、wayfinder、use-the-stack)+ P2 新增 5(**doubt、retro、review 四镜头管线、benchmark-checklist、eval**)+ agents×2(code-reviewer/security-auditor)+ references×7 + evals/ 用例库 5 例。P3 待增:verify 双件 + control-web + ship(perf playbook)。**
(散件说明:`~/.agents/skills/` 里留下的 `handoff` 等散件按引用归类,不重复收编。旧 dev-* 原件备份在 `~/.agents/dev-skills-backup-2026-10-15/`。)

**仓库当前形态(P0 完成):**
```
pi-dev-mode/
  package.json          pi 声明 skills 与 extensions(vendored @pstack-claude 94f5ce9,见 NOTICE-pi-extension.md)
  pi/index.ts +(12件)   扩展:agent/send_message/schedule_wakeup 工具组 + /loop + mandate 注入 + settle-hold + sleep 反轮询
  hooks/session-start-context.md   路由 mandate(pi-dev 进场条件)
  references/           pi-host.md 宿主映射 v0
  models.json           家族别名解析表(anthropic/openai/openai-codex)
  skills/               16 件(15 基座 + pi-dev-mode 骨架)
  adapters/control-web/ (P3)browser-harness fork
  gates/(opt-in)        (P5)
  docs/                 五份文档 + 证据目录
```

## 路线图(摘要,全文见 docs/04)

- **P0** 地基可装(1-2 天)→ **P1** 意图链全通(3-5 天)→ **P2** 单点库 31 件(3-4 天)
- **P3** 验证心脏(1-2 周,唯一硬编码块:control-web fork + verify 生成器 + 独立裁决)
- **P4** mode/命令/自主成型(2-3 天)→ **P5(opt-in)** 账本与改进回路(1 周+)

实施纪律:每阶段端到端跑真实场景留证据(P3 铁律:没跑通的生成器是草稿)。

## 状态

- [x] 三栈分析(docs/01)+ 基座 语料盘点(§0 基座,docs/03)
- [x] 融合架构与冲突裁决(docs/02,mode 定名 pi-dev-mode)
- [x] 技能矩阵:基座 升级包 + 新增收编;**2026-10 第二轮补齐 implement/implement-spec/code-review/research 四件工程缺口**(基座 11→15,见 docs/05 检讨)
- [x] 实施路线图(docs/04)
- [x] **P0 地基完成**:基座 15 件迁入同步(mattp@49dd158,docs/05)+ 前缀去除 + pi 扩展 vendor(@94f5ce9 條款见 NOTICE-pi-extension.md)+ package.json + mandate + pi-dev-mode 骨架。静态检查全绿(13 文件 bun transpile OK / models.json / 16 SKILL.md frontmatter)
- [x] **P0 真机冒烟通过(2026-10-15,证据 docs/evidence/p0-smoke-2026-10-15.md)**:安装一致/工具组共存/隔离加载/事件注入全绿;**发现并修复:pi 对 reasoning 模型发 developer 角色、中继不认则整体丢消息——models.json 加 `compat.supportsDeveloperRole: false` 即修(2026-10-16 wire 级定位,见 docs/evidence/developer-role-2026-10-16.md)**待交互项:/loop 实战、后台 agent、ask_user UI
- [x] **P2.5 eval 门落地(2026-10)**:eval 技能(pstack 盲评 + addyosmani 用例库合成)+ evals/ 首批 5 用例 + skill-impact 拒案账本;retro 实质技能编辑改走 eval 门;check-skills.py 增 evals 结构与泄题 lint
- [x] **P2.5 触发回归一轮(2026-10-17,evidence docs/evidence/eval-regression-2026-10-17.md)**:6 用例 7 跑次,门位全 PASS(multi-area 路由档经 mandate 正确读路由技能落 implement-all 且拒绝单趟;stays-quiet 全静默);基线档控制观察与用例 fixture 缺口 2 条入 retro 候选
- [x] **P2 单点库完成（静态，2026-10）**：doubt（F）/retro（M 合成）/review（N 四镜头）/benchmark-checklist（C 一字不改）+ 评审 subagent ×2 + references 七清单收拢；**真机验收 2026-10-17 通过（evidence docs/evidence/p2-live-acceptance-2026-10-17.md，靶场 harness/pie）**：四镜头对真实 diff 聚合报告完备（独立包形态；产品环境双 agent 工具歧义 1 缺陷入 retro）、七问对真实计时全绿（顺手抓出 pie main 红型）、六类路由抽查主轴 6/6；retro 候选累计 4 项
- [x] **P1 意图链完成(静态)**:七件基座升级(§0 矩阵:align 三标签播种/proto 互路、prd 三标签节、issues 任务图语义、diagnose RED-GREEN 提交序列+冻结环+perf 纪律、setup 三 tracker profile+一次性 offer、tdd 成本闸门+断言纪律、triage perf 分流与三标签 brief)+ 新增 spec/build/constraints/wayfinder/use-the-stack。静态验收:21 件 frontmatter/触发词/交叉引用/契约互通全绿;**真机 e2e 2026-10-17 通过（evidence docs/evidence/p1/p1-e2e-2026-10-17.md，靶场 harness/pie：align 拷打四决策→prd 三层验收→spec 审批门→issues 单链四票→implement-all auto 全落地，884 用例全绿+四票 tsv 留痕；前哨直连实现跑团入 retro 候选 E，视觉取证链路入 F）**

> 命名已定:**pi-dev-mode**(与 pi-agent 呼应,继承 XX-mode 命名传统)。mandate、mode 主体、matrix 三处统一使用。
