# NOTICE — vendored Pi extension

`pi/` (13 TypeScript files) is vendored from
[michael-denyer/pstack-claude](https://github.com/michael-denyer/pstack-claude),
directory `plugins/pstack/pi/`, at commit `94f5ce9` (2026-10-14).

- Upstream: MIT © 2026 Michael Denyer. See the upstream repo for its own
  notices and its upstream-pin chain (original pstack © Lauren Tan).
- Adaptations in this copy (all mechanical, no behavior change intended):
  - namespace strings: `pstack-depth` → `pi-dev-depth` (flag), `pstack` →
    `pi-dev` state dir, `pstack-agents`/`pstack-agent` entries/notice types →
    `pi-dev-*`, `pstack:` agent-type prefix → `pi-dev:`, sheet file
    `pstack-models.md` → `pi-dev-models.md`
  - `prompt.ts`: mandate path unchanged (`hooks/session-start-context.md`,
    content is ours); the pi-tools pointer aims at our
    `references/pi-host.md`; section keys renamed `pi-dev-*`
  - `agent-tools.ts`: subagent_type description no longer advertises pstack's
    agent types (this package ships none; `agents/*.md` would add them)
  - `models.json`: the `pi` provider tables were carried over from upstream's
    models.json at import; replaced 2026-10-21 with this user's own providers
    as a `*` wildcard table (fable→funai/gpt-5.6-sol, opus→cfgpu/glm-5-3,
    sonnet→deepseek/deepseek-flash; haiku dropped from `available`).
    roles/tiers/panels keys were dropped at import (not read by the extension)
- Upstream sync: diff `pi/` against upstream when advancing; the upstream
  tests (`tests/pi/` in the source repo) cover these files and were not
  vendored — treat this tree as a fork, and re-run a manual smoke (`pi` smoke:
  spawn a background agent, `/loop`, `ask_user_question`) after any sync.
- The `hookOff` / `pi models:` override-sheet semantics are upstream's: the
  sheet lives at `~/.pi/agent/pi-dev-models.md`.
- OUR FILE, not vendored: `pi/lifecycle.ts` (P4, 2026-10-18) — lifecycle
  commands /spec /build /review /ship registered as a separate extension
  entry in package.json (pi.extensions). It owns no state and depends only on
  `registerCommand` / `sendUserMessage` / `getCommands` public APIs. Upstream
  sync does not touch it.
