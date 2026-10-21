# Pi host mapping

Skills in this package descend from Claude Code lineages (mattp, addyosmani, pstack) and occasionally use its conventions. When a skill mentions one of the below, use the Pi equivalent instead — this table is the single translation authority; skill bodies speak Pi natively:

| Convention in skill text | On Pi |
|---|---|
| "Call the Skill tool with X" / "invoke skill X" | The skill loads by its name (its description matches, or force it with `/skill:X`) |
| Task / Agent tool (subagent dispatch) | The `agent` tool from this package's extension: foreground waits and returns the final text; `run_in_background: true` returns agentIds and a completion notice arrives later; `send_message` steers a running agent or continues a finished one; `isolation: "worktree"` gives a run its own worktree; `readonly: true` strips edit/write; `model` takes a family alias or provider/id; per-run `output` binds the durable artifact to an explicit path |
| Batch / parallel delegation ("spawn N subagents") | ONE `agent` call carrying `tasks: [{key, description, prompt, model?, isolation?, readonly?, retry≤2}]` (2–8): foreground returns an aggregate table, background settles silently and a single aggregate notice wakes the session when every task ends. N one-by-one calls still work; the batch is the preferred shape |
| Child asks the parent mid-run | The child calls `ask_parent` (reason `need_decision` blocks the child until answered, `progress_update` reports and continues; 30-minute hard cap, then the child decides on its own). The parent session wakes with one intercom notice and answers via `answer_child` (`to` = the request id; empty `to` lists pending). Background children only — a foreground child's ask_parent deadlocks until the cap |
| `AskUserQuestion` | `ask_user_question` (1–4 questions, 2–4 options with `description`, one interaction: type-to-search filters, multiSelect picks in place then the Submit row, the freeform row types a custom answer; per-question `context` folds past 4 lines, `timeout` counts down; headless/child sessions refuse and the skill asks in plain text) |
| `ScheduleWakeup` / recurring re-invocation | `schedule_wakeup`; the `/loop [interval] <prompt>` command |
| Session transcripts (`~/.claude/projects/...`) | `~/.pi/agent/sessions/--<cwd>--/`; subagent sessions live under `<agent dir>/pi-dev/<parent session id>/agents/`, every run's durable output under `<parent session id>/artifacts/<agentId>.md` (child self-writes at its shutdown). Background durable agents (T-030) keep their whole transcript in `<parent session id>/durable.sqlite` instead — a session resumed by `pi --continue` reopens it, resumes their parked work, and delivers their answers |
| Session restarts | Background agents survive: the foreground rpc child ends with its parent (honest stop + artifact), while every `run_in_background: true` run sits in the session's durable sqlite at `~/.pi/agent/pi-dev/<session id>/durable.sqlite`; reopening the same session id (pi --continue) resumes parked work — heads-up: a fresh `pi` (new id) does not see them (same visibility as T-025 orphans) |
| Sub-agent worktrees | `.dev/worktrees/agent-<id>` (created and auto-removed by the extension when the agent left nothing) |
| `.claude-plugin/plugin.json`, `~/.claude/settings.json`, `.claude/agents/` (package/plugin conventions) | Pi packages: `package.json`'s `pi` key (`skills`/`extensions`/`prompts`), `pi install` sources, `~/.pi/agent/settings.json` package list, `agents/*.md` at package root |

## Model family names

Skills may name models by family alias (opus, fable, sonnet, haiku). Pass the alias as the `agent` tool's `model` (top level or per task); it resolves per the current session's provider through `models.json`. To remap: add a `pi models: <alias>=<provider>/<id>` line to `~/.pi/agent/pi-dev-models.md`.


## Provider compatibility (system prompt delivery)

Skills, the routing mandate, and steering ride the **system prompt**. The
prompt must reach the model for the stack to exist at all.

**The real failure mode (verified 2026-10-16, wire-level):** pi sends the
system prompt as `role: "system"` — **except for models with `reasoning: true`
in models.json, where pi 1.3+ sends `role: "developer"`** (the OpenAI
reasoning-model convention). An OpenAI-compatible relay or endpoint that does
not honor the developer role drops the whole message silently: every tool
still works (declarations ride the `tools` array), but the model has never
seen a single instruction, skill, or the mandate — and will confidently
fabricate plausible "quotes" from its system prompt when asked.

**Fix (pi-native):** in `~/.pi/agent/models.json`, add to that model's entry:

```json
"compat": { "supportsDeveloperRole": false }
```

pi falls back to `role: "system"`. Verified end to end: after the flag, the
model finds the mandate verbatim (string-level YES on `pi-dev-mode`,
`EXTREMELY_IMPORTANT`), lists the skill catalog, and quotes rules correctly.

**Audit method (strong evidence, not model introspection):** ask the model to
search its instruction text for exact strings (`pi-dev-mode`, `EXTREMELY_IMPORTANT`)
— introspection-style "quote your prompt" questions are weak evidence; models
fabricate plausible quotes. For wire-level certainty, hang a probe extension
on `before_provider_request` and dump `payload.messages[0]` (role + content
length + string presence).
