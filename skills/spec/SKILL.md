---
name: spec
description: >-
  Turn a conversation or PRD into an approved SPEC.md — the building contract
  a plan slices and an autonomous build trusts. Covers objective, commands,
  structure, style, testing strategy, boundaries, and three-label acceptance
  criteria; recurses per capability module with a stable-id map when the work
  spans modules. Use at the start of feature-sized work, or when a build needs
  an authoritative spec. Chinese triggers: 写 SPEC, 生成规格, 定规格,
  规格文档, 升级 PRD, spec first, 立项.
---

<!-- pi-dev-mode changelog:
- 2026-10 P1 new acquisition: forked from addyosmani spec-driven-development,
  adapted to this stack: PRD (prd skill) is the upstream input; task breakdown
  delegates to issues; execution delegates to implement / implement-spec /
  build; acceptance criteria use the three-label convention. mattp to-spec is
  the "no interview, just synthesis" precedent.
-->

# Spec

The spec is the shared source of truth between you and the human: what is being built, why, and how we will know it is done. Code without a spec is guessing.

## Input ladder

Where the content comes from, in order:

1. **A PRD exists** (typically a tracker issue from `prd`): synthesize the SPEC from it. Do not re-interview what the PRD already answers; read its Acceptance Criteria verbatim.
2. **align's labeled candidates exist in this conversation**: harvest them into the spec's Acceptance criteria.
3. **Neither**: synthesize from the conversation and codebase as they stand (no interview), surface your assumptions (Phase 2), and let the approval gate catch the gaps.

## Scope test: one module or a capability map

Default to a single SPEC. Recurse only when the requirement names distinct capabilities with their own consumers or data (identity, billing, notifications), when acceptance criteria cluster into separately shippable groups, or when one capability could be cut without rewriting the others.

**Propose a capability map before writing any module spec** — a module table plus a build order, reviewed like every gate:

```markdown
# Capability Map: [Initiative]

| Module id | Responsibility | Depends on |
|---|---|---|
| identity | Accounts, sessions, SSO | — |
| billing | Plans, invoices, payments | identity |

Build order: identity → billing
```

- Stable kebab-case ids, chosen once. Specs, slices, and build select work by these ids.
- Dependency arrows point one way; a cycle means one module.
- The map, not filename guessing, is the index: save it at the root, each module's spec alongside as `SPEC-<id>.md`.

## Phase 2: Write the spec

**Surface assumptions first**, before any content:

```
ASSUMPTIONS I'M MAKING:
1. This is a web application (not native mobile)
2. The database is PostgreSQL (from the existing Prisma schema)
→ Correct me now or I'll proceed with these.
```

**Template** (write to `SPEC.md` at the root, or `docs/SPEC.md`, or `spec/`. Downstream skills — `implement-all` above all — look in exactly these places; a README is not a spec):

```markdown
# Spec: [Name]

## Objective
[What we're building and why. Who is the user. What success looks like.]

## Tech Stack
[Framework, language, key dependencies with versions]

## Commands
Build: npm run build
Test: npm test
Lint: npm run lint
Dev:   npm run dev

## Project Structure
[Directory layout with one-line descriptions]

## Code Style
[One real snippet showing the conventions; naming rules]

## Testing Strategy
[Framework, test locations, which test level for which concern]

## Acceptance Criteria
[The contract. Three-label convention, mandatory:]

- [check: <command>] — verified by running the command
- [evidence: <procedure>] — verified by capturing the named artifact
- [judgment: <who and why>] — only the named human can decide

Every objective line has at least one criterion; unlabeled criteria go back
to the ladder (give a procedure, or admit judgment).

## Boundaries
- Always: [run tests before commits, follow naming conventions]
- Ask first: [schema changes, new dependencies, CI config]
- Never: [commit secrets, edit vendor dirs, delete failing tests to pass]

## Open Questions
[Anything unresolved that needs human input]
```

**Reframe vagueness as criteria.** "Make the dashboard faster" becomes "LCP < 2.5s on 4G; initial load < 500ms; CLS < 0.1" — then the approval gate has something to approve.

**External spec tools.** If the repo already uses OpenSpec or another spec system, keep its artifact format and storage; this skill owns the clarification, content, and approval gates, not the file format.

## Phase 3: Approval gate — stop here

1. Summarize the spec, list Open Questions and assumptions.
2. Ask the human to approve or amend.
3. **Stop your turn.** No slicing, no code, this turn.

After approval, this stack takes over (this skill hands off, it does not plan or build):

- `tasks` — slices the spec into vertical tracer-bullet tickets (task breakdown is **tasks'** canonical authority; if this spec ever disagrees with the ticket graph, the graph wins and the spec gets updated).
- `implement` (one ticket) / `implement-all` (whole graph: auto serial single-approval, or parallel multi-agent) — execution.
- `code-review` — the Standards-vs-Spec axis reads this spec back.

## Keeping the spec alive

The spec is a living contract. When a discovery changes the data model or a boundary, update the spec first, then the code — a divergence between spec and implementation is a finding, not a fact.
