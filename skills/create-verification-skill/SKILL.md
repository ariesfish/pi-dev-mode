---
name: create-verification-skill
description: >-
  Generate a project-local verification skill that drives the real app the way a
  user does — any surface: web, desktop, CLI/TUI, API. Tailored to the repo,
  proven by running itself end to end before handover. Use when the user asks
  to make a control/verify/driver skill for this repo, or when a project has no
  scripted way to prove UI/CLI/service behavior. Chinese triggers: 生成验证技能, 驱动技能, 控制技能, 会话框怎么验证.
---

# Create a verification skill

Every serious project needs a scripted way to drive the real app and prove
behavior: launch it, exercise a feature the way a user would, capture evidence.
This skill generates that as a project-local skill, tailored to the repo.
Map platform vocabulary differences through `../../references/pi-host.md`; dispatch
subagents with the `agent` tool (foreground/background semantics single-sourced
in ../../references/pi-host.md). You write the generator's output
for the next agent, not for a human: it will be read cold, mid-task, by an agent
that has never seen the app.

## 1. Interview the repo, not the user

Answer these from the codebase and only ask the user what you cannot observe:

- **Surface:** what does a user actually touch? Pick the primary one, note the rest.
- **Run:** the repo's own documented dev command (scripts, Makefile, README), with
  ports, env vars, seed data, auth.
- **Drive:** existing harnesses first (Playwright/Cypress specs, expect scripts,
  curl-able endpoints, a debug port). Only then a generic recipe: web/Electron →
  `adapters/control-web/` (this package's CDP harness — launch/doctor/drive/cleanup, see its README);
  CLI/TUI → tmux/PTY;service → plain HTTP.
- **Observe:** screenshots, terminal transcripts, response bodies, logs, exit codes.
- **Isolate:** can two instances run side by side? If not, say so in the generated
  skill: refusing to double-drive a shared instance beats corrupting a session.

If the checkout doesn't build or start as-is, fix that first (or report it
precisely) before generating; a skill written against a broken base teaches wrong
steps.

## 2. Generate the skill

Write `.pi/skills/verify-<app>/SKILL.md` (`name: verify-<app>`, description
naming the app, the main surface, and when to use it) with these sections, each grounded in what the interview
actually found (no placeholders left):

- **Launch:** the exact command that starts the app for verification and how to
  tell it's ready (a log line, a prompt). Ready means usable, not just answering.
  Include teardown. Short-lived CLIs/TUIs: build once, each drive in its own PTY/tmux.
- **Doctor:** one read-only check answering "is this instance worth driving?"
  (process up, right version, port owned by us, auth valid). An agent runs this
  first whenever anything looks off.
- **Drive:** the harness recipe with real selectors/commands from this repo, not
  examples. Prefer stable handles (ARIA labels/accessible names, data
  attributes, prompt texts, route paths) over coordinates and tab order — the
  same locating order control-web uses.
- **Evidence:** what to capture for a proof and where it goes — recommend
  `.dev/audit/evidence/verify-<app>-<runId>/` (same root as implement-all's
  .dev/audit trail; review verdicts can re-check it). Verify side effects
  alongside what's visible; mocks only
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
proves it works — four H2s: `Sub-features` / `How to get to it (user POV)` /
`Driving it with <harness>` / `Gotchas`. A journey whose seed data lacks
preconditions must FAIL honestly with the reason recorded in Gotchas — never
loosen it green. The map is the repo's maintained verification
source — the domain-skills compounding mechanism: every fixed pitfall
deposits its recipe into the map. A frozen repro loop (`diagnose`'s
freeze-the-loop section) is a first-class seed: when one exists for a
defect, lift that feature's file from it — the drive steps, fixtures, seed
data, and end-state assertion are already proven.

## 4. Prove the generated skill before handing it over

Run its own instructions end to end once: **launch → doctor → drive ONE mapped
feature → evidence on disk → cleanup, and confirm the evidence survived**. A cleanup that eats the proof
fails this step. Fix what fails, and run the generated cleanup after every failed
iteration too, so broken attempts don't strand processes and ports. **A generated
skill that was never executed is a draft, not a deliverable.** If you proved it in
a stand-in for the real target, list every setup step the stand-in did that the
real target will not — those stay unverified until a real-target run covers them.

## 5. Offer the maintenance loop

Point the user at `maintain-verification-skill` for keeping the map honest as the
app changes. Suggest a cadence only if they ask.
