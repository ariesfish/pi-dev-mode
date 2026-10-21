# pi-dev-mode

一个 pi 扩展包:**27 件开发工作流技能 + 自家扩展进程编排 + 验证域适配器 + 触发回归用例库**,一次安装全齐。

技能覆盖意图全链——探路(scout/research/proto)、立项(spec/grill-me/constraints)、拆票(tickets/triage-issue)、实现(implement/implement-all/tdd)、把关(review/code-review/benchmark-checklist/eval)、复盘(retro/refact/show-me)——单技能可独立调用,大任务由路由技能 `pi-dev-mode` 按阶段×类型×雾级自动进场。

扩展自带(pi/ 目录,与技能一并加载):

- **`agent`**:子代理派发——前台等待返回,后台出 agentId + 完成通知;一次批 2-8 个任务(`tasks`,逐任务可定 model/worktree/readonly/retry);`send_message` 转向运行中代理,`stop_agent`/`list_agents` 收口
- **`ask_user_question`**:1-4 问的结构化提问(选项可搜索、多选、自由作答、倒计时)
- **`ask_parent`/`answer_child`**:子代理卡壳时问父会话、父会话作答(intercom)
- **`schedule_wakeup` + `/loop`**:定时自唤与固定/自续循环(跨会话切换自动对账停摆)
- 后台运行经 durable 桥持久化:会话崩了工件不丢,重开会话续跑续投递

## 安装

前置:pi 本体;Node ≥ 22(adapters 的 drive 引擎 playwright-core 随包安装,零浏览器下载,连接系统 Chrome,`CHROME_BIN` 可覆写)。

**git 源安装(推荐):**

```bash
pi install git:github.com/ariesfish/pi-dev-mode
```

pi 按包根 dependencies 安装依赖(全部 npm 正式包,`package-lock.json` 锁死版本),技能与扩展从安装树加载。

**本地开发装法**(加载即仓库本体,改完即生效):

```bash
pi install /path/to/pi-dev-mode
# local 安装不装依赖(pi 的作者责任制):仓库根 npm install 一次
```

装完 `pi list` 应显示本包;开新会话,系统提示里出现 pi-dev-mode 的进场 mandate 即成功。

**模型别名**:包根 `models.json` 把家族别名 **fable / opus / sonnet** 映射到固定 provider/id(`*` 万用表,与当前会话的 provider 无关)。要改指向:`~/.pi/agent/pi-dev-models.md` 加一行 `pi models: <别名>=<provider>/<id>`。

## 基本使用

**三层用法:**

1. **自动进场**——跨生命周期的大活、多文件改动、起因未明的 bug、去向未定的方向,交由会话开头的 mandate 路由到 `pi-dev-mode`;小活(单文件、有显而易见的验证)直接做,不惊动路由
2. **生命周期命令**——`/spec` 立项 → `/build` 实现(`--auto` 单审批自主跑完)→ `/review` 四镜头把关 → `/ship` 过门落地
3. **单点直调**——`/skill:<技能名>` 直入任何一件(`grill-me`、`benchmark-checklist`、`constraints`…),技能间靠工件在场咬合

**并行与追问**:`agent` 一次批派多个只读审查或实现任务(各自 worktree 隔离),聚合表一次收回;模型向你提问走 `ask_user_question`,你按选项回;后台代理的完成通知自动送达,不用轮询等它。

**过程工件**落在目标仓库的 `.dev/`(gitignore):一个特性一个 `feature-<slug>/` 目录(spec/plan/工单/审计),落地后整个目录即弃,git history 即归档。

**改动本包时**:验收一条命令 `bash scripts/check.sh`(五级:技能树完整性 / gates 回归 / prose 反滥调 / 适配器缝测试 / 扩展套件);技能触发面改动须过 `eval` 门的用例库回归。质量合同见 [docs/CONSTRAINTS.md](docs/CONSTRAINTS.md)——动手前读,不许削弱它来让改动通过。

## 文档地图

| 文档 | 内容 |
|---|---|
| [docs/CONSTRAINTS.md](docs/CONSTRAINTS.md) | 质量门槛(数字化 floor,改动前读) |
| [docs/agents/](docs/agents/) | tracker / 分诊标记 / 领域文档契约 |
| [docs/dev-traps.md](docs/dev-traps.md) | 运营陷阱一页表(开工前扫一眼) |
| [references/pi-host.md](references/pi-host.md) | 宿主与工具映射单一权威 |
| [adapters/control-web/README.md](adapters/control-web/README.md) | 验证域 CDP 适配器(例外审批制) |
| [evals/](evals/) | 触发回归用例库 |
| [gates/README.md](gates/README.md) | 账本门(opt-in) |

License: MIT。交互与编排设计参考 pi-ask-user / pi-subagents 同名上游,代码自家实现(见 [NOTICE-pi-extension.md](NOTICE-pi-extension.md))。
