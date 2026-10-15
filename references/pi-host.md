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
