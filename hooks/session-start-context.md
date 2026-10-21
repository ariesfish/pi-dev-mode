<EXTREMELY_IMPORTANT>
You have the pi-dev-mode stack.

Invoke the `pi-dev-mode` skill and follow its instructions when a task meets any of these:

- it spans the lifecycle: feature-sized work needing spec -> tickets -> implementation -> review
- it touches more than one file, or changes a signature other files call
- it names multiple areas or modules (a task graph missing its split): slice it first (`tickets`), then `implement-all`
- it involves a design or architecture choice
- it is a bug whose cause is not yet known, or a performance issue
- it is large or foggy: more than one session's worth, or the destination is not yet visible (scout-grade work)
- it should run unattended once approved, or spans a whole task graph, or needs a quality bar written down first (constraints)

pi-dev-mode routes to the right skill from there; when the intent is already specific, entering that skill by name is the stack's tier-2 form. Pi injects every skill's own trigger-rich description into this session — the catalog rides there, single-sourced. Keep no hand-copied inventory here: one once drifted four skills behind the shipped set.

Tool and host conventions: the skills occasionally name Claude Code conventions (the Skill tool, the Agent tool, AskUserQuestion) or model family names. `references/pi-host.md` is the single translation authority — read it when one appears.

Headless one-shot sessions (-p / no user present): nobody will answer mid-run
questions — an ask is terminal, not a pause. For a multi-area or whole-set task,
the final reply IS the deliverable: the split table (tickets + scope + one-line
acceptance each), the open decisions with your recommended defaults, and STOP —
work starts when a human says so. Deciding your own defaults and continuing
into implementation in a headless run is self-answering, not autonomy.

For smaller tasks — a contained change to one file with an obvious test, a question, a one-line edit — work directly and verify on the real artifact.

A tell-me request (告诉我在哪/改哪行/别动手/point me at/no takeover/I'll fix it myself) is an **answer** request: deliver the exact spots (file:line) and the change they would make — never edit. Edits need an explicit do-request (改/修/fix it/帮我改). A red check is information to report, not a license to fix.

Scope: the no-edit rule binds product and source changes. Bootstrapping this stack's own config — tracker choice, glossary seeding, CONSTRAINTS offer — is not that class; it keeps the owning skill's designed one-confirmation-then-seed flow.

If the task's acceptance is visual (样式/布局/参考图对齐) and your model cannot see images (`read` says so), delegate the visual check to a multimodal image-reader agent (`pi-dev:image-reader`) — never claim visual parity from code or pixel reconstruction alone.

High-stakes merges also earn an independent adjudicator: a fresh readonly agent on a different model, judging the diff alone and writing its own PASS|FAIL verdict file under `.dev/audit/evidence/` (`review` skill's independent-verifier section).

User instructions (AGENTS.md, CLAUDE.md, direct requests) take precedence. Other session-start mandates still apply; when a task meets this stack's criteria above, route implementation through pi-dev-mode.
</EXTREMELY_IMPORTANT>
