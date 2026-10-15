# 三栈深度分析:pstack / mattp / addyosmani

> 本文是融合计划(02/03/04)的事实底座。pstack 部分浓缩自本仓库前几轮的分析
> (`../pstack`、`../pstack-harness` 的逐文件阅读),mattp 与 addyosmani 为本轮深读。

## 0. 一句话画像

| 栈 | 一句话 | 核心隐喻 | 单位 |
|---|---|---|---|
| **pstack** | "没有证据的吞吐一钱不值" | 法庭:每个论断带证据,裁决来自没写代码的人 | 任务/PR |
| **mattp** | "先有共享语言,才有可执行工作" | 工坊:小而锋利的手工具,匠人自己改 | 议题(ticket) |
| **addyosmani** | "把生命周期变成命令,把质量变成数据" | 生产线:DEFINE→SHIP 六工位, CONSTRAINTS 是图纸公差 | 生命周期阶段 |

三者几乎不重叠的部分大于重叠部分 → 融合的期望收益高。

## 1. pstack:验证的心脏

### 1.1 理念
- 反吞吐崇拜:"throughput without quality is not a goal";目标是"write less, but higher quality code"
- 验证不等人:验证是最慢的一步,因为通常等人;让 agent 能自己验证,人才能从瓶颈中解放
- 反纯计划:"the best spec is code"——所以它没有 intake/需求工程,一切从成形的 prompt 开始(这是靠 mattp 补的)

### 1.2 可收割资产(按融合价值排序)
1. **验证机器**:`create-verification-skill` 生成器(Launch/Doctor/Drive/Evidence/Cleanup 五段 + feature map 四 H2)+ `maintain-verification-skill` 防腐巡检 + benny 的 control-adapter 契约(Bring up/Drive/Inspect/Screenshot/Recording/Cleanup)
2. **数字纪律**:`benchmark-checklist` 七问(瓶颈/调优/物理极限/错误/复现/端到端占比/工作确实发生),结论词表 {faster, slower, no-diff, inconclusive}
3. **独立裁决**:Shipping playbook——每 PR 一个**没写代码的验证者**,"Green CI 不是裁决,因为没人以用户身份跑过它";patch-id 覆盖判定;连续验证段自底向上落地
4. **路由模式**:poteto-mode(23 playbooks,步骤逐字拷贝成 todo,skip 必须留痕)+ mandate 常驻注入(`hooks/session-start-context.md` ~20 行,三条命中条件)
5. **24 principles**:行为规则原子(验证组 5 条:prove-it-works / fix-root-causes / sequence-verifiable-units / test-behavior-not-implementation / explain-the-number 最核心)
6. **回复契约**:"每个论断同句携带证据或标签"、证据工件不被 cleanup 删除
7. **多模型异构**:面板角色强制与作者不同家族;"两个不同模型都同意是高信号"
8. **pstack-harness 的 Pi 实施**(可整体取用的底座):pi 扩展(agent/send_message/schedule_wakeup 工具组 + settle-hold + sleep 反轮询 + mandate 每轮注入)+ "技能保留 Claude 原文、一份 pi-tools.md 做枢纽映射"的适配层模式 + 40 行等价表(把 prove-it-works 用在移植自己身上)

### 1.3 融合时的短板
- 宿主耦合深(已被 harness 解决)
- 无 intake、无 release/observe(mattp/addyosmani 补 intake;observe 仍需自建)
- 刻意反计划——它绝不会主动写 SPEC,得靠路由把它接进意图链
- 单测歧视倾向:"unit tests show branch behavior, not bug absence"——与 addyosmani 的 TDD 中心论有张力(裁决见 02 文档 §5.3)

## 2. mattp:领域语言与议题管道

### 2.1 理念
- **反流程所有权**(README 原文点名 GSD/BMAD/Spec-Kit):技能应该 small, easy to adapt, composable,任何模型可用,"Hack around with them. Make them your own"
- **领域语言即压缩**:GLOSSARY/CONTEXT 不是文档表演,是省 token、防命名漂移
- **议题跟踪器是执行边界**:无人值守 agent 需要持久规格,不是聊天摘要;tracker 是交接媒介
- **纵向切片**:贯穿所有层的细曳光弹,拒绝横向分层规划
- **缝优先**:先定测试缝,最少的缝,最高位置的缝

### 2.2 乘数结构(引用 mattp 仓库内已有中文分析 SKILLS.md)

```
setup-matt-pocock-skills ──写──> docs/agents/{issue-tracker, domain, triage-labels}.md
        │
grill-with-docs = grilling + domain-modeling ──写──> CONTEXT.md, GLOSSARY.md, docs/adr/
        │(共享语言就位)
to-prd ──> PRD 议题 ──> to-tickets ──> 纵向切片任务图(frontier 拓扑)
        │                                    │
triage(五标签状态机)                 implement-spec(集成分支 + 后台 implementer 子代理,
        │                               通过 context pointers 稀交通信)
        └──> tdd / diagnosing-bugs(红绿 + 诊断反馈环)
                     │
        retro / zoom-out / improve-codebase-architecture(摩擦反哺架构)
```

### 2.3 独有资产(其他两栈没有的)
1. **`grilling` + `domain-modeling`**:持续追问 + 边问边落 GLOSSARY/ADR——需求澄清与知识沉淀同时发生。grill-with-docs 只是两者的组合入口
2. **`wayfinder`**:大雾工程(一次会话装不下)→ 在 tracker 上建"决策票地图"(map 是索引,decision ticket 是唯一事实存放点;"plan, don't do"),逐票推进到路清晰为止。这是三栈中唯一处理"超大会话工程"的机制
3. **`implement-spec`**:任务图 + frontier 并行 + 后台 implementer 子代理 + context pointers 稀交通信——多代理协作规范比 pstack swarm 更落地
4. **tracker 抽象层**:setup 一次配置(`docs/agents/issue-tracker.md`),GitHub/local-markdown 开箱即用,五标签分诊词汇表(needs-triage/needs-info/ready-for-agent/ready-for-human/wontfix)可映射既有标签
5. **`retro` / `zoom-out`**:复盘读会话日志找改进候选;跳出局部视角的代码地图
6. **handoff / writing-for-agents**:交接与写给 agent 读的文档规范

### 2.4 融合时的短板
- 验证闸门只有 tdd 和 diagnose 的自测;无独立验证者、无证据工件、无 perf 纪律
- 无发布端(止于 PR 意图)
- `disable-model-invocation: true` 大量使用 → 纯人工触发,没有自动路由(没有 mandate 等价物)
- 散装入口:技能之间契约靠 setup 产物软连接,缺一张总路由

## 3. addyosmani:生命周期命令化与质量合同

### 3.1 理念
- **生命周期即命令**:DEFINE(/spec)→ PLAN(/plan)→ BUILD(/build)→ VERIFY(/test)→ REVIEW(/review)→ SHIP(/ship),另有 /constraints /webperf /code-simplify
- **技能按"正在做什么"自动激活**(using-agent-skills 是显式路由树 + frontmatter description 隐式路由)
- **质量外置成数据**:"判断移出你的脑袋,进到围绕循环运行的检查里;检查需要存在、需要你选的数字、需要在离工作足够近的地方触发"——CONSTRAINTS.md 是带数字的合同
- **自主但有刹车**:/build auto 单人审批门 → 每任务 RED-GREEN-回归-构建-提交-标记,停止条件六条(测试过不去/规范歧义/高风险不可逆→doubt-driven 走签核),每任务一提交保证任意点干净回滚

### 3.2 独有资产
1. **`spec-driven-development`**:SPEC.md 合同(问题/方案/用户故事/验收/结构),**模块递归**(每个模块自己的 SPEC-<id>.md,map 是索引)+ 权威源委托声明("planning-and-task-breakdown is the canonical source, 若冲突以它为准"——技能间引用纪律)
2. **`constraint-driven-development`**:质量维度访谈 → 带门槛数字的 CONSTRAINTS.md → **diff 弱化监测**(@ts-ignore 新增、eslint-disable、被删测试、断言剥离、门槛调低)+ 非交互场景的 Floor 兜底
3. **`/build auto`**:见上,自主循环的停止条件与回滚纪律是三栈最完整的
4. **`doubt-driven-development`**:每个非平凡决策过一遍**新鲜上下文**的对抗评审(harness 里的 thermos 是它的重型版)
5. **4 个评审 subagent 定义**(code-reviewer/security-auditor/test-engineer/web-performance-auditor)+ **7 份 references 检查清单**(definition-of-done/security/performance/accessibility/observability/testing-patterns/orchestration-patterns)
6. **`browser-testing-with-devtools`**:真实浏览器测试(Chrome DevTools MCP)——三栈中唯一自带浏览器验证入口
7. **hooks 治理样本**:sdd-cache(带 304 再验证的跨会话缓存,solve了"每次 fetch 官方文档"的成本)、simplify-ignore——Claude Code hook 模式,Pi 上需要 extension 等价物

### 3.3 融合时的短板
- 验证仍是"自己写的测试自己过"——没有独立验证者,没有 pstack 的证据严格性
- 无数字纪律:budget/perf 声明无七问把关
- 命令面向 Claude Code TOML;Pi 需要转 skills + 注册命令
- 大而全(25 技能)与 mattp 的小工具哲学有张力(裁决见 02 §5.2)

## 4. 三方互性总表

| 能力 | mattp | addyosmani | pstack | 主缺口 |
|---|---|---|---|---|
| 需求澄清 | grilling/需求访谈 | interview-me / idea-refine | sharpen(上游已弃) | 无—one-人访谈有,但**边问边沉淀领域文档**只有 mattp |
| 领域模型 | domain-modeling(GLOSSARY/ADR) | documentation-and-adrs | 无 | — |
| 大雾工程 | wayfinder(决策票) | 无 | multi-phase-plan/orchestrate(执行侧) | wayfinder 管"找路",orchestrate 管"走路"——天然互补 |
| 规格化 | to-prd/to-spec | spec-driven(SPEC.md+模块递归) | 无(反计划) | 两者格式不同但可统一;**验收标准三类标注**(check/evidence/judgment)是我方设计稿带来的增量 |
| 任务分解 | to-tickets(任务图+frontier) | planning-and-task-breakdown(依赖图+纵向切片,canonical) | figure-it-out/multi-phase | mattp 挂 tracker、addyosmani 挂文件系统 |
| 分诊 | triage(五标签状态机) | 无 | benny triage(上游,被排除) | — |
| TDD | tdd(一测一实现) | test-driven-development(红绿重构) | tdd(便宜才写) | 三份重复,合并裁决 |
| 自主循环 | loop-me(in-progress) | /build auto(停止条件+回滚) | autonomous-run/orchestrate + /loop(pstack-harness) | pstack 出基础设施,addyosmani 出停止条件 |
| 调试 | diagnosing-bugs | debugging-and-error-recovery | bug-fix playbook(复现优先+二分) | pstack 最严格 |
| 评审 | code-review | code-review-and-quality(五轴)+4 subagents | no-comments/interrogate/thermo-nuclear | 需要**统一评审管线**而非四个并发入口 |
| 质量门 | 无 | CONSTRAINTS.md(数据化) | benchmark-checklist(一次性审查) | **CONSTRAINTS 作为 gate 数据源**是融合最大增量之一 |
| 性能 | 无 | performance-optimization + /webperf + web-performance-auditor | perf-issue/hillclimb/benchmark-checklist | addyosmani 出领域清单,pstack 出测量纪律 |
| 验证 | tdd 自测 | /test(测试即证明) | **验证机器**(verify skill+feature map+证据+独立裁决) | pstack 独有护城河 |
| 发布 | 无 | shipping-and-launch + /ship | shipping/babysit/opening-a-pr(patch-id+连续验证段) | pstack 最硬核,补 addyosmani 的清单化 |
| 复盘/元 | retro/zoom-out/correct 类 | 无 | reflect/correct/eval | 三者相近,合并 |

## 5. 我方已有资产(直接进入融合)
1. `../sdlc-unified-design.md`:10 阶段状态机、门谓词(D 类脚本/A 类裁决)、产物契约、验收标准三类标注、宿主 4 原则——作为**工件契约层与可选账本**吸收
2. `../../browser-harness`:control-web 供体(CDP 骨架 + interaction-skills 17 篇 + domain-skills 复利机制),需 fork 三处(自起隔离实例/ARIA 优先/helper 冻结)
3. `../pstack-harness/pi/`:Pi 扩展可整体取用(agent 工具组 + wake/loop + settle-hold + mandate 注入模式)

## 6. 融合的四个不可能三角提示(裁决预告)
融合不是堆叠,以下张力必须有明确裁决(全文见 02-fusion-architecture §5):
1. **流程所有权 vs 工件驱动**:mattp 反流程所有权 vs addyosmani 的命令管线 vs 我方状态机
2. **单测即证明 vs 独立裁决**:addyosmani vs pstack 的验证哲学
3. **自动路由 vs 显式控制**:pstack mandate vs mattp 的 disable-model-invocation
4. **大而全 vs 小工具**:25 技能 pack vs mattp 精简可改
