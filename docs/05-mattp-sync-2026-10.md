# mattp 上游同步报告(2026-10,sync @49dd158)

> 本次同步把 `~/.agents/skills/dev-*`(基于较早 mattp)迁入本仓 `skills/`,并对齐上游
> `mattp@49dd158`(2026-10-08 之后)的变化。基座决策与分歧出处见 02 文档 §7。

## 一、上游相对 dev-* 基线的变化盘点

### A. 约定性变化(已采用)

| # | 上游变化(commit) | 影响 dev-* | 处置 |
|---|---|---|---|
| 1 | **CONTEXT.md/CONTEXT-MAP.md → GLOSSARY.md/GLOSSARY-MAP.md**(d80fa0f,domain-modeling 连同 CONTEXT-FORMAT.md → GLOSSARY-FORMAT.md 全链改名) | dev-align / dev-setup / dev-refact / dev-repo-map / 各 references(48 处引用) | **采用为主约定,兼容读旧名**:技能一律写 GLOSSARY.md;发现仓库已有 CONTEXT.md 时按同名 glossary 读、在会话末提供一次性 `git mv` 改名;是否改名由仓库主人决定(setup 记录布局,不改名)。dev-align 与 dev-refact 的 format 参考文件均改名 glossary-format.md / GLOSSARY-FORMAT.md 并加 Legacy naming 节 |
| 2 | grilling 问句措辞使 "yes" = 接受推荐答案(#1193) | dev-align | 已并入 Workflow 第 4 条(紧邻"每问带推荐答案") |
| 3 | diagnosing-bugs:强制的红必须先证明确实落地(Diff 证明变异生效才信红)(#1209) | dev-diagnose | 已并入 Phase 2 Reproduce(附本地化扩展:git diff 或干净检出) |
| 4 | tdd:每个提议的 seam 附一行"抓得住什么、抓不住什么"(#1192) | dev-prd(模块/seam 讨论所在处) | 已并入 step 2(dev-tdd 未出现 seam 问句,不需改;未来 build/implement 技能复用此纪律) |
| 5 | setup:tracker 为 GitHub 时主动创建缺失的 triage label;标签文档左列命名为"Label in our tracker"(5b7cade、#801) | dev-setup | 已并入:Add label creation 节(仅 GitHub;本基座明确不做 GitLab);triage-labels 种子左列改为 "Label in ariesfish/dev-* skills" |
| 6 | to-tickets:切片作为父 issue 的 sub-issue 挂载(cffab50)+ Blocked-by 措辞收紧(9e2abf8) | dev-issues | 已并入 step 5:源素材是 tracker issue 时,切片作为 sub-issue 挂载(结构化引用而非散文) |
| 7 | triage:Gather context 增加冗余检查(按领域概念搜既有实现,命中即 already-implemented wontfix) | dev-triage-issue | 已并入 step 1(此前只有 (b) 先前拒绝检查,补齐 (a) 冗余检查) |
| 8 | implement:传入 ticket 引用时先抓取并复述其标题,有歧义先问(#1196) | (未来 build 技能) | **登记待用**:dev-* 无 implement 对应件;P1 新增 build 时吸收此纪律 |
| 9 | code-review:搜索仓库全部 standards 文件(CODING_STANDARDS/CONTRIBUTING 等)+ 两个评审子代理同消息前台并行(3da8c01) | (未来 review 管线) | **登记待用**:P2 新增 review 时吸收 |
| 10 | wayfinder:wayfinder: 标签不与 triage 标签混用(决策票不是实现工作)、禁止占位 `#<n>` 引用、research 分支推远端但不开 PR(8295b8e) | (wayfinder 收编时) | **登记待用**:P1 收编 wayfinder 时以最新版为源,天然携带 |

### B. 上游结构性变化(不跟随,登记为有意分歧)

| 上游变化 | 不跟随的理由 |
|---|---|
| to-prd、to-issues 被删除,合并为 to-spec + to-tickets(386d4ff) | ariesfish 融合架构有意保留 PRD 层(dev-prd → spec 工厂两级,对应 addyosmani SPEС 管线;见 02 文档 §2.3 工件契约)。"对话 → PRD → SPEC → 切片"四级 vs 上游"对话 → spec/tickets"两级,是我们的分叉决策 |
| zoom-out 被删除(e112a6b) | dev-* 已将职责拆分为 dev-code-map(区域级)+ dev-repo-map(仓库级 REPO.md),比上游删除前的 zoom-out 更完整 |

### C. 上游孵化件(不收编,登记)

- `chief-of-staff`(in-progress,近期改动最多):"战术 + 战略双轨"(改环境提升下一个任务的结果)。思想与我们的 retro(P2,M)→ correct/encode-lessons 同源;retro 落地时引一句,不收本体
- `loop-me`(in-progress):grilling 变体,输出工作流 specs。与未来 pie-mode 自主循环部分重叠,持续观察
- `claude-handoff`、`writing-*` 系列(in-progress):与我们 P1/P2 范围无交集
- `wizard`、`ask-matt`、`research`、`pr`、`code-review`(mattp 版):被 dev-*/新增件覆盖或明确不收,见 03 矩阵放弃清单

## 二、迁移与更新记录(逐件)

| 件 | 迁入 | 本次应用 |
|---|---|---|
| dev-align | ✅ | GLOSSARY 主约定 + 兼容读 + yes-accepts 措辞;references/context-format.md → glossary-format.md(含 Legacy 节) |
| dev-code-map | ✅ | 无 CONTEXT 引用,原样(glossary 词汇已按泛指描述) |
| dev-diagnose | ✅ | 强制红的落地证明(Phase 2) |
| dev-issues | ✅ | sub-issue 挂载;**changelog 登记上游 to-prd/to-issues 删除为有意分歧** |
| dev-prd | ✅ | seam 一行 catches/misses 注记;changelog 登记分歧 |
| dev-proto | ✅ | 原样(上游 prototype 近期仅加 race HTML demo 与 Codex 元数据,不适用) |
| dev-refact | ✅ | GLOSSARY 全链(SKILL.md 68 行、INTERFACE-DESIGN.md 30 行、GLOSSARY-FORMAT.md 改名+Legacy 节) |
| dev-repo-map | ✅ | 38 行 GLOSSARY 命名(legacy 备注内联) |
| dev-setup | ✅ | 检查清单与 domain 节 GLOSSARY 命名 + GitHub 缺失标签创建 + 兼容声明(改名与否归仓库主人);domain.md/dev-workflow.md 同步;triage-labels.md 左列更名 |
| dev-tdd | ✅ | 原样(#1192 的 seam 注记落在模块/seam 讨论所在处 dev-prd;成本闸门属 P1 升级包,非本次上游同步范围) |
| dev-triage-issue | ✅ | 冗余检查补齐进 step 1 |

每件头部有 `<!-- ariesfish changelog: ... -->` 登记迁移来源与本轮同步条目;后续升级在此追加。

## 三、遗留与下一步

1. **~/.agents/skills/ 旧目录**:迁移后建议删除或改名为 `dev-*.migrated-backup`(避免 pi 双技能同名);散件(handoff/teach-me/skill-author/write-agents-md 等)按计划保留原位不动。待用户确认后执行
2. **两份 GLOSSARY-FORMAT 副本**(dev-align/references/glossary-format.md 与 dev-refact/references/GLOSSARY-FORMAT.md)内容几乎重复(dev-align 版多一条"只作 glossary"规则)。维持现状(mattp 哲学:每技能自含),未来若漂移再合并
3. **同步节奏建议**:与 dev-* 自家演进一致,季度 diff 上游一次;下次同步起点即本文档基线 49dd158
