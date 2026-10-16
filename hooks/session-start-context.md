<EXTREMELY_IMPORTANT>
You have the pi-dev-mode stack.

Invoke the `pi-dev-mode` skill and follow its instructions when a task meets any of these:

- it spans the lifecycle: feature-sized work needing prd -> issues -> implementation -> review
- it touches more than one file, or changes a signature other files call
- it names multiple areas or modules (a task graph missing its split): slice it first (`issues`), then `implement-all`
- it involves a design or architecture choice
- it is a bug whose cause is not yet known, or a performance issue
- it is large or foggy: more than one session's worth, or the destination is not yet visible (wayfinder-grade work)
- it should run unattended once approved, or spans a whole task graph, or needs a quality bar written down first (constraints)

pi-dev-mode routes to the right skill from there. When the intent is already specific, enter the skill directly by name:

- `align` — sharpen language and decisions; write GLOSSARY.md and ADRs as they crystallise
- `research` — delegate primary-source investigation to a background agent
- `proto` — throwaway prototype to answer a design question
- `prd` — synthesize the conversation into a PRD
- `spec` — upgrade conversation/PRD into the building contract (SPEC.md, three-label acceptance criteria)
- `constraints` — the project's quality bar, with numbers (CONSTRAINTS.md)
- `issues` — split a plan into vertical-slice tickets (task graph + frontier)
- `triage-issue` — route incoming issues through triage labels
- `implement` — one ticket, serial, TDD at the seams
- `implement-all` — the whole task graph: auto (serial, single approval) or parallel (one implementer per frontier ticket, each in its own worktree)
- `implement-all` — the whole task graph (auto: single approval, serial; parallel: one implementer per frontier ticket in its own worktree)
- `wayfinder` — when the destination itself is foggy: decision tickets until the way is clear
- `code-review` — two-axis review (Standards / Spec) of a diff since a fixed point
- `review` — the four-lens merge gate (two-axis + comment discipline + adversarial doubt + constraints audit)
- `doubt` — in-flight adversarial cross-examination of a non-trivial decision
- `benchmark-checklist` — vet a measured performance number before reporting it
- `retro` — session retrospective routing findings to checks, types, docs, or skill edits
- `eval` — the promotion gate for skill changes: trigger regression over the case bank, or blinded variant A/B
- `diagnose` — feedback-loop-first debugging
- `refact` — find deepening opportunities in seams and locality
- `tdd` — the implementation kernel
- `repo-map` / `code-map` — durable repo map / area-level orientation
- `setup` — deliberate config pass (tracker, triage labels, domain docs); a dependent skill needing config bootstraps it in place with one confirmation — no detour

For smaller tasks — a contained change to one file with an obvious test, a question, a one-line edit — work directly and verify on the real artifact.

User instructions (AGENTS.md, CLAUDE.md, direct requests) take precedence. Other session-start mandates still apply; when a task meets this stack's criteria above, route implementation through pi-dev-mode.
</EXTREMELY_IMPORTANT>
