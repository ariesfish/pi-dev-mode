# Pi host mapping

Skills in this package descend from Claude Code lineages (mattp, addyosmani, pstack) and occasionally use its conventions. When a skill mentions one of the below, use the Pi equivalent instead:

| Convention in skill text | On Pi |
|---|---|
| "Call the Skill tool with X" / "invoke skill X" | The skill loads by its name (its description matches, or force it with `/skill:X`) |
| Task / Agent tool (subagent dispatch) | The `agent` tool from this package's extension: foreground waits and returns the final text; `run_in_background: true` returns an agentId and a completion notice arrives later; `send_message` steers a running agent; `isolation: "worktree"` gives it its own worktree; `readonly: true` strips edit/write |
| `AskUserQuestion` | `ask_user_question` (same shape; no UI in print mode or child agents, so the skill says to ask in plain text) |
| `ScheduleWakeup` / recurring re-invocation | `schedule_wakeup`; the `/loop [interval] <prompt>` command |
| Ask N things in parallel / "spawn both subagents in the same message" | Make N `agent` calls with `run_in_background: true` in one response; a parallel-calls note rides the system prompt so it behaves like Claude Code |
| Session transcripts (`~/.claude/projects/...`) | `~/.pi/agent/sessions/--<cwd>--/`; subagent sessions live under `<agent dir>/pi-dev/<parent session id>/agents/` |
| Sub-agent worktrees | `.claude/worktrees/agent-<id>` (created and auto-removed by the extension when the agent left nothing) |

## Model family names

Skills may name models by family alias (opus, fable, sonnet, haiku). Pass the alias as the `agent` tool's `model`; it resolves per the current session's provider through `models.json`. To remap: add a `pi models: <alias>=<provider>/<id>` line to `~/.pi/agent/pi-dev-models.md`.


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
