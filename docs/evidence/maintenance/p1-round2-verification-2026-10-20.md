# P1 第二轮:残留验证(visual-parity + Mode B)— 2026-10-20

前一档:docs/evidence/maintenance/p1-setup-stance-modea-2026-10-20.md(⑧ 三案中的
fog/block PASS,visual-parity 未跑)。本档补齐:visual-parity bank 重跑 + 对 ⑧ 的
Mode B(变体 A/B)。另含路由表收敛(commit 2be9c3f:pi-dev-mode 路由表成为唯一
决策表;dev-mode-help 改目录页;inventory 完备 lint)。

## visual-parity(implement @ 最终树)— PASS

- 第一跑 1500s 被掐(transcript 显示合法 render+diff 流水线 + viewer spawn 在
  最后一英里被 alarm 杀掉,reply 未落地)→ 本机 runner 环境慢于 1500s 标定环境,
  **2400s 重跑通过**。形状偏离记录在案。
- Judge PASS 证据:render 脚本 eval 真实 `src/theme.ts`、headless Chrome 截图、
  像素 diff **抓到真 bug**(badge 布点 40/221/402 vs 参考 40/220/400 → 改
  badgeGap 39 → 差异降至 0.255%)——机制排除了"自画自比"的循环验证;另有独立
  viewer agent 双图读审(VERDICT MATCH),残余 AA 差异如实披露而非 RMSE=0。
- go/verify 文件在 /tmp/vp2/(临时),判分文 /tmp/judge-vp.txt。

## Mode B(⑧ stance 统一,scout 条款)— 判定:变更成立,ship variant

任务材料自建(带提醒系统的小仓,W6.md/README/src 5 文件,无 tracker 配置,
**不进 evals/fixtures**,仅实验用);prompt 复用 bank fog 正文。双臂只差
implement/code-review/scout 三文件(variant=HEAD, baseline=742db13;盲 judge
只见 Apple/Banana)。

三轮废弃,全部如实记录:
1. 材料污染(unconfigured-w6 的 W6.md 是搜索框/导出计划,"提醒系统"在仓里不存在,
   任务自我消解)→ 重造自洽材料。
2. shell 参数错位致同臂并发互删 → 修正函数。
3. **--skill 路径形状混杂**(最大教训):variant 臂把臂目录直接当技能树
   (`--skill $arm`),baseline 臂嵌套(`--skill $arm/skills`)。14 跑统计:凡
   `.../skills` 结尾路径,技能正常按目录页加载;裸臂目录 = **会话无技能目录、
   零报错、0% 加载**。variant 臂实际跑成了无技能对照组,A/B 无效。
   runner v3 的"拷贝为 skills 目录"形状是承重的,不是风格。

第五轮(双臂统一 `.../skills` 嵌套)分层结论——只统计**实际加载了 scout**的
运行:

| 臂 | scout 加载 | setup 前置(gating) |
|---|---|---|
| variant(⑧ 新文本) | 4/4 | **0/4**(v4 逐字复现设计:"就地引导用 `.dev/w6-reminders/` 本地文件……不绕 `setup`") |
| baseline(旧文本) | 1/1 本轮 + 前轮 3/3 | **4/4 全部把 setup 升格为前置**("先跑 setup…然后开 scout 会话") |

盲 judge(不知臂映射)把四跑自主聚成两派,判词恰是 ⑧ 的机制描述:"缺配置被
升格为阻塞项——用户离开这轮对话时拿到的是'先去配 tracker'而不是方向地图",
判定 ship variant 派。judge 与我自读四份全回复结论一致。

累计:variant 树 + scout 加载 5 样本(fog bank Mode A 1 + 本轮 4)零 gating;
baseline 树 + 加载 4-5 样本全 gating。加 Mode A 三案 PASS(fog/block/visual-parity),
⑧ 关闭。

## Runner 教训(已回写 evals/README.md 运行节)

- L1:Mode B 材料必须与 prompt 同伦(fixture 与 prompt 矛盾 → 任务自我消解,
  看似正常回复实则实验无效)。
- L2:`--skill` 必须指向拷贝出的 `skills/` 目录;裸目录名 = 无技能会话且零报错。
- L3:bare 档技能加载靠模型自行 read,是随机的;**关于技能文本的 A/B 结论必须
  按"transcript 实际加载了该技能"分层统计**,否则加载率方差冒充实文本效应。

## 未验证项如实清单(不变)

- code-review 仍无 case bank(⑧ 对它的编辑至今零回归网,无 organic 用例不可造)。
- multi-area-fulltools 为建档即红的常设仪器(不同轴),按案说明不重跑。
- 安装副本(~/.pi/agent/git/.../pi-dev-mode)落后工作树 4 个提交,需走用户同步流程。
