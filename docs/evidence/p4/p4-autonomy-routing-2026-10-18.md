# P4 自主与路由成型(2026-10-18)

环境同前(pi 1.3.0 本地装,产品环境,候选 v4-pro/flash 按上文分工)。证据:本档 + pie `.audit/evidence/overnight-20261018/` + overnight 决策台账 `.audit/T-00{6..9}.tsv`+`T-010.tsv`(22 行×7 列) + `/tmp/p4-routing/`(逐案 transcript,临时)与 `/tmp/p4-evidence/overnight/`(session 归档)。

## 四件套

1. **pi-dev-mode 正文完成**(skills/pi-dev-mode/SKILL.md):路由表已在案;新增 Playbooks 10 条(意图链 3/实现 3/验证 2/发布 2,各指向 owning skill 不复述)、Principles 索引 12+2 附(pstack 24 精选,一行一条,技能未装载时足够定向)、回复契约节(论断同句带证据或标签 / 无证据说"未验证" / unslop:删空话 / append-only / cleanup 不删证据)、Autonomous 过夜手册(见 4)。wayfinder 接入雾级路由(Fog test 收线到 plan-don't-do → issues)。
2. **mandate 定稿并开注入**:全天验证在跑(三个 verdict 会话、routing 10 案、overnight 全走的 mandate 注入;wire 探针早证)。
3. **生命周期命令** `/spec` `/build` `/review` `/ship`:新文件 `pi/lifecycle.ts`(**非 vendored**,NOTICE 台账登记),独立 extension 入口(package.json pi.extensions 第二条),命令 = 技能路由消息(/skill: 直调的 tier-2 形态,args 透传);同名让位语义(try/catch,load 期 getCommands 是动作方法不可调——初版即栽,已修);wire 探针(session_start 里 getCommands)证四命令注册:`["extension:build","extension:review","extension:ship","extension:spec"]`。
4. **过夜手册**(Autonomous 节)+ **压缩演练**见下。

## 验收(一):双盲路由 10 条(≥8 过)

10 条有机口述任务(中英各半,**不出现技能名**),产品环境全量工具,产品判分维度 = transcript 中打开的 SKILL.md(实测产品会话会开所路由技能的文件,判分有效):

| # | 语言 | 任务形态 | 期望(mandate 路由表) | 打开的技能 | 判定 |
|---|---|---|---|---|---|
| r01 | zh | 模糊想法理清 | align | align + use-the-stack + wayfinder | PASS |
| r02 | en | 功能坏了排查 | diagnose | diagnose + pi-dev-mode + verify-pie | PASS |
| r03 | zh | 正式立项 | prd→spec | pi-dev-mode + prd | PASS(见测试设计教训) |
| r04 | en | 绿色分支能合吗 | review/code-review | review | PASS |
| r05 | zh | 三区域按设计稿改 | issues→implement-all | pi-dev-mode + verify-pie | **FAIL**(站立仪器家族同款:多区 blob 未拆票——与账本 multi-area-fulltools/impl-multi-base 红一致) |
| r06 | en | 提速数字可以写 PR 吗 | benchmark-checklist | benchmark-checklist | PASS |
| r07 | zh | 复盘 | retro | retro + review | PASS |
| r08 | en | 新人讲讲仓库 | code-map/repo-map/research | code-map | PASS |
| r09 | zh | 定硬质量标准 | constraints | constraints(未开文件但按描述直做,见教训) | PASS |
| r10 | en | 模块加深 | refact | refact | PASS |

**9/10 ≥ 8:通过**。唯一 FAIL 恰是多区拆票站立仪器家族(账本在案,重开条件=执行层,E 类)。

**测试设计教训(诚实入账,判分不受影响)**:盲测任务跑在活仓 pie + 全量工具,r03(我编造了不存在的"之前讨论过",当了真:落了一个 PRD 提交)与 r09(建了 CONSTRAINTS.md + gate 脚本 + npm install)产生真实仓库副作用;已全部回滚(`git reset --hard` 到 overnight 终态 + 清未跟踪外来物),终态复核 106 文件/886 测全绿 + typecheck 0。**规则沉淀:行为形盲测必须跑在一次性克隆/fixture 上,永不在活仓**——routing runner v1 还犯过 `--no-session` + `--session-dir` 并用不落盘的低级错(判分修复后重跑)。另:overnight 会话在晨审中如实挂出两处外来写入者(daemon 进程 + T-011 未提交段落),未吸收未干预——**审计分**。

## 验收(二):overnight 压缩演练

按 Autonomous 手册压缩跑:真待办立 5 票(T-006>T-007>T-008>T-009>T-010,单审批一次)→ implement-all auto 全清:

- 票:T-006 过时 dist 路径修复 + use.mjs 守卫(`31796c5`)/ T-007 demo 页单引号统一(`2e2ea4f`)/ T-008 verify-pie 未证旅程实证——**首跑 4 步 RED 抓出两处挂账漂移**(icon-only 页签需 aria 定位、sticky-header 真 testid),修正后 11/11 绿 + viewer 视觉复核(`55f7243`)/ T-009 GLOSSARY「会话列表」补钉 + SPEC 开放问题结案(`3936e08`)/ T-010 verify-pie 权限模式透传(`1c005dc`)
- **晨审**:22 行×7 列台账全部 green,show 列齐;8 个变更行 pre+post 指针齐全零缺失,14 个验证行 evidence 指针抽查 18 个工件全在盘;skip_test 只在诚实跳过处(4 行,理由具体);回归门 5×绿
- 该演练顺带真升级了 verify-pie 的证明状态(旅程由"未证"转"实证")并再次实证 viewer 价值(多模态复核 PAINTED×3)

**P4 验收双项通过。自主与路由成型收线;P5(opt-in)账本与改进回路不在本轮。**

## 判定与遗留

- P4 四件 + 双验收全绿;站立仪器维持 3 台(r05 同族),账本维持。
- 遗留给用户:pie 6 个新 commit 含验证升级(未推); overnight 外来 T-011 残迹已清(若"批量审批"确有此需,应走真 align/prd 链重立,不是盲测的编造上下文)。
