# 技能矩阵 v0.1:dev-* 升级包 + 收录清单

> 处置标记:**C**=canonical(整份收编)、**F**=fork(收编但有改动,理由登记)、
> **M**=merge(多源合并)、**R**=reference(不收编,登记路由)、**D**=drop(不收,理由)、**N**=new(新写)。
>
> **计数修正(v0.1):dev-* 基座 11 + 三栈新增 ~12 = ~23 核心件** + 扩展 + opt-in 账本。
> (v0 的 35 件估计下调:知识底座/意图链/实现组的主体已被 dev-* 基座吸收,不再从 mattp/addyosmani 重复收编。)

## §0 dev-* 基座升级包矩阵(11 件,融合的核心工作表)

> 已在用的 `~/.agents/skills/dev-*` 是第一语料。升级方式限三种:**(a) 加节**(b) 加 references**(c) 互链路由**;
> 不改既有正文,文件头部登记一行 changelog。表右列即每件的升级工作清单。

| 基座件 | 已自带(保留不动) | 三栈升级包 |
|---|---|---|
| `dev-align` | 一次一问 + 每问带推荐答案 + 中文跟随用户语言 + 懒建 CONTEXT/ADR + CONTEXT-MAP 多上下文 + 严格纯 glossary 纪律 | (c) pstack 的 AskQuestion 分类纪律:可实验定夺的不问人 → 互路由 `dev-proto`;(a) 问题收敛时,为"值得立项的决定"打**三类验收标注候选**(check/evidence/judgment)记入对话,供 dev-prd / spec 工厂吸收 |
| `dev-code-map` | 固定 8 项输出结构 + 域概念先行 + 只读职责边界 | (b) pstack `how` 的多模型 explorer panel 可选并行(readonly 子代理);(c) 产出登记进 REPO.md 的"区域地图"索引节 |
| `dev-repo-map` | REPO.md 导航地图五原则(navigation over coverage 等) | (a) 加"验证命令"节(与 verify 技能的 Launch/Doctor 互链);(b) addyosmani context-engineering 的"按步装载、不灌全文" |
| `dev-diagnose` | 反馈环优先哲学("环即技能,其余机械")+ 10 种环构造法 + HITL 模板脚本 | (a) pstack 纪律:复现在前、修复在后的 commit 序列(sequence-verifiable-units);(a) **环冻结纪律:验证通过的复现环 = create-verification-skill 的 feature map 原料**(全部融合里最大的咬合点);(c) 性能症状先过 benchmark-checklist 再下结论 |
| `dev-issues` | tracer-bullet 纵向切片 + HITL/AFK 分类 + vertical-slice-rules 硬块 | (b) addyosmani planning 的依赖图(canonical,以引用并入,切片条目加"依赖"字段);(b) mattp implement-spec 的 frontier 拓扑 + 后台 implementer + context pointers 稀交通信 |
| `dev-prd` | deep module 提取确认("哪些模块要测试")+ PRD 模板 | (a) 验收标准节加**三类验收标注** —— PRD 与 SPEC 同构,后续可无缝升级为 SPEC 与 gate 化 |
| `dev-proto` | logic/UI 双分支 + 六条规则 + "问题决定形状" | (a) pstack prototype playbook 的经验分叉裁决观:能用原型定夺的不问人;(c) 与 dev-align 互路由 |
| `dev-refact` | deep-module glossary(Module/Interface/Depth/Seam/Adapter/Leverage/Locality)+ deletion test | (a) 每个重构机会按 sequence-verifiable-units 排序交付(一次一机会一验证);(c) 重构输出走 review 镜头 4(CONSTRAINTS diff) |
| `dev-setup` | docs/agents 三件套(issue-tracker/triage-labels/domain)+ ask-user 决策驱动 + dev-workflow.md 闭环地图 | (a) tracker 预置 profile 从两个扩到三个:local-markdown / GitHub / **addyosmani-tasks 文件式**(tasks/plan.md + todo.md);(a) 引导 CONSTRAINTS.md 初始化;(a) pstack setup 的 offer 模式:检测 verify 技能缺席 → 一次性提议 create-verification-skill,不纠缠 |
| `dev-tdd` | 公共接口行为测试哲学 + 反横向切片声明 + tests/mocking references | (a) pstack **成本闸门节**:贵路径降级为最接近的可执行检查,decisions.tsv 留 `skip-test: <reason>`;(a) test-behavior 断言纪律("全部 import 返回 undefined 测试还能过 → 重写或删") |
| `dev-triage-issue` | 状态机 + AGENT-BRIEF/OUT-OF-SCOPE 知识库 + AI 免责声明前缀 | (a) benny 归因思路:perf 类报告路由到 dev-diagnose + benchmark 队而非普通 bug 队;(a) AGENT-BRIEF.md 模板并入三类验收标注 |

**散件说明**:`~/.agents/skills/` 里非 dev- 前缀的 `handoff`、`teach-me`、`skill-author`、`write-agents-md` 等保留原位,引用不迁入(dev-workflow 已引用 handoff)。

## 新增收编清单(三栈 → dev-* 没有的席位)

### B. 意图链组新增(3)

| 技能 | 来源与处置 | 说明 |
|---|---|---|
| `spec`(SPEC 工厂,命令形态 /spec) | addyosmani spec-driven **F** | SPEC 模板(含模块递归 SPEC-<id>.md + map 索引)加三类验收标注节;权威源委托声明写法学 addyosmani("若与他技能冲突,以 X 为准");**dev-prd 的 PRD 是它的上游输入**(对话 → dev-align/PRD → SPEC),两级之间不重复访谈 |
| `wayfinder` | mattp **C** | 大雾工程(decision-ticket 地图,plan-don't-do)。独有,无竞争 |
| `constraints` | addyosmani constraint-driven **F** | CONSTRAINTS.md 行格式扩展为机器可读(维度/门槛/检查命令),成为 gate.sh 的 D 类门数据源;保留弱化监测一节与 Floor 兜底 |

### C. 实现组新增(2)

| 技能 | 来源与处置 | 说明 |
|---|---|---|
| `build`(命令 /build、/build auto) | addyosmani **F** | 单审批门 + 六停止条件 + 每任务一提交。改动:SPEC 检查兼容本地 tracker profile 与 PRD 升级;高风险停止条件指向 doubt 镜头;恢复语义保留 |
| `pie-mode` 的 build/debug/perf/refactor playbook | pstack **F(以 mode 内嵌形式)** | feature/refactoring → 与 dev-tdd/dev-refact 对接的薄壳;bug-fix 的复现纪律 → 已并入 dev-diagnose 升级;perf-issue/hillclimb 原样 |

### D. 验证评审组新增(5)——融合心脏

| 技能 | 来源与处置 | 说明 |
|---|---|---|
| `create-verification-skill` | pstack **C(F 路径)** | 生成 `.pi/skills/verify-<app>/`;五段 + feature map;**输入兼容 dev-diagnose 冻结环** |
| `maintain-verification-skill` | pstack **C** | 并行源读 + live pass 防腐巡检 |
| `review`(管线,N) | **N**(内容 M 四源) | 四镜头:①五轴静态(mattp+addyosmani code-review 合并)②注释纪律(no-comments,R)③对抗(doubt 轻量 C / thermo 重型 R)④CONSTRAINTS diff;四 agent 并行 + 聚合去重加权;subagent 定义收编 code-reviewer、security-auditor 两个 |
| `benchmark-checklist` | pstack **C** | 一字不改 |
| `doubt` | addyosmani doubt-driven **C** | 新鲜上下文对抗评审;独立用于高风险签核,也作 review 第三镜头 |

### E. 性能发布组新增(3)

| 技能 | 来源与处置 | 说明 |
|---|---|---|
| `perf`(playbook)| pstack perf-issue + hillclimb **C(F 入 mode)** | 基线 → 修复 → 复测;基准必过 benchmark;addyosmani 的 perf/accessibility/observability 清单收作 references 镜头;/webperf 独立命令 D |
| `ship` | pstack shipping/babysit/opening-a-pr **C(F 入 mode + R 脚本)** | 独立裁决 + patch-id + 连续验证段;addyosmani shipping-and-launch 的 prod 上线清单并入"上线前检查"节;watch-pr/orch 脚本 vendor |
| `verify`(项目技能,pstack 生成的产物) | — | 非本栈技能,契约:Launch/Doctor/Drive/Evidence/Cleanup |

### F. 元技能组新增(3)

| 技能 | 来源与处置 | 说明 |
|---|---|---|
| `pie-mode` | **N** | 大 mode:路由表(02 §4)+ 精选 playbooks + principles 12 条精选索引 + 回复契约节 |
| `retro` | mattp retro **M**(pstack reflect/correct 吸收) | 读 Pi 会话日志找改进候选;落点学 correct 的"最高层级修复"(架构>类型>lint>测试>文档)|
| `use-the-stack` | **N** | 一页发现树(addyosmani using-agent-skills 的对应物,含 dev-workflow 闭环图更新版) |

## 放弃清单(v0.1 增补,带理由)

| 放弃 | 理由 |
|---|---|
| mattp `grilling`/`grill-with-docs`/`domain-modeling`/`zoom-out`/`to-spec`/`to-prd`/`to-issues`/`triage`/`tdd`/`diagnosing-bugs`/`prototype`/`improve-codebase-architecture`/`implement`/`implement-spec` 整套 | 已被 dev-* 基座吸收或覆盖(§0),再收编即三份漂移源 |
| addyosmani `interview-me`/`idea-refine` | 并入 dev-align 的 references(一次一问、发散收敛框架) |
| addyosmani `spec-driven` 的 to-prd 部分 / `planning-and-task-breakdown` 整件 | 前者被 dev-prd 覆盖;后者以引用并入 dev-issues 升级(依赖图 canonical)而非整收 |
| addyosmani `debugging-and-error-recovery`、`incremental-implementation`、`using-agent-skills`、`/test` 命令 | 分别被 dev-diagnose、dev-tdd/build、use-the-stack、review 管线覆盖 |
| pstack 24 principles 只收 12(精选清单见 02)+ 23 playbooks 只带 ~10 | 融合栈按需精选;其余靠已装 pstack-harness 时自然可用(R) |
| pstack `unslop`/`technical-writing` 本体 | 少量条款并入 pie-mode 回复契约;整件不收 |

## principles 精选(12/24)
core:laziness-protocol、foundational-thinking、subtract-before-you-add、build-the-lever、exhaust-the-design-space;
架构:model-the-domain(与 dev-align/dev-refact 互引)、boundary-discipline、type-system-discipline;
验证 5 条全收:prove-it-works、fix-root-causes、sequence-verifiable-units、test-behavior-not-implementation、explain-the-number;
delegation:guard-the-context-window。
