# Issue Tracker: local files (`.dev/`)

This repo tracks implementation work as local files under `.dev/` — per-developer process memory (`/.dev/` in `.gitignore`). The durable record is commits + `docs/` + ADRs. Seeded in-place by `tickets` (one confirmation), per the router's no-detour bootstrap policy. Source template: `skills/setup/references/issue-tracker.md`.

## Layout

```text
.dev/
├── <slug>/                 # one initiative = one slugged dir (spec / plan / todo / tickets/)
├── inbox/                  # unattributed intake
├── lifecycle/              # SDLC ledger (gate.sh, opt-in; presence = on)
└── audit/                  # decision tsv + evidence
```

- Ticket ids `T-XXX` are globally unique across `.dev/`; next id = max seen + 1; never renumbered.
- `tickets` publishes plan rows + `todo.md` blocks in `.dev/<slug>/`; `triage-issue` intake lands in `.dev/inbox/T-XXX.md` and moves to a feature dir once attributed.
- Ledger: `.dev/lifecycle/` present ⇒ skills record gates there (see `gates/README.md`); absent ⇒ P1-P4 behavior unchanged.
