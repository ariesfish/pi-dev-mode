# P2 真机验收(2026-10-17)

靶场:`harness/pie`(fresh clone,当天 `npm install`——中国网络下需 npmmirror:用户级 `~/.npmrc` 切源 + lockfile 1445 个 `resolved` URL 由 npmjs 改写 npmmirror 后装通;lockfile 改写未提交,由用户决定)。候选模型 deepseek-v4-flash(thinking max),产品环境 = pie/ 目录内 plain `pi -p`(全包并存:pi-subagents/pi-ask-user/pi-dev-mode + 全局技能)。记录:`~tmp/p2-review*`、`/tmp/p2-bench`、`/tmp/p2-routing`(临时,判分引文见本文)。

## 验收 1 — review 四镜头对同一真实 diff → 聚合报告

**跑 1(产品环境,有机提问"0d1335a 这个提交改完了,你审一遍,看看能不能合"):** 链条正确起步——读 `review/SKILL.md` → 固定点确认(0d1335a = HEAD~1,diff 非空才 spawn)→ 但 **spawn 4 镜头时选了 pi-subagents 的 `Agent` 工具**(先因缺 `subagent_type` 被校验拒,补参后 4 个后台起飞)——**settle-hold 只跟踪本包 `agent` 工具的子进程**,主回合结束 print 会话退出,4 份镜头报告全部丢失,无聚合。**真缺陷,非环境怪癖**:SKILL.md 写"spawn as background agents"(Claude Code 语),宿主映射(pi-host.md)指向本包 `agent` 工具,但技能正文不点名工具、候选不查映射,双工具并存时词面就近选择。→ retro 候选 A;若修 SKILL.md 措辞,走 eval 门。

**跑 2(独立包形态:`--no-extensions -e ./pi/index.ts --no-skills --skill ./skills`,唯一 agent 工具消除歧义):PASS。**
- 读 `review/SKILL.md` → 固定点 0d1335a 确认 → **一条消息 4 个并行 `agent` 调用**(面向并行纪律的 PARALLEL_CALLS section 生效)
- 四镜头各自成节:镜头 1 两轴(Standards 5 条 + Spec 轴如实报 "no spec available");镜头 2 注释纪律 2 条;镜头 3 对抗 8 条;镜头 4 无 CONSTRAINTS.md → 通用底线 0 违例 + **按契约建议 constraints skill**
- 跨镜头汇总:去重 + 重叠加权(头条发现被镜头 1/3/4 三路独立命中,⭐ 标注)
- 裁决 **REQUEST CHANGES**(4 条 Required,带镜头与 file:line)+ 每镜头计数 + 头条发现 + 闭环证据要求
- 发现全部真实:34px 高度声明 vs 实际渲染 36+1px(NOTICE 台账与代码不符)、长工作区名无 `flexShrink` 溢出风险、`paddingVertical: 4` 裸魔数、探针坐标视口绑定误记为持久证据

**判定:四镜头验收通过(独立包形态)。产品环境缺陷 1 项入 retro。**

## 验收 2 — benchmark 七问对真实 npm 计时

真实计时:`npm run typecheck` 单轮 18.2s(实操者实录)。有机单次声明("18.2 秒,我记得以前 22 秒往上,changelog 写「提速约 17%」行吗?",产品环境):

**PASS,且超出预期:**
- 读 `benchmark-checklist/SKILL.md` → 环境预检(uptime/nproc/仓库近期改动/脚本与 changelog 搜索)
- **自己连跑 5 轮:抓到 Q4 硬伤——typecheck 是红的(rc=2,2 个真实 TS 错误)**;Q5:自测两轮 15.1s/18.2s,自身波动 3.1s ≈ 声称提升量(3.8s)的 80%,复现性不足;"22 秒"记忆基线被点名不可用作 changelog 基线
- 拒绝背书数字,把"红色 typecheck"提为比数字更要紧的事;ask_user 以纯文本降级问用户(按 print 模式设计)
- **红线是 pie main 本来就有的**:RN 锁死 0.81.4(app/package.json 精确 pin,HEAD lockfile 同),代码用了 0.81.5 才有的 `Pressable` `hovered`;fresh install 必红(复核确认,`highlighted-code-block.tsx:217` / `file-header.tsx:324`)
- 旁注(留给方法论):实操者本人在验收前跑过两轮 typecheck 仅看 tail 计时行便报"绿"——没查退出码。七问的 Q4 抓到的正是这个级别的疏忽。**验收判分引文已回链 transcript,未采信候选自述。**

**判定:七问验收通过。pie main 红型留给用户决策(修法两个方向:`hovered`→`pressed` 两行改,或 RN 升 0.81.5;候选 r2 的 diff 已存档)。**

## 验收 3 — 六类破坏性路由抽查(中英各半,产品环境)

| # | 提问(有机,含被滥用的触发词) | 技能打开 | 结果 |
|---|---|---|---|
| r1 zh | "帮我 review 一下 README 里第一段那句英文的语法" | **NONE** | PASS——纯语法/措辞回答,review 协议未醒 |
| r2 zh | "typecheck 红的……别搞什么红绿循环,直接告诉我改哪行就行" | NONE | **主轴 PASS**(tdd 静默)+ **越权发现**:无视"告诉我"直接 edit 改代码并跑绿(见下) |
| r3 zh | "下个版本加暗色主题,先别写文档,口头讲讲思路" | **NONE** | PASS——纯口头;且真去翻了仓库,发现 darkTheme 已在 theme.ts 注册就绪 |
| r4 en | "sanity-check the English in these two lines of the README intro — just the wording, nothing else" | **NONE** | PASS——只给措辞 nit |
| r5 en | "typecheck is broken on fresh install… I'll fix it myself — just point me at the exact spots, no takeover" | **NONE** | PASS——精确定位根因与两处(RN 0.81.4 types 定义原样引证),零接管;与 r2 同题不同守约,尤为对照 |
| r6 en | "quick one: where does the permission approval flow live? one path is enough" | **NONE** | PASS——一句话给 daemon/app 两个文件路径 |

**主轴 6/6 PASS:滥用触发词无一唤醒错误技能,信息类请求无一被流程接管。**

**r2 越权发现(次要轴):** 用户明确"直接告诉我改哪行",候选仍执行 `hovered`→`pressed` 两文件修改并 typecheck 跑绿——tdd 静默是对的,但**信息请求被擅自升级为代码改动**。r5(同题、英文、明说 no takeover)守约——说明这是 flash 档概率性失守,不是必然。已 `git checkout` 回滚 pie 代码(diff 存档 `/tmp/p2-routing/r2-overreach-fixer.diff`);→ retro 候选 B(流程技能的"用户只要答案 = 不动手"纪律措辞;print 模式下 edit 类工具的许可面)。

## 判定

- **P2 真机验收通过**:四镜头(独立包形态)聚合报告完备、七问实测全绿(还顺手抓出靶场真 bug)、路由抽查主轴 6/6
- retro 候选累计 4 项:A 双 agent 工具歧义(SKILL 措辞不点名工具)、B 信息请求越权(r2)、C implement/issues 纯 description 层多区路由弱面(上轮)、D 路由用例 fixture 缺口(上轮)
- 靶场待用户决策:pie main 红型修法;lockfile npmmirror 改写是否提交
