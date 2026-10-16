# 技能矩阵 v0.1:基座升级包 + 收录清单

> 处置标记:**C**=canonical(整份收编)、**F**=fork(收编但有改动,理由登记)、
> **M**=merge(多源合并)、**R**=reference(不收编,登记路由)、**D**=drop(不收,理由)、**N**=new(新写)。
>
> **计数(v0.1.1):基座 15(原 11 + 第二轮工程件 4,均已去除 dev- 前缀)+ 三栈新增 ~8 = ~23 核心件** + 扩展 + opt-in 账本。
> (v0 的 35 件估计下调:知识底座/意图链/实现组的主体已被基座吸收,不再从 mattp/addyosmani 重复收编。第二轮补缺见 docs/05 §4 检讨。

## §0 基座升级包矩阵(原 11 件,融合的核心工作表;第二轮 4 件工程件见下方 C/D 组)

> 已在用的 `~/.agents/skills/dev-*`(迁移时已去前缀,备份在 `~/.agents/dev-skills-backup-2026-10-15/`)是第一语料。升级方式限三种:**(a) 加节**(b) 加 references**(c) 互链路由**;
> 不改既有正文,文件头部登记一行 changelog。表右列即每件的升级工作清单。

| 基座件 | 已自带(保留不动) | 三栈升级包 |
|---|---|---|
| `align` | 一次一问 + 每问带推荐答案 + 中文跟随用户语言 + 懒建 CONTEXT/ADR + CONTEXT-MAP 多上下文 + 严格纯 glossary 纪律 | (c) pstack 的 AskQuestion 分类纪律:可实验定夺的不问人 → 互路由 `proto`;(a) 问题收敛时,为"值得立项的决定"打**三类验收标注候选**(check/evidence/judgment)记入对话,供 prd / spec 工厂吸收 |
| `code-map` | 固定 8 项输出结构 + 域概念先行 + 只读职责边界 | (b) pstack `how` 的多模型 explorer panel 可选并行(readonly 子代理);(c) 产出登记进 REPO.md 的"区域地图"索引节 |
| `repo-map` | REPO.md 导航地图五原则(navigation over coverage 等) | (a) 加"验证命令"节(与 verify 技能的 Launch/Doctor 互链);(b) addyosmani context-engineering 的"按步装载、不灌全文" |
| `diagnose` | 反馈环优先哲学("环即技能,其余机械")+ 10 种环构造法 + HITL 模板脚本 | (a) pstack 纪律:复现在前、修复在后的 commit 序列(sequence-verifiable-units);(a) **环冻结纪律:验证通过的复现环 = create-verification-skill 的 feature map 原料**(全部融合里最大的咬合点);(c) 性能症状先过 benchmark-checklist 再下结论 |
| `issues` | tracer-bullet 纵向切片 + HITL/AFK 分类 + vertical-slice-rules 硬块 | (b) addyosmani planning 的依赖图(canonical,以引用并入,切片条目加"依赖"字段);(b) mattp implement-spec 的 frontier 拓扑 + 后台 implementer + context pointers 稀交通信 |
| `prd` | deep module 提取确认("哪些模块要测试")+ PRD 模板 | (a) 验收标准节加**三类验收标注** —— PRD 与 SPEC 同构,后续可无缝升级为 SPEC 与 gate 化 |
| `proto` | logic/UI 双分支 + 六条规则 + "问题决定形状" | (a) pstack prototype playbook 的经验分叉裁决观:能用原型定夺的不问人;(c) 与 align 互路由 |
| `refact` | deep-module glossary(Module/Interface/Depth/Seam/Adapter/Leverage/Locality)+ deletion test | (a) 每个重构机会按 sequence-verifiable-units 排序交付(一次一机会一验证);(c) 重构输出走 review 镜头 4(CONSTRAINTS diff) |
| `setup` | docs/agents 三件套(issue-tracker/triage-labels/domain)+ ask-user 决策驱动 + dev-workflow.md 闭环地图 | (a) tracker 预置 profile 从两个扩到三个:local-markdown / GitHub / **addyosmani-tasks 文件式**(tasks/plan.md + todo.md);(a) 引导 CONSTRAINTS.md 初始化;(a) pstack setup 的 offer 模式:检测 verify 技能缺席 → 一次性提议 create-verification-skill,不纠缠 |
| `tdd` | 公共接口行为测试哲学 + 反横向切片声明 + tests/mocking references | (a) pstack **成本闸门节**:贵路径降级为最接近的可执行检查,decisions.tsv 留 `skip-test: <reason>`;(a) test-behavior 断言纪律("全部 import 返回 undefined 测试还能过 → 重写或删") |
| `triage-issue` | 状态机 + AGENT-BRIEF/OUT-OF-SCOPE 知识库 + AI 免责声明前缀 | (a) benny 归因思路:perf 类报告路由到 diagnose + benchmark 队而非普通 bug 队;(a) AGENT-BRIEF.md 模板并入三类验收标注 |

**散件说明**:`~/.agents/skills/` 里非 dev- 前缀的 `handoff`、`teach-me`、`skill-author`、`write-agents-md` 等保留原位,引用不迁入(dev-workflow 已引用 handoff)。

## 新增收编清单(三栈 → 基座 没有的席位)

### B. 意图链组新增(4)

| 技能 | 来源与处置 | 说明 |
|---|---|---|
| `spec`(SPEC 工厂,命令形态 /spec) | addyosmani spec-driven **F** | SPEC 模板(含模块递归 SPEC-<id>.md + map 索引)加三类验收标注节;权威源委托声明写法学 addyosmani("若与他技能冲突,以 X 为准");**prd 的 PRD 是它的上游输入**(对话 → align/PRD → SPEC),两级之间不重复访谈 |
| `wayfinder` | mattp **C** | 大雾工程(decision-ticket 地图,plan-don't-do)。独有,无竞争。P1 收编;**其 research 类票依赖 research,已随 2026-10 第二轮补齐** |
| `research` | mattp research **C(触发词)**(2026-10 第二轮补缺) | 后台调查:一手源 + 每论断带源 + Markdown 落盘。独立可用,兼作 wayfinder 的依赖件 |
| `constraints` | addyosmani constraint-driven **F** | CONSTRAINTS.md 行格式扩展为机器可读(维度/门槛/检查命令),成为 gate.sh 的 D 类门数据源;保留弱化监测一节与 Floor 兜底 |

### C. 实现组新增(4)

| 技能 | 来源与处置 | 说明 |
|---|---|---|
| ~~`build`~~ | addyosmani **F**(2026-10 P1.1 退役) | 单审批门 + 六停止条件 + SPEC 发现 + 恢复语义等自主协议,连同默认单任务模式,分别并入 `implement-all`(auto 模式)与 `implement`。理由:默认模式与 implement 重复 ~80%;"build" 名与自身步骤里的 `run the build` 撞车 |
| `implement` | mattp implement **C(引用改造+触发词,2026-10 第二轮补缺)** | 单票串行执行件:fetch ticket→复述标题→tdd 在预定缝→定期类型检查/单测→末尾全套件→code-review→commit。补上 issues 之后的执行断链 |
| `implement-all`(原 implement-spec,P1.1 更名+吸收 build auto) | mattp implement-spec **C** + addyosmani /build auto **M** | 整任务图双模式:**auto**(串行自主:单审批、六停止条件、恢复语义)/ **parallel**(多代理编排:integration branch + frontier + 后台 implementer 各自 worktree + merger 子代理 + 探索笔记仓外 + context pointers)。模式在开工前选定,frontier 宽度作默认启发 |
| `pi-dev-mode` 的 build/debug/perf/refactor playbook | pstack **F(以 mode 内嵌形式)** | feature/refactoring → 与 tdd/refact 对接的薄壳;bug-fix 复现纪律 → 并入 diagnose 升级;perf-issue/hillclimb 原样 |

### D. 验证评审组新增(5)——融合心脏

| 技能 | 来源与处置 | 说明 |
|---|---|---|
| `create-verification-skill` | pstack **C(F 路径)** | 生成 `.pi/skills/verify-<app>/`;五段 + feature map;**输入兼容 diagnose 冻结环** |
| `maintain-verification-skill` | pstack **C** | 并行源读 + live pass 防腐巡检 |
| `code-review` | mattp code-review **C(最新版 3da8c01+触发词,2026-10 第二轮补缺)** | 双轴评审(Standards/Spec)+ Fowler 味觉基线(repo 标准可覆盖)+ 前台双子代理。**独立单点件 + P2 `review` 管线的镜头 1 素材就位** |
| `review`(管线,N) | **N**(组装件) | 四镜头组装:①dev-code-review ②注释纪律(no-comments,R)③对抗(doubt 轻量 C / thermo 重型 R)④CONSTRAINTS diff;四 agent 并行 + 聚合去重加权;subagent 定义收编 code-reviewer、security-auditor 两个 |
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
| `pi-dev-mode` | **N** | 大 mode:路由表(02 §4)+ 精选 playbooks + principles 12 条精选索引 + 回复契约节 |
| `retro` | mattp retro **M**(pstack reflect/correct 吸收) | 读 Pi 会话日志找改进候选;落点学 correct 的"最高层级修复"(架构>类型>lint>测试>文档)|
| `use-the-stack` | **N** | 一页发现树(addyosmani using-agent-skills 的对应物,含 dev-workflow 闭环图更新版) |

## 放弃清单(v0.1 增补,带理由)

| 放弃 | 理由 |
|---|---|
| mattp `grilling`/`grill-with-docs`/`domain-modeling`/`zoom-out`/`to-spec`/`to-prd`/`to-issues`/`triage`/`tdd`/`diagnosing-bugs`/`prototype`/`improve-codebase-architecture` 整套 | 已被 基座 基座吸收或覆盖(§0),再收编即三份漂移源。**implement/implement-spec/code-review/research 四件原在此列,2026-10 第二轮纠正为真缺口并已收编——教训:上游删除或改名的件不等于不需要(见 docs/05 检讨)** |
| mattp `codebase-design` | 已被 refact 全量吸收(glossary 与 deep/shallow 图一字不差;references/LANGUAGE.md 即词汇文件),单独收编即重复 |
| mattp `pr` / `ask-matt` / `wizard` | pr 被 ship(P1)覆盖;ask-matt/wizard 是聊天玩具,无工程用途 |
| addyosmani `interview-me`/`idea-refine` | 并入 align 的 references(一次一问、发散收敛框架) |
| addyosmani `spec-driven` 的 to-prd 部分 / `planning-and-task-breakdown` 整件 | 前者被 prd 覆盖;后者以引用并入 issues 升级(依赖图 canonical)而非整收 |
| addyosmani `debugging-and-error-recovery`、`incremental-implementation`、`using-agent-skills`、`/test` 命令 | 分别被 diagnose、implement/build、use-the-stack、review 管线覆盖 |
| pstack 24 principles 只收 12(精选清单见 02)+ 23 playbooks 只带 ~10 | 融合栈按需精选;其余靠已装 pstack-harness 时自然可用(R) |
| pstack `unslop`/`technical-writing` 本体 | 少量条款并入 pi-dev-mode 回复契约;整件不收 |

## principles 精选(12/24)
core:laziness-protocol、foundational-thinking、subtract-before-you-add、build-the-lever、exhaust-the-design-space;
架构:model-the-domain(与 align/refact 互引)、boundary-discipline、type-system-discipline;
验证 5 条全收:prove-it-works、fix-root-causes、sequence-verifiable-units、test-behavior-not-implementation、explain-the-number;
delegation:guard-the-context-window。

## §0.1 P1.2 增补(pie dogfood 观察:setup 的自动路由)

观察:pie 的实际使用是"直接开工"型,setup 从未被跑;依赖技能缺配置时只会"停下来让用户去跑 setup"——配置成了前置仪式,与真实使用方式冲突。

改造(2026-10):
- **技能层**:issues / prd / triage-issue 缺配置时**就地自举**——按仓库证据推断 tracker(git remote→GitHub;tasks/plan.md→Tasks files;.scratch→local markdown;默认与无远端→Tasks files),一次带推荐答案的确认,当场种子 docs/agents/,继续被打断的工作。setup 降位为"郑重的全量配置/换 tracker"入口
- **扩展层**:prompt.ts 新增 `pi-dev-repo-state` section——cwd 无 GLOSSARY/tracker 配置时注入缺席清单与自举提示(全配置仓库零成本:不注入;depth≥1 子代理不注入)
- **路由层**:pi-dev-mode 路由表首行 + mandate setup 行更新,"no detour" 语义

### §0.1.1 P1.3 三层自举阶梯(用户补充)

结论性证据 → 一次带推荐的确认;**证据缺席或冲突 → `ask_user` 让用户选,选项各自携带仓库证据**(或证据缺席的说明),并给推荐默认;绝不发明仓库没有证据的 tracker。

### P2 收编落地记录(2026-10)

| 件 | 处置实施 |
|---|---|
| `doubt` | addyosmani doubt-driven **F**:五步循环(CLAIM/EXTRACT/DOUBT/RECONCILE/STOP)保留;评审者=readonly 后台 agent(pi 原生);跨模型段收敛为"异构家族 reviewer 一问";CLI 管道段删(pi 的 model 参数即跨模型); nests 场景降级自审并标注 degraded |
| `retro` | **M** 合成:mattp retro 环境/检查/标准/操纵/访问类别为底(readme #1240 的 writing-for-agents 依赖内联为样式块);pstack reflect 吸收(发现 routed 到具体编辑、批后应用、结构化执法检查);pstack correct 吸收(最高层级执法阶梯表 + rule↔enforcement 配对) |
| `review` | **N** 四镜头管线:镜头1 指针挂 `code-review`;镜头2 注释纪律内联(pstack no-comments 核心,无 comment-sicko 依赖);镜头3 doubt 对抗 prompt;镜头4 constraints 差异审计;聚合=分镜展示后去重加权,裁决词表 APPROVE/REQUEST CHANGES/INCONCLUSIVE |
| `benchmark-checklist` | pstack **C** 正文一字不改(diff 校验过);frontmatter 加中文触发词、去 disable-model-invocation |
| agents/ | code-reviewer(addyosmani F,Composition 本地化)、security-auditor(同)——注册为 `pi-dev:*` subagent 类型 |
| references/ | addyosmani 7 清单原文收拢 + 映射 README(原文 addyosmani 名→本栈名) |

### P2.5 落地(2026-10):eval 技能 + 用例库

- `eval`(N 合成):pstack Eval playbook(盲评纪律、transcript 验链、promote/reject 合成)+ addyosmani evals(fires/stays-quiet 用例库、graders、skill-impact 拒案账本);pi 原生化(候选=无扩展无全局技能的 headless `pi -p --skill <树>`;判分者以 @file 附 transcript)
- `evals/`:README 格式 + skill-impact 账本 + 首批 5 用例(review:fires/stays-quiet 各一、benchmark-checklist:fires、tdd:成本闸门、issues:自举非墙)
- retro 第 5 步升级:实质技能编辑必须过 eval 门才应用;拒绝入账本
- check-skills.py 扩展:evals 结构校验 + 候选面泄题 lint(技能名/元词)

### P2.6 落地(2026-10-16,pie 观察三)

- 观察:pie 会话(显式 /skill:pi-dev-mode 展开)把"多块工作"路由给 implement("Routing:这是 implement 级别的多块工作")——多区域 blob 没有再拆分规则。
- 修复:pi-dev-mode 路由表加 Scope test 行 + implement 技能加 scope check(多区域拒收 → issues → implement-all)+ mandate 一行 + use-the-stack 标注。
- **eval 门:PASS**(evals/implement/multi-area-block,Mode A,deepseek,扩展在场):候选把任务定性为"出 SPEC → 按票改三块"并拒绝单 pass 实现;对照组(无 mandate)则回答"逐个区域改"。期间固化两条配方:dialogue 类候选限 `--tools read`(全量工具会无限考古);路由类用例必须带扩展(mandate 是产品的一部分)。
- 运行期发现(记录):同名工具冲突时 pi 报错拒载第二份(ours vs ours 双份实测);pi-subagents 注册名不冲突,共存无恙。
