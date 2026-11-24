# Issue Tracker: local files (`.dev/`)

This repo tracks implementation work as local files under `.dev/` — per-developer process memory (`/.dev/` in `.gitignore`). The durable record is commits + `docs/` + ADRs. Seeded in-place by the carriers named in the seed's bootstrap oath (`tickets`, `implement`, `code-review`, `triage-issue`, `scout`), per the router's no-detour bootstrap policy. Source template: `skills/setup/references/issue-tracker.md`.

## Layout

```text
.dev/
├── feature-<name>/       # one initiative everything (whole dir name is the slug, e.g. feature-sdlc-wiring/)
├── inbox/                  # unattributed intake
├── lifecycle/              # SDLC ledger (gate.sh, opt-in; presence = on)
└── audit/                  # decision tsv + evidence (named <slug>-T-XXX.tsv)
```

- **Naming contract**: initiative dirs start with `feature-` — the whole dir name (prefix included) is the slug. Reserved names `inbox/` `lifecycle/` `audit/` never take the prefix; a non-reserved top-level dir without it is a violation. `ls .dev/` partitions at a glance; slugs are named at spec/research/scout.
- Ticket ids `T-XXX` are unique **within** a feature dir (`.dev/feature-<name>/`) and within `.dev/inbox/`: each numbers from `T-001` independently, so two features may both carry a `T-001`. Ids are never renumbered — an inbox ticket fostered into a feature takes that feature's next id and records `formerly inbox/T-XXX`. Cross-feature references are qualified (`feature-<name>/T-XXX`, or `inbox/T-XXX`); a bare `T-XXX` is valid only inside the dir that owns it.
- Ledger and audit rows carry the same namespace: `gate.sh open <slug>/T-XXX` (`items/<slug>/T-XXX/state.json`), decision rows in `.dev/audit/<slug>-T-XXX.tsv`.
- `tickets` publishes plan rows + `todo.md` blocks in `.dev/<slug>/`; `triage-issue` intake lands in `.dev/inbox/T-XXX.md` and moves to a feature dir once attributed (taking that feature's next id, with `formerly inbox/T-XXX` on the ticket).
- Ledger: `.dev/lifecycle/` present ⇒ skills record gates there (see `gates/README.md`); absent ⇒ P1-P4 behavior unchanged.
