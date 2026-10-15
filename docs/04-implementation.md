# 实施路线图(P0 → P5)

> 每阶段的验收标准都按 pstack 纪律写:**必须端到端跑通一个真实场景并留下证据**,没有跑过的阶段不算完成。
> 阶段顺序按"依赖 + 单块价值"排:先有地基(能装),再打通意图片段(见效最快),再验证心脏(最难最值)。

## P0 地基:pi 包可装(1-2 天)

**做:**
1. `ariesfish/` 仓库初始化:`package.json`(pi.skills + pi.extensions)、`skills/`、`pi/index.ts`
2. **dev-* 迁移路径定夺(升级包策略的关键决策,02 §7):** ~~推荐迁入本仓~~ **已执行(2026-10)**:11 件迁入 `skills/` 并同步 mattp@49dd158,报告见 docs/05。 遗待办:`~/.agents/skills/` 旧目录处置(删除或备份改名)待用户确认
3. 决定 pstack-harness 扩展的取用方式。**推荐 vendor**:`pi/` 目录整体拷入,头部注释登记来源 commit + fork 理由;后续上游更新手动 re-sync
4. mandate 文案 v0,路由条件用 02 文档 §4 的表(mode 名 **pie-mode** 已定)
5. 一个空 `pie-mode` 技能(name+description frontmatter,正文 TODO)

**验收:** `pi install git:<本仓>` 成功;新会话 `pi list` 显示技能(dev-* 11 件若已迁入一并可见);系统提示里能看到 mandate 注入(肉眼确认一次);`/loop` 与 `agent` 工具冒烟一次(派一个后台 agent 数文件并等完成通知);`/skill:dev-align` 单点直调(`拷打方案` 中文触发)照常工作。

## P1 意图链:dev-* 基座升级 + 意图链全通(3-5 天)

**做:** 按 03 文档 §0 矩阵逐件实施升级包(基座已在用,升级面小而准):
1. dev-align 升级(c 三类标注候选 + 互路由 dev-proto)、dev-prd 升级(a 三类验收标注节)、dev-issues 升级(b 依赖图 + frontier)、dev-diagnose 升级(a commit 序列 + 环冻结纪律)、dev-setup 升级(a 三 tracker profile + CONSTRAINTS/verify 引导)、dev-tdd 升级(a 成本闸门 + 断言纪律)、dev-triage-issue 升级(a 工类型分流)
(每个升级件头部一行 changelog:日期 + 来源 + 理由)

2. 三栈新增件:`spec` 工厂 F(SPEC 模板 + 三类标注 + dev-prd 承接)、`build`(含 auto)F、`constraints` F、`wayfinder` C、`use-the-stack` N(dev-workflow 闭环图的更新版)

3. `docs/pi-tools.md` v0(宿主词映射:Skill→/skill:、Task→agent、AskUserQuestion→ask_user_question、Pi sessions 路径)

**验收(跑真实场景):** 挑一个真实小需求,现场走:`拷打方案`(dev-align)问出术语落 CONTEXT.md → dev-prd 出 PRD(验收带三类标注)→ 升级出 SPEC.md → dev-issues 拆垂直切片(带依赖 + HITL/AFK)→ `/build auto` 单审批跑完,每任务一条 commit + decisions.tsv 留痕。证据存 `docs/evidence/p1/`。
**破坏性验收:** 无 SPEC/PRD 直接 /build auto 必须拒绝;grilling 中断、CONTEXT.md 缺席时下游技能必须降级不报错;dev-diagnose 建环后修复,commit 序列必须是"复现在前修复在后"。

## P2 单点库:剩余收编与中立化(3-4 天,可与 P1 交错)

**做:** 按 03 矩阵完成剩余新增件(不再收编 mattp 主体——已由 dev-* 承载):`wayfinder` 若 P1 未完、`constraints` 若 P1 未完、`doubt` C、`retro` M、review 管线 N(四镜头;comment-sicko 与 thermo 以 R 登记,不依赖)、references/ 收拢(addyosmani 7 清单 + pi-tools + dev-workflow 更新);
frontmatter 统一(name+description 中立格式 + 双语触发词沿用 dev-* 风格扩展到新增件)。

**验收:** `npx skills add --list` 兼容(frontmatter 中立);对同一份代码,`/skill:review` 四镜头全跑一遍产出聚合报告;`benchmark-checklist` 对一次真实 npm 脚本计时输出七问裁决;六类破坏性路由抽查(dev-* 触发词中英各半)。

(原 v0 的 P2 内容"31 件全量收编"作废——dev-* 基座策略使我大量收编变成升级,v0.1 后 P2 只剩上面这些。)

## P3 验证心脏:control-web 与 verify(1-2 周,最大单块)

**做:**
1. fork browser-harness → `adapters/control-web/`:三处纠偏(自起隔离实例 `chrome --user-data-dir=/tmp/verify-$RUN_ID --remote-debugging-port`;ARIA/可访问名优先、坐标兜底;helper 冻结——`adapters/control-web/helpers/` 进 git,变更须过例外审批节)。interaction-skills 17 篇随迁
2. `create-verification-skill` C(路径改 `.pi/skills/verify-<app>/`)+ `maintain-verification-skill` C
3. mode 的 build/review/ship playbook 接线:repro 走 control-web、裁决落 `.audit/evidence/`、独立裁决者(fresh agent + 异构模型,扩展路由表加 "verifier" 角色)
4. `decisions.tsv` 格式定稿(show-me-your-work 的列 + skip-test 列)

**验收(pstack 式):** 在一个真实 web 小项目上,`/skill:create-verification-skill` 生成 verify 并**自证一遍**(生成器跑通 Launch→Doctor→Drive 一条功能→证据落盘→清理后证据仍在);然后人为埋一个 bug,`debug`(P2 的合并版)必须通过 control-web 复现并留截图/ARIA 证据后修复;`review` 的独立裁决带 PASS/FAIL verdict 文件。**没跑通就当 P3 未完成**(生成器纪律原文:没执行过的输出是草稿)。

## P4 自主与路由成型(2-3 天)

**做:**
1. pie-mode 正文完成:路由表(02 §4)+ 精选 playbook(意图链/实现/验证/发布 ~10 个)+ principles 12 条索引 + 回复契约节
2. mandate 定稿并开注入;`wayfinder` C 接入雾级路由(若 P1 未完则此处)
3. 生命周期命令注册(spec/build/review/ship 四个,内容来自 addyosmani TOML + 融合语义)
4. `/loop` + build auto + decisions.tsv 组合的 overnight run 手册(mode 的 autonomous 节)

**验收:** 双盲路由测试 10 条(随机口述任务,中英混合,不走显式命令,对照 02 §4 表,≥8/10 算过);overnight 场景演练:5 任务 plan + `/build auto` + loop 心跳,晨间 decisions.tsv 可审计(每行 before/after/evidence 指针齐全)。

## P5 账本与回路(可选增强,1 周+)

**做:**(默认关闭,显式 opt-in)
1. `gates/gate.sh` + `.sdlc/items/<id>/state.json`(我方设计稿的 D 类门先行:check 类验收标准、CONSTRAINTS 门槛、tdd 绿)
2. A 类门(独立裁决)从 P3 的散件升级为 verdict 记录 + history 追加
3. retro 出口接账本:周期性挖 gate 首过率 / skip-test 率 / 裁决分歧率,编码为 constraints 行或 lint(correct 的最高层级修复)
4. (远期)observe 闭环:部署后基线对比 + 回归自动开 intake ticker(此为设计稿 L4 尾端,先立桩不实现)

**验收:** 在一个自愿项目上开账本跑一个 SPEC 全程,`state.json` 的 history 每一步可重放(关账本时一切技能照常——回归 P1-P4 全链路冒烟一遍证明 opt-in 无副作用)。

## 里程碑与总量预估

| 阶段 | 产出 | 预估 | 依赖 |
|---|---|---|---|
| P0 | 可安装的空栈 + dev-* 迁移定夺 | 1-2 天 | — |
| P1 | dev-* 升级包(§0 矩阵)+ 意图链新增件全通 | 3-5 天 | P0 |
| P2 | 剩余新增件 + review 管线 + 中立化 | 3-4 天 | P0(与 P1 交错) |
| P3 | 验证心脏(control-web + verify + 独立裁决 + 环冻结) | 1-2 周 | P0、P2 的 review 壳 |
| P4 | pie-mode + 自主 + 命令 | 2-3 天 | P1-P3 |
| P5 | 账本回路(opt-in) | 1 周+ | P4 |

骨架先行原则:P0-P2 后已是一个"升级版的日常 dev-* 工作流 + 三栈新件";P3 让它有 pstack 的灵魂。

## 风险登记(带对策)

| 风险 | 对策 |
|---|---|
| pstack-harness 扩展 vendor 后失同步 | 头部登记来源 commit;月度 diff 一次上游;它的 forks.json 治理模式照搬到我们的 03-matrix |
| 双 mandate(若同时装了 pstack-harness) | mandate 开头加互认条款(pstack 原文就有"其他 session-start mandates 仍适用"先例);README 建议二选一 |
| browser-harness fork 的"反自起浏览器"哲学冲突 | fork 头部声明使用域(验证 vs internet 任务);control-web 独立目录,不污染原 harness 的日常用法 |
| mattp 上游演进(它自己也在迭代) | C 类技能登记来源 commit,按需 re-sync;其 skills.sh editable-copy 哲学允许局部覆盖 |
| 装载过重 | setup 提供"最小集";dev-* 双语触发词已大幅降低路由摩擦,新增件沿用同风格 |
| dev-* 与升级包漂移(基座自家演进) | 升级包以"加节"为限 + 头部 changelog;每季度 diff 一次自家改动;dev-workflow.md 作为闭环图随升级同步更新 |
| **dev-* 迁移后~/.agents 里旧版残留**(双技能同名冲突) | 迁移当步软链或删除旧目录;`pi list` 验收时核对无重名 |
| pi 上游 API 变动(扩展依赖 pi-coding-agent) | peerDependencies 宽松声明 + 等价表维护(照抄 pstack-harness 的 pi-equivalence 思路,给我们的扩展也立一张表) |

## 立即可以开始的三个最小动作
1. mode 名已定(**pie-mode**):mandate、mode 主体、matrix 三处已统一;`git init` + P0 骨架(package.json + 空 pie-mode + vendor pstack-harness 扩展)
2. ~~定夺 dev-* 迁移路径~~ **已完成**(2026-10,见 docs/05);确认 ~/.agents 旧目录处置
3. 挑定 P1 的验收项目(建议真实小需求,含一个 UI 面以便 P3 复用)
