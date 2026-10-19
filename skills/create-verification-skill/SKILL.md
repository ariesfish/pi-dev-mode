---
name: create-verification-skill
description: >-
  Generate a project-local verification skill that drives the real app the way a
  user does — any surface: web, desktop, CLI/TUI, API. Tailored to the repo,
  proven by running itself end to end before handover. Use when the user asks
  to make a control/verify/driver skill for this repo, or when a project has no
  scripted way to prove UI/CLI/service behavior. Chinese triggers: 生成验证技能,
  给这个仓库做个 verify 技能, 驱动技能, 控制技能, 验证生成器, 会话框怎么验证.
---

# Create a verification skill

Every serious project needs a scripted way to drive the real app and prove
behavior: launch it, exercise a feature the way a user would, capture evidence.
This skill generates that as a project-local skill, tailored to the repo.
平台差异(CC 语汇)按 `references/pi-host.md` 映射;派发子代理用小写 `agent` 工具
(foreground 等结果,或 run_in_background 收通知)。You write the generator's output
for the next agent, not for a human: it will be read cold, mid-task, by an agent
that has never seen the app.

## 1. Interview the repo, not the user

Answer these from the codebase and only ask the user what you cannot observe:

- **Surface:** what does a user actually touch? Pick the primary one, note the rest.
- **Run:** the repo's own documented dev command (scripts, Makefile, README), with
  ports, env vars, seed data, auth.
- **Drive:** existing harnesses first (Playwright/Cypress specs, expect scripts,
  curl-able endpoints, a debug port). Only then a generic recipe: web/Electron →
  `adapters/control-web/`(本包 CDP harness,launch/doctor/drive/cleanup 见其 README);
  CLI/TUI → tmux/PTY;service → plain HTTP.
- **Observe:** screenshots, terminal transcripts, response bodies, logs, exit codes.
- **Isolate:** can two instances run side by side? If not, say so in the generated
  skill: refusing to double-drive a shared instance beats corrupting a session.

If the checkout doesn't build or start as-is, fix that first (or report it
precisely) before generating; a skill written against a broken base teaches wrong
steps.

## 2. Generate the skill

Write `.pi/skills/verify-<app>/SKILL.md`(`name: verify-<app>`,description 写明
app、主 surface 与何时用)with these sections, each grounded in what the interview
actually found (no placeholders left):

- **Launch:** the exact command that starts the app for verification and how to
  tell it's ready (a log line, a prompt). Ready means usable, not just answering.
  Include teardown. 短命 CLI/TUI 则是"build once, each drive in its own PTY/tmux"。
- **Doctor:** one read-only check answering "is this instance worth driving?"
  (process up, right version, port owned by us, auth valid). An agent runs this
  first whenever anything looks off.
- **Drive:** the harness recipe with real selectors/commands from this repo, not
  examples. Prefer stable handles (ARIA 标签/可访问名、data 属性、提示文案、路由
  路径)over coordinates and tab order — 与 control-web 的定位次序一致。
- **Evidence:** what to capture for a proof and where it goes — recommend
  `.dev/audit/evidence/verify-<app>-<runId>/`(与 implement-all 的 .dev/audit 台账同根,
  review 裁决可复核)。Verify side effects alongside what's visible; mocks only
  where a production boundary already isolates the external system.
- **Cleanup:** tear down what the run created. Never kill by process name; kill
  what you started. Cleanup removes instances and scratch state, never the
  evidence — proof artifacts survive the teardown, at the named location.
- **Helpers:** any script the skill ships is executable and its invocation is
  shown in the body. A helper the reader has to reverse-engineer is not a helper.

## 3. Seed the feature map

Create `.pi/skills/verify-<app>/features/README.md` plus one file per user-facing
feature you can identify (aim for the top 3-5 to start, from routes, commands,
menus, or docs). Each file answers, from the user's POV: what the feature is,
how to reach it, how to drive it with the harness, and what observable end state
proves it works — 四个 H2:`Sub-features` / `How to get to it (user POV)` /
`Driving it with <harness>` / `Gotchas`。种子数据缺前置条件的,该旅程如实报败,
原因进 Gotchas;绝不放水让旅程变绿。The map is the repo's maintained verification
source — the domain-skills 复利机制:每修一个坑,坑的写法沉淀进 map。

## 4. Prove the generated skill before handing it over

Run its own instructions end to end once: **launch → doctor → drive ONE mapped
feature → 证据落盘 → cleanup,确认清理后证据仍在**。A cleanup that eats the proof
fails this step. Fix what fails, and run the generated cleanup after every failed
iteration too, so broken attempts don't strand processes and ports. **A generated
skill that was never executed is a draft, not a deliverable.** If you proved it in
a stand-in for the real target, list every setup step the stand-in did that the
real target will not — those stay unverified until a real-target run covers them.

## 5. Offer the maintenance loop

Point the user at `maintain-verification-skill` for keeping the map honest as the
app changes. Suggest a cadence only if they ask.
