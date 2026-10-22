# AGENTS.md

pi-dev-mode 的仓库指令。本仓库是一个 pi 包(pi 包清单见 package.json 的 `pi` 键):
27 件技能 + 自家扩展(`pi/`,含 agent/ask/batch/intercom/schedule/worktree)+
 验证域 CDP harness(`adapters/control-web/`)+ gates 账本。提交信息与文档
中英混排按既有惯例;变更 `adapters/control-web/harness/` 走该目录 README 的
例外审批,不做静默重构。

## Agent skills

### Issue tracker

本地文件 tracker：实现工作记录在 `.dev/` 下(feature-first，每需求一个
`feature-<slug>/` 目录；未归属入件进 `.dev/inbox/`;`/.dev/` 属 gitignore,
单开发者的过程记忆，从不推送)。T-id 跨需求全库唯一，只追加不重排。
见 `docs/agents/issue-tracker.md`。

### Triage labels

五角色规范词汇表原样使用(needs-triage / needs-info / ready-for-agent /
ready-for-human / wontfix),以 `todo.md` 标题行括号标记或票文件 `Status:`
行表达。见 `docs/agents/triage-labels.md`。

### Domain docs

单一上下文布局；`docs/GLOSSARY.md` 与 `docs/adr/` 尚不存在时静默跳过,
由 grill-me 在术语/决策实际落定后惰性创建。见 `docs/agents/domain.md`。

## 任务隔离

- 开任务先 `bash scripts/task.sh <名>`:任务会话在任务自己的 worktree 里工作;主树
  是唯一的合并台(单 actor),不承载任务体。子任务派发已由工作流自动隔离——这条
  针对的是人手开的顶层任务会话。
- 主树上任何 `git merge/commit/reset` 前必跑 `bash scripts/assert-branch.sh <预期分支>`:
  并行任务可以切走共享 HEAD(2026-10-22 事故:merge 落错分支,与另一任务纠缠)。
- 多票共享同一文件时,票上写明编辑区域(插入锚点/只准尾追加/禁碰),
  merge 冲突在拆票阶段消灭,不留给 merge 现场。
