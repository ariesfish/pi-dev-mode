# Issue Tracker: Local Files (.dev/)

This repo tracks issues as plain files under `.dev/` — per-developer process
memory. Put `/.dev/` in `.gitignore`: its contents are one developer's
in-flight working set, never pushed, never shared as team record. The durable,
team-shared record is the merged code, commits, and `docs/adr/`. No tracker
service, no CLI — every skill reads and writes these files through plain file
edits.

## Layout: feature-first

**一次大需求(initiative/feature)= 一个 slugged 目录**——半成品续跑,进这一个目录就全齐:

```text
.dev/
├── <slug>/                    # 一次大需求的一切
│   ├── spec.md                # 特性合同(单模块;多模块: map.md + SPEC-<id>.md)
│   ├── plan.md                # 本需求的切片图:索引 + 阻塞边 + Closed 行
│   ├── todo.md                # 本需求的检查单 + triage 状态标记
│   ├── research.md            # 调研笔记(多份则 research/<topic>.md)
│   └── tickets/T-XXX.md       # 全文票(plan 行装不下时才建,可选)
├── inbox/                     # 未归属需求的入件(归属定了就过继进特性目录)
├── lifecycle/                 # gates 账本(机器,跨需求,仅 opt-in 时存在)
└── audit/                     # 决策台账 tsv + 证据(跨需求)
```

- **T-id 全局唯一,跨需求不重号**:下一个 id = `.dev/` 下任何地方出现的最大号 + 1;永不重排。
- **scout**(探路):地图落 `.dev/<slug>/scout-map.md`,决策票就在同一目录的 plan/tickets 里;路清了 spec.md 进同一目录,slug 贯穿始终。
- **triage-issue**(入件):无归属的报文落 `.dev/inbox/T-XXX.md`(`Status:` 行带角色);route 定了(哪个需求)就把票过继进该特性的 plan/todo。
- 根下不再有共享 plan/todo——frontier 是单需求内的事;跨需求并行跑 `implement-all` 时,glob `.dev/*/plan.md`,frontier = 各需求 frontier 的并集。

## Creating an issue (in a feature's dir; unattributed intake → inbox/)

Append a section to that feature's `plan.md`:

```markdown
## [T-004] Search filters reset on page change

- **Type**: HITL / AFK
- **Blocked by**: T-002 (if any)
- **What to build**: one-paragraph end-to-end behavior
- **Acceptance criteria**: three-label list ([check: …] / [evidence: …] / [judgment: …])
```

Keep ids stable; append only — an issue's historical position never changes.

Add its checkbox block to the same feature's `todo.md`:

```markdown
## T-004
- [ ] criterion 1
- [ ] criterion 2
```

When the ticket needs a fuller body than its plan row carries (prototype
snippets, interface contracts), write `tickets/T-004.md` with the
`Parent` / `What to build` / `Acceptance criteria` / `Blocked by` shape; the
plan row stays the index entry. A `Status:` line near the top of a ticket file
carries its triage state; comments append at the bottom under `## Comments`.

Unattributed intake (`triage-issue`): file `inbox/T-XXX.md` with the report
body and a `Status:` line; when its route settles, add its plan section and
todo block to the owning feature (or a new feature dir) and mark the inbox
file fostered with a pointer.

## Reading an issue

Read the matching `## [T-…]` section in the feature's `plan.md` (and its
ticket file, if one exists) in full before working. "Everything open" per
feature: the `## …` sections whose task is not checked off in that feature's
`todo.md`.

## Labeling (triage roles)

Roles map to status markers in `todo.md`, applied as a parenthesized tag on
the heading line (inbox and ticket files carry a `Status:` line instead):

| Role | Marker |
|---|---|
| needs-triage | `(needs-triage)` |
| needs-info | `(needs-info)` |
| ready-for-agent | `(ready-for-agent)` |
| ready-for-human | `(ready-for-human)` |
| wontfix | `(wontfix)` + checked off |

So a ready issue reads `## T-004 (ready-for-agent)`.

## Closing an issue

Check off its `todo.md` block and add one line under the plan section:
`Closed <date>: <one-line resolution>`. Do not delete the section while the
feature is in flight.

## Conventions

- Never edit another task's section while resolving yours; append your
  resolution line only.
- Ship-time cleanup: once a feature lands and its truth is in the code,
  commits, and ADRs, **delete or archive the whole `.dev/<slug>/` directory** —
  that is the point of feature-first: cleanup is one `rm`, not section
  surgery. `lifecycle/`, `audit/` stay.
- If the repo later migrates to GitHub issues, `setup` rewrites this file into
  the new tracker doc; the dev dirs stay until their owner clears them.
