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
