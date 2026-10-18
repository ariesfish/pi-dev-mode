# P5 账本与回路(2026-10-18)

环境同前(pi 1.3.0 本地装,产品环境;候选 v4-pro/flash 分工)。证据:本档 + pie `.sdlc/items/T-011/state.json` + pie `.audit/evidence/review-cdad17f/verdict.json`(本地留痕,循 tsv 追踪/evidence 不追踪惯例)+ `/tmp/p5-evidence/fix/`(修复会话 session 归档,临时)+ `/tmp/modeA-v2/`(Mode A 全库门,临时)。

## 四件套(default OFF,opt-in)

1. **`gates/gate.sh`**(零依赖 bash+python3;从目标仓根运行):`open/run/verdict/close/show/replay/mine` 七命令;D 类门(run:argv+dir+exit 全量入 history,可重放)/ A 类门(verdict 文件 sha256+解析 verdict 入账);`replay` 只读重放(D 类原样重跑 + A 类复哈希,报漂移不改史)。**自证 8/8**:关账本拒绝、开票、首跑红入账、转绿、verdict 入账、replay CLEAN、篡改后 DRIFT 检测、close+mine。格式与规则见 `gates/README.md`。
2. **A 类门升级**:P3 散件(verdict.json 自写)→ 入账:review 技能增补条款"账本在场,verdict 落盘后 gate.sh verdict 入账;无账本 verdict 文件仍必交"。
3. **retro 出口接账本**:retro 技能增补 Ledger rates 条款——`gate.sh mine` 拿 D 门首过率 + A 裁决翻转,连同 `.audit/*.tsv` skip_test 率,三率编码为 constraints 行或吞进 lint;`mine` 实装两率。
4. **observe 桩**:L4 尾端(部署后基线对比 + 回归自动开 intake 票)**立桩不实现**——`open` 时生成 `.sdlc/observe/README.md` 声明格式,不承诺行为。
5. 技能接线(implement / implement-all / review / retro / pi-dev-mode 各一段 opt-in 条款,全部以 `.sdlc/` 在场为前提)+ 源设计稿说明:`../sdlc-unified-design.md` 已不在盘,以 docs/04 P5 节 + docs/01 §10 概念行为准(如实登记)。

## 验收(一):自愿项目开账本跑一个 SPEC 全程(pie,票 T-011)

载体票(用户选定):**walkthrough 08 rail resize headless 基线 FAIL**(过夜两跑一致的真测试问题)。链条:

1. **立票**:tasks/plan.md 增 T-011 节([check:] 验收标准 ×4 + [judgment:] 断言放宽须人点头);`gate.sh open T-011`。
2. **复现在前**:`gate.sh run T-011 repro -- npm run ui-walkthrough --reuse-export` → **FAIL 入账**(x 1174→1174,全 08 单挂)。
3. **修复会话**(有机 prompt,产品环境,mandate+全技能+全工具):自查 implement 技能与账本条款,**自己**走了 tdd 门 + check 门(typecheck/vitest)→ close,单 commit `cdad17f`。根因(实证链):覆盖 handle 的 live DOM 选区让 Chromium 按下即发起原生文本拖拽(trusted dragstart + pointercancel),RNGH pan 首帧后被取消;修复 = handle 挂 isWeb 守卫的 dragstart preventDefault(+17/-1 单文件,断言未放宽)。
4. **A 类裁决**:独立裁决者(fresh readonly flash,39 次工具调用,只给 diff+证据)自写 verdict.json → **PASS,0 blockers**,8 checked(含根因-非绕过的 A/B 对照:修复前 bundle FAIL/修复后 fresh export PASS;断言-未放宽:diff 为空)+ 4 条非阻断观察(07 断言偏弱/dist 陈旧/无单测回归/手势难 jsdom——诚实残余风险)→ `gate.sh verdict T-011` 入账(sha 6aeb0e1319115637)。
5. **重放与挖掘**:`replay T-011` **CLEAN**(4 个 D 类步骤原样重跑、A 类哈希复核零漂移);`mine`:D 门首过率 0.67(**repro 期望红拖底——如实呈现,设计注记:首过率不区分期望红与意外红,retro 解读时口述**),翻转 0。pie 侧两 commit(`cdad17f` 修复 + `6921a79` 账本终态),终态 typecheck 0 + vitest 106/886 全绿。

**验收过线:history 每一步可重放,链条 open→repro 红→tdd/check 绿→close→verdict 全入账。**

## 验收(二):关账本零副作用(回归 P1-P4)

1. **机制层**:关账本 = 无 `.sdlc/`,gate.sh 所有命令拒绝(exit 非零)+ 不触碰目标仓任何文件(自证案 1;`.sdlc/` 目录缺席即关闭,README 明示)。
2. **行为层(Mode A 全库触发回归门,fixture-aware runner v2,对含 P5 增补的新技能正文)**:10 案在跑,**6 PASS + 3 FAIL,与 P3 终局基线逐案一致**——PASS:A-bench-claims/C-review-merge-gate/D-review-stays-quiet/E-tdd-cost-gate/F-tdd-answer-only/H-multi-routing;FAIL:B-issues-bootstrap×2(站立仪器 B:bootstrap 问三连确认)、G-multi-base(站立仪器 E 家族:多区 blob 直做)、I-visual-parity 超时(已知 flaky 类)。**fixtures 均无 `.sdlc/` → 该门同时证明账本关闭时技能行为与 P4 终态逐案相同**。
3. 生命周期命令/workflow 冒烟在 P4 已证,本次技能正文增补不触及命令与路由行。

**P5 验收双项通过。opt-in 无副作用成立。**

## 诚实注记

- mine 首过率把期望红(复现门)计入 miss——设计取舍如实入档,不矫饰数字;retro 条款已口述此意。
- pie typecheck 一次 exit=1 为与裁决者并发 walkthrough 的本地竞态(复跑 0 错,vitest 无涉)。
- verdict 工件循 pie `.audit` 惯例本地留痕(tracked 仅 4 个 tsv);账本 state.json 全量入库可重放。
- mine 的周期性(多久挖一次)留用户定拍——同 maintain-verification-skill 的巡逻拍。

**P0→P5 全程真机闭合。**
