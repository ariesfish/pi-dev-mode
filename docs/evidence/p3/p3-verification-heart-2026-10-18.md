# P3 验证心脏——两大验收柱落地(2026-10-18)

环境同前(pi 1.3.0 本地装、deepseek-v4-pro 主会话/session、product env)。靶场 harness/pie。证据目录:pie `.audit/evidence/verify-pie-20261018-024701/`(生成器自证)与 `.audit/evidence/verify-pie-diag-newsession/`(埋 bug 复现);session 原档 `/tmp/p3-evidence/`(临时)。

## 前置:donor 身份落定与使用域分家(P3 第 1 块,commit 119ee84)

- donor:browser-use/browser-harness v0.1.13(uv 全局安装,daemon + cdp_use,`browser-harness skill` 文本 + domain-skills 开关)。**经比对不 vendored-fork**:它按设计附着用户运行中的 Chrome、面向联网任务/登录态复用;control-web 面向验证取证、必须自起隔离实例(docs/04 风险表预判的哲学冲突,分家解)。机制借鉴:doctor 面三段、domain-skills 复利(== 生成器 feature map)、curl-first 门槛
- `adapters/control-web/`:零依赖 Node CDP 驱动从零建,三条纠偏即构造约束(自起隔离 `--user-data-dir=/tmp/verify-$RUN_ID` + 端口自动 / ARIA·可访问名优先、坐标仅显式给且 report 打标 / `harness/` 冻结 + README 例外审批日志)。五段冒烟(对 pie daemon 演示页):launch→doctor→drive(aria「发送」via:aria / text / selector 三路命中 + 截图)→cleanup(实例灭目录清**证据存活**)→crashpad 残留观察不动手(冻结纪律)
- 技能对移植:create-verification-skill + maintain-verification-skill(pi 原生 `.pi/skills/verify-<app>/`、pi-host.md 映射、派发小写 `agent` 约定、证据根 `.audit/evidence/` 与 implement-all 台账同根)

## 验收柱 1:生成器自证(pie 54b23c9)

`/skill:create-verification-skill` 于 pie 生成 `verify-pie`(SKILL 六节 + helpers×5 可执行 + features×5 旅程)并**以真实目标自证**(runId 20261018-024701,隔离 daemon :8790,scratch agent-dir auth chmod 600,git fixture workspace,非替身):

| 段 | 结果 |
|---|---|
| Launch | ✓ 隔离 daemon + 实例 |
| Doctor | ✓ 6/6(pid/http/ws-hello/port-owned/版本/隔离) |
| Drive | ✓ 主旅程 10/10(workspace→chip→新会话→badge→列表);加赠 app-web 旅程 11/11 |
| Evidence | ✓ 14 件:doctor.json、**ws-side-effects.json(session.list 服务端侧证实双会话)**、7 截图、report×2、steps×2、daemon.log |
| Cleanup | ✓ 按序三段、端口释放、**证据原封** |

- 生成器自证途中修真 bug 3:①**control-web 冻结接口例外 1**(data-pdm-hit 旧标签劫持后续步骤——boxExpr 取文档序首个,第 2 步起点击全落前一步元素,页面实测残留 5 标签;2 行修复走例外审批日志,harness 维护方复核批准,pi-dev-mode 030d6f5)②helper 根路径层级 ③多旅程共用 out 互盖 report
- **诚实账**:聊天 steer/follow 与权限卡旅程标注未证(需真模型 token;confirm() 对话框 CDP 不可达,地图写明走协议层);app-web diff 未证 ⬜;不 Green-Washing
- 顺手记录:ui-walkthrough 引用的 dist 路径过时(expo export 现落 packages/app/dist/),产品侧待办

## 验收柱 2:人为埋 bug + diagnose 经 control-web 复现修复(pie 3b188b6)

埋点:`packages/daemon/public/index.html:923` 单字符 typo(`$("newSessionn")`),不提交,让会话面对真实"改坏的现场"。有机症状:"演示页点「+ 新会话」没反应,会话建不出来"。

diagnose 会话闭环(RED 在前修复在后):

1. **RED**:verify-pie 冻结驱动 + 隔离实例复现——截图/报告落 `.audit/evidence/verify-pie-diag-newsession/demo-session/`(失败版);且诊断比症状深:**getElementById 返回 null → 顶层 `null.onclick=` 抛 TypeError → 整个 script 块中断**(连 boot 自动连接都没跑,"比用户描述的更糟"的 connState=disconnected 即此)
2. **根因**:行 923 typo(id 多一个 n)
3. **修复**:恢复绑定(工作区回 HEAD 状态;未提交笔误,无回滚污染)
4. **GREEN**:驱动复跑全绿(demo-session-fixed/),**新回归测试 `demo-page-ids.test.ts` 先证对 typo RED、对修复 GREEN 才提交**(顺带豁免 `?.` 守卫读取 tokenInput 的合法案例);daemon 11 文件/80 测试全过、typecheck 干净
5. **清理不变量**:仅按记录 pid 杀进程,端口释放,临时目录清空,**证据目录原封**

## 独立复核

typecheck exit 0;`npx vitest run packages/daemon` 11 文件/80 用例全过;pie 工作树干净(相对 3b188b6)。commit 链:pie `54b23c9` → `3b188b6`;pi-dev-mode `119ee84` → `030d6f5`。

## 判定与剩余

- **P3 两大验收柱(生成器自证;埋 bug 经 control-web 复现后修复)通过**——"没跑通的生成器是草稿"铁律下,本 P3 的生成器不是草稿。
- 剩余(P3 收尾块,纪律路径在案):
  1. mode playbook 接线:review 独立裁决者(verifier 角色,fresh agent + 异构模型,PASS/FAIL verdict 文件落 `.audit/evidence/`)与 mandate 路由表 verifier 行——**均为技能/mandate 编辑,过 eval 门**(E 的否决教训在案:散文层不足时如实入账本)
  2. decisions.tsv 格式定稿(show-me-your-work 列 + skip-test 列;现有 `.audit/T-00X.tsv` 五列基础上扩)
  3. maintain-verification-skill 首轮巡检(可选,建议产品节奏自定)
- F 候选注:两轮 P3 会话均在无视觉模型(v4-pro)上跑,截图自检靠 DOM 基准绕行——viewer(pin 在 flash)已在全局位,技能层指引仍缺,随剩余项一并过门

## P3 收尾(2026-10-18 晚):verifier 接线 + decisions.tsv 定稿 + Mode A 门

**接线四件**:review 独立裁决者节(fresh readonly `agent`、异模型、只见 diff 与证据指针、**自写 verdict 文件** `.audit/evidence/review-<slug>/verdict.json`);路由表与 mandate 各一行(verifier 角色);implement-all 台账规约定稿(`id, decision, reason, evidence, verdict, skip_test, show` 七列,skip_test 承接 tdd 成本闸 skip-test 行,show = 人能看见活在哪;存量 5 列日志作为历史不动)。

**活体验收(pie 3b188b6,高风险合并判型)**:四镜头(Standards/Spec、注释纪律、对抗、约束)之外,**独立裁决者(异模型 deepseek-flash)以 diff 单边视角自判并自落 verdict 文件**——`.audit/evidence/review-3b188b6/verdict.json`:{FAIL, 3 blockers, checked[8], evidence[10]},结构完整符合契约。裁决质量极高:用 8 份 /tmp 变异副本证明守护测试的正则盲区(单引号在逃——`index.html:545` 现存 `$('sendBtn')` 即例)、`?.` 豁免放过的 live 潜伏 bug(全仓无 `id="tokenInput"`)、"wired" 断言绿在坏代码红在合法代码(违反 SPEC 自己的"只测外部行为");并顺带审计了我方下午证据的完整性(mtime 先于提交)。聚合 REQUEST CHANGES 与裁决 FAILED 同向 ——  pie 侧 3 个真 blocker 待裁决(本会话所出守护测试被打回——独立裁决者存在价值的现场证明)。

**Mode A 门(P3 编辑后全库回归,fixture-aware 跑法)**:

- **PASS(6)**:bench-claims / merge-gate / stays-quiet / tdd-cost-gate / answer-only(修法后二次复验稳绿)/ **multi-routing(fixture 跑法下 PASS——此前翻红是旧跑法未拷 fixture 的方法学副作用)**
- **FAIL(3,各归各位)**:G-multi-base(站立仪器在账,一致)/ B-issues-bootstrap(fixture 已修"计划丢失"轴线,但"一次确认 + 播种"协议横跨 8 试不回——连带划界修法(B 行 scope note)亦不奏效;按 E 先例入账本站立仪器,疑 base-model 交互层漂移)、I-visual-parity(像素重建声明无渲染来源,got caught——retro 台账已记 f-red/f-green 波动类)
- P3 编辑(verifier/review/tsv/mandate 行)自伤面 = 相关案全绿
- 执行教训两条:① **跑法必须随案型走**(fixture-aware runner;旧 runner 对新案型产生假红)② 我自己把 append-only 台账一次替换误操作——已当场恢复,自证该纪律的人为脆弱面

**P3 关账**:两大验收柱 + 接线 + 定稿 + 门,全链完成。剩余开放项不是 P3 内容:pie 守护测试 3 blocker 修复(用户裁决)、可选 maintain 巡检节奏。
