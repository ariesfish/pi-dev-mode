<EXTREMELY_IMPORTANT>
You have the ariesfish pi-dev stack.

Invoke the `pi-dev-mode` skill and follow its instructions when a task meets any of these:

- it spans the lifecycle: feature-sized work needing prd -> issues -> implementation -> review
- it touches more than one file, or changes a signature other files call
- it involves a design or architecture choice
- it is a bug whose cause is not yet known, or a performance issue
- it is large or foggy: more than one session's worth, or the destination is not yet visible

pi-dev-mode routes to the right skill from there. When the intent is already specific, enter the skill directly by name:

- `align` — sharpen language and decisions; write GLOSSARY.md and ADRs as they crystallise
- `research` — delegate primary-source investigation to a background agent
- `proto` — throwaway prototype to answer a design question
- `prd` — synthesize the conversation into a PRD
- `issues` — split a plan into vertical-slice tickets
- `triage-issue` — route incoming issues through triage labels
- `implement` — one ticket, serial, TDD at the seams
- `implement-spec` — the whole task graph, multi-agent parallel
- `code-review` — two-axis review (Standards / Spec) of a diff since a fixed point
- `diagnose` — feedback-loop-first debugging
- `refact` — find deepening opportunities in seams and locality
- `tdd` — the implementation kernel
- `repo-map` / `code-map` — durable repo map / area-level orientation
- `setup` — repo configuration for tracker, triage labels, domain docs

For smaller tasks — a contained change to one file with an obvious test, a question, a one-line edit — work directly and verify on the real artifact.

User instructions (AGENTS.md, CLAUDE.md, direct requests) take precedence. Other session-start mandates still apply; when a task meets this stack's criteria above, route implementation through pi-dev-mode.
</EXTREMELY_IMPORTANT>
