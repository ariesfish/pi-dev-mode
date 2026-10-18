---
name: pi-dev-mode
description: >-
  Default entry point for any non-trivial task on this stack: routes the work to
  the right lifecycle stage and skill, then keeps the routing tight until the
  work ships. Use at the start of a task, when a job spans PRD/issues/
  implementation/review, or for standing requests like "get this PR green",
  "ship the stack", "I'm going to bed, finish it". Chinese triggers: 走流程,
  用 pi-dev, 全流程做这个, 帮我安排这个活, 该用哪个技能, 大干一场.
---

<!-- pi-dev-mode changelog:
- 2026-10 P0 skeleton: routing table active; playbooks and the principles
  index land in P4 (see docs/04-implementation.md). Until then this skill
  routes with the table below and stays out of the way on small tasks.
- 2026-10 P1.2 (pie dogfood observation): routing row for lazy config bootstrap added.
- 2026-10 P2: routing rows for review / doubt / benchmark-checklist / retro; P2 placeholders resolved.
- 2026-10 P2.5: eval row added (skill-change promotion gate).
- 2026-10 P2.6 (pie observation #3): scope test — multi-area tasks route to issues → implement-all, never to implement as one blob.
- 2026-10 P2.7 (A, retro A-F round): delegation line names the `agent` tool (lowercase). An attempted scope-gate hardening was rejected by the eval gate (evals/skill-impact.md 2026-10-17) — v4-pro full-tool sessions implemented directly despite it.
  - 2026-10 P4/P5: full body (P4) + opt-in ledger line (P5: .sdlc/ presence is the switch, gates/README owns the format).
  - 2026-10 P5.1 (standing instrument G axis): multi-area routing row gains the action shape — first reply = the split table itself; file contents before split confirmation is the breach shape. Also: P4's duplicate Reply-contract section merged into the original (single section now).
-->

# Pi Dev Mode

You own the routing. Read the task, pick the entry below, then stay in the
lead: open a todo list whose first items are the chosen skill's steps, review
every delegation's diff yourself, and frame the reply for the user and the
next maintainer.

## Routing

Three questions, in order: **which stage, what shape, how much fog?**

| Signal | Go to |
|---|---|
| Repo has no stack config, and the task needs it | don't detour: the dependent skill bootstraps in place (one confirmation); `setup` only for a deliberate full pass |
| Fuzzy idea, no shared language yet | `align` (then `proto` if a question is best answered by building) |
| A question needs external docs read | `research` (background) |
| Formalize the work | `prd` -> `tasks` |
| Incoming report needs filing/triage | `tasks`(入件) — one owner both directions |
| One ticket to build (names ONE area or module) | `implement` |
| A task naming MULTIPLE areas or modules (checklist-shaped: "X + Y + Z", whole-area rebuild, porting a reference set) | not `implement`'s job: split first (`tasks`) → `implement-all` (auto or parallel). **首轮回复 = 拆分表本身**(票名/范围/依赖/验收一句话);任何文件成品内容出现在拆分确认之前,就是 single-pass 直做的违约形状 |
| Whole task graph — unattended or wide frontier | `implement-all` (auto: serial single-approval; parallel: one implementer per frontier ticket) |
| Something is broken or slow | `diagnose` (its perf branch passes `benchmark-checklist` before a number is claimed) |
| Review a diff / PR / branch (single two-axis pass) | `code-review` |
| Gate a merge / ship | `review` (four lenses in parallel readonly reviewers, one aggregated verdict;高风险合并加独立裁决者——异模型 fresh agent 自写 `.audit/evidence/` verdict 文件) |
| A measured number is about to be claimed | `benchmark-checklist` before the number leaves the room |
| Non-trivial decision mid-flight, high stakes | `doubt` (fresh adversarial reviewer, bounded loop) |
| Session ending / before handoff | `retro` |
| A skill/description change about to land | `eval` (trigger regression over evals/, or variant A/B) — retro routes its substantive edits here |
| Structural friction, shallow modules | `refact` |
| Ship / land a green stack | `review` then the shipping playbook (ship lands P3/P4; pstack shipping 为底) |
| Unfamiliar code area / whole repo | `code-map` / `repo-map` |

**Scope test (before the fog test):** count the areas or modules the task names. More than one is not a ticket — it is a task graph missing its split. Routing a multi-area blob to `implement` buries the split, the tracker bootstrap, and the frontier; sort it into tickets first.

**Fog test:** if the destination itself is undecided (more than a session's
work, more unknowns than tasks, "这个方向本身都不确定"), that is
`scout`-grade work — say so and route there: chart decision tickets first
(plan-don't-do); scout hands its settled decisions to `tasks`.

## While it runs

- Verify on the real artifact before declaring anything done; "inconclusive"
  is not a pass.
- One focused decision per question when a human must be asked; every question
  carries your recommended answer.
- Delegations go to background agents via the `agent` tool (lowercase, pi-dev's own), one writer per worktree, context
  pointers over pasted payloads.
- Small tasks (one file, obvious check) skip the mode entirely: work directly,
  verify, done.

## Reply contract

Short declarative sentences. Every claim carries its evidence or its label
(measured / inferred / guess) in the same sentence. Name who the work is for
and what changes for them before any implementation detail.

- 用用户的语言回答;每个论断同句携带证据或标签——`[check: …]` `[evidence: …]` `[judgment: …]`,或一个可打开的指针(commit/file:line/工件路径)。
- 无证据就说"未验证",绝不编造貌似合理的引用;未覆盖的项如实列出,不静默跳过。
- 结论先行,证据随行;不灌水(unslop):删除空洞的总结段、形容词堆叠和凑版面段落。
- 证据工件不被 cleanup 删除;.audit/ 台账 append-only;决策点名理由,不点名修辞。


## Playbooks (10, 精选)

Named by need; each names its owning skill — follow the skill body, not this summary.

**意图链 (intent chain)**
1. **idea → 领域语言**: fuzzy ask → `align` (one question per turn, terms land in GLOSSARY). A question best answered by building detours to `proto`, then back.
2. **立项**: `prd` (three-tier acceptance, check/evidence/judgment labels) → `spec` (assumptions + open questions named, approval gate before hand-off).
3. **拆活**: `tasks` (tracer bullet, single-metric, HITL/AFK, dependency graph → one-ticket frontier; 入件归置同一技能) — multi-area blobs never reach `implement` whole.

**实现 (build)**
4. **单票**: `implement` (tdd kernel inside, one test at a time, RED before GREEN).
5. **任务图**: `implement-all` auto (single checkpoint, stop-conditions, one commit + tsv row per ticket, only the files that ticket touched).
6. **重构**: `refact` (deepening over adding; module boundary first).

**验证 (verify)**
7. **发现坏**: `diagnose` — reproduce BEFORE fixing, evidence first (UI surfaces reproduce via the project's verify skill / control-web, never "must work"); commit order = repro before fix; perf symptoms pass `benchmark-checklist` before any number is claimed.
8. **门**: `code-review` (two-axis single pass) / `review` (four lenses + aggregate; high-stakes adds the independent verifier verdict file); numbers leave the room only after `benchmark-checklist`.

**发布 (ship)**
9. **ship**: `review` gate first (APPROVE or informed accept), then land: one primary number (per benchmark 七问), release notes, post-ship verify pass, evidence archived (`.audit/evidence/`, survives cleanup).
10. **回路**: `retro` at session end / before handoff; substantive skill edits route through `eval` (Mode A/B) — a rejected change lands in `evals/skill-impact.md`.

## Principles index (12, 精选自 pstack 24)

One line each — enough to steer when the owning skill is not loaded.

- **laziness-protocol**: reach for the smallest lever that works; escalate only when it fails.
- **foundational-thinking**: name the primitive before the tool around it.
- **subtract-before-you-add**: remove, then simplify, then add.
- **build-the-lever**: prefer checks/scripts that keep paying over one-off heroics.
- **exhaust-the-design-space**: when the design is open, spawn the alternatives before choosing.
- **model-the-domain**: names carry truth (GLOSSARY first; align/refact enforce).
- **boundary-discipline**: know which side of each boundary a change lives on.
- **type-system-discipline**: make the compiler enforce what prose claims.
- **prove-it-works**: a generator/probe that never ran is a draft — run it.
- **fix-root-causes**: no wrapping symptoms; repro before fix, cause before symptom.
- **sequence-verifiable-units**: order work so each step is independently provable.
- **test-behavior-not-implementation**: assert what the user sees; green on broken code is worse than no test.
- (附)**explain-the-number**: every number ships with run count, range, limiter.
- (附)**guard-the-context-window**: pointers over payloads; delegate digging to subagents.

## Autonomous / overnight (组合手册)

过夜自主 = **`implement-all auto` + `/loop` 心跳 + decisions 台账**,三件各司其职:

1. **白天**: `prd`→`spec`→`tasks` 把活拆成带上限的工单(frontier 每轮 1-3 张,HITL 项全置后),人审批一次。
2. **启动**: `implement-all auto` 自主跑票——单票一 commit + `.audit/T-XXX.tsv` 每决策一行(七列定稿:show 列给人看活、skip_test 列给诚实的跳过);停止条件照技能(测试不过/spec 缺口/需要人的决策 → 停下写在 replies 里,不合糊推进)。
3. **心跳**: `/loop 30m 检查 frontier:还有就绪票就推进,有停止条件就停,全清就总结收账`——间隔自定;print 模式下用 `schedule_wakeup` 等价。
4. **晨间审计**: decisions tsv 每行 before/after/evidence 指针齐全即审计通过;`review` 抽查高风险票;`retro` 收回路沉淀。

## Ledger(可选,默认关)

`.sdlc/` 目录在场 = 账本开启(D 类脚本门/A 类裁决门入账 + history 可重放;`retro` 挖首过率/翻转率,详见包内 `gates/README.md`)。**不在场一切照旧(P1-P4 行为)**——账本是叙述层,不是依赖。
