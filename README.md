# pi-dev-mode

@earendil-works/pi-coding-agent 扩展, 为 Coding Agent 提供软件开发全生命周期管理。

方向未定时先探路定位, 想法收敛成 Spec, Issue 实现, PR 前审查, 收尾后的复盘沉淀。Agent 按任务类型自动进入对应流程, 需要决策时向开发者提问, 开发者只需在关键节点拍板。

## 功能

每个生命周期阶段对应一组技能:

| 阶段 | 技能 | 做什么 |
|---|---|---|
| 探路 | scout / research / proto | 方向不明时先调研、做原型, 把关键决策定下来再动手 |
| 立项 | spec / grill-me / constraints | 把想法写成带验收标准的规格, 接受方案拷问, 定下质量门槛 |
| 拆票 | tickets / triage-issue | 规格拆成可独立实现的工单, Issue 分诊进状态机 |
| 实现 | implement / implement-all / tdd | 按工单实现, 支持测试先行与自主批处理 |
| 把关 | review / code-review / doubt / benchmark-checklist / eval | 合并发布前的代码评审、对抗审查、性能数据核查、盲评实验 |
| 复盘 | retro / refact / show-me | 沉淀经验,改进架构,把结论讲清楚 |

其余技能按需进场: 

- diagnose (疑难 bug 与性能回归排查)
- code-map / repo-map (理解陌生代码与仓库)
- create-verification-skill / maintain-verification-skill (生成和维护驱动真实应用的验证技能)
- setup (新仓库初始化配置)

配套能力:

- **并行执行**: 独立任务一批派发, 各自在隔离环境中跑, 结果一次性回收
- **结构化提问**: 需要决策时给出带选项的提问, 按选项回答, 也可自由作答
- **浏览器驱动**: 验证技能可以像用户一样操作浏览器, 检查界面行为

## 安装

前置: @earendil-works/pi-coding-agent ≥ 1.0, Node ≥ 22

```bash
pi install git:github.com/ariesfish/pi-dev-mode
```

装完 `pi list` 应显示本包, 新开会话即生效。

## 基本使用

三种用法:

1. **直接描述任务:** 大任务自动进入流程:跨阶段的工作、多文件改动、起因不明的 bug、规模不小的重构;单文件小改动直接做,不走流程。
2. **生命周期命令:** `/spec` 立项 → `/build` 实现 → `/review` 审查 → `/ship` 发布, 一条命令推进一个阶段; `/build --auto` 一次审批后自主跑完整批工单。
3. **单点直调:** `/skill:<技能名>` 直接进入任一技能, 如 `/skill:diagnose`、`/skill:benchmark-checklist`。
