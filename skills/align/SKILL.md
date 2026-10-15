---
name: align
description: >-
  Challenge architecture and product design plans against the existing domain
  language, sharpen terminology, and update documentation (GLOSSARY.md, ADRs)
  inline as decisions crystallise. Use when the user wants to clarify domain
  language, stress-test a developer plan against the project's language and
  documented decisions, or decide whether a design choice deserves an ADR.
  Chinese triggers: 拷打方案, 澄清需求, 追问我, 统一术语, 领域建模, 设计决策, 架构决策, 写 ADR,
  更新 GLOSSARY, 沉淀上下文.
---

<!-- ariesfish changelog:
- migrated from ~/.agents/skills/dev-align (mattp-derived base)
- 2026-10-15 synced to mattp@49dd158 (d80fa0f): CONTEXT.md/CONTEXT-MAP.md renamed to
  GLOSSARY.md/GLOSSARY-MAP.md as the primary convention; legacy CONTEXT.md files are
  read as the glossary. grilling #1193: word questions so "yes" accepts the recommendation.
Append new entries below this line only. - 2026-10 P1 upgrade (03 matrix row): three-label acceptance-criteria seeding; proto inter-routing for build-answerable questions.
-->

# Align

Use this skill to align fuzzy architecture or product-design ideas with precise domain language, explicit trade-offs, and durable project documentation.

## Workflow role

Use `align` before `prd`, `issues`, `tdd`, or `refact` when the plan has fuzzy domain language, unresolved trade-offs, or decisions that may deserve an ADR. Its output is aligned language and durable context, not implementation.

When an interview surfaces a question that is best answered by building rather than asking ("does this state machine feel right?", "which layout?"), route that one question to `proto`, then resume the interview with the answer. A question a prototype can settle is not the human's to answer.

When an interview surfaces a question that is best answered by building rather than asking ("does this state machine feel right?", "which layout?"), route that one question to `proto`, then resume the interview with the answer. A question a prototype can settle is not the human's to answer.

## Workflow

1. Inspect the codebase and existing docs before asking questions when the answer may already be present.
2. Look for `GLOSSARY-MAP.md`, root or context-specific `GLOSSARY.md`, and `docs/adr/`. Legacy repos that predate the rename use `CONTEXT.md`/`CONTEXT-MAP.md`: read them as the glossary and offer to rename once, at the end of the session.
3. Interview the user one decision at a time until the plan is precise enough to act on.
4. Use the ask_user skill/tool for each question; ask exactly one focused question per turn and wait for the answer before continuing. Word each question so "yes" accepts your recommended answer.
5. For each question, include your recommended answer.
6. Ask in the same language as the user's request.
7. Update docs inline as decisions become stable. Do not batch all documentation at the end.

## Documentation rules

Create files lazily:

- If no `GLOSSARY.md` exists, create one when the first domain term is resolved.
- If no `docs/adr/` exists, create it when the first ADR-worthy decision appears.
- `GLOSSARY.md` is only a glossary. Do not treat it as a spec, scratch pad, or repository for implementation decisions.
- Keep `GLOSSARY.md` totally devoid of implementation details.

Reference formats:

- Read `references/glossary-format.md` before creating or editing `GLOSSARY.md`.
- Read `references/adr-format.md` before creating an ADR.

## What to challenge

- **Glossary conflicts:** If the user's wording conflicts with `GLOSSARY.md`, call it out immediately.
- **Fuzzy terms:** Propose a precise canonical term when language is vague or overloaded.
- **Concrete scenarios:** Stress-test domain relationships with edge cases.
- **Code contradictions:** If the code disagrees with the user's description, surface the contradiction.
- **Hidden trade-offs:** Separate reversible implementation details from decisions that deserve a record.

## Context structure

Most repos have one context:

```text
/
├── GLOSSARY.md
├── docs/adr/
└── src/
```

Repos with multiple contexts use a root `GLOSSARY-MAP.md` that points to each context's `GLOSSARY.md` and ADR directory.

When multiple contexts exist, infer which context the topic belongs to. If unclear, ask one focused question.

## Seeding acceptance criteria

When a decision crystallises into something worth building, record it in the conversation as an acceptance-criteria candidate, labeled with exactly one of:

- `[check: <command>]` — verifiable by running the command and reading its output or exit code.
- `[evidence: <procedure>]` — verifiable by following the procedure and capturing the artifact (screenshot, ARIA snapshot, transcript).
- `[judgment: <who and why only a human can decide>]` — everything a machine cannot verify.

`prd` and `spec` harvest these verbatim into their Acceptance criteria sections. Do not invent a `[check]` label for a criterion no machine can verify; label it `[judgment]` and say whose call it is.

## Seeding acceptance criteria

When a decision crystallises into something worth building, record it in the conversation as an acceptance-criteria candidate, labeled with exactly one of:

- `[check: <command>]` — verifiable by running the command and reading its output or exit code.
- `[evidence: <procedure>]` — verifiable by following the procedure and capturing the artifact (screenshot, ARIA snapshot, transcript).
- `[judgment: <who and why only a human can decide>]` — everything a machine cannot verify.

`prd` and `spec` harvest these verbatim into their Acceptance Criteria sections. Do not invent a `[check]` label for a criterion no machine can verify; label it `[judgment]` and say whose call it is.

## ADR threshold

Offer an ADR only when all three are true:

1. **Hard to reverse** — changing the decision later would be meaningfully expensive.
2. **Surprising without context** — a future reader would wonder why the system was designed this way.
3. **Real trade-off** — there were genuine alternatives and one was chosen for specific reasons.

If any condition is missing, skip the ADR and keep the decision in conversation or `GLOSSARY.md` as appropriate.
