---
name: spec
description: >-
  Turn a conversation into an approved spec — the building contract a plan
  slices and an autonomous build trusts. Decision-only template: objective,
  implementation decisions, out of scope, three-label acceptance criteria,
  ask-first triggers, open questions. Lives at .dev/<slug>/spec.md as per-developer
  process memory (gitignored); recurses per capability module with a map when
  the work spans modules. Use at the start of feature-sized work, or when a
  build needs an authoritative contract. Chinese triggers: 写 SPEC, 生成规格,
  定规格, 规格文档, 立项, spec first, 需求文档, 整理需求.
---

<!-- pi-dev-mode changelog:
- 2026-10 P6.2: landing is the feature dir itself — .dev/<slug>/spec.md (was .dev/spec/<slug>.md); multi-module map+SPEC-<id>.md live in .dev/<initiative>/. One feature, one directory, everything in it.
- 2026-10 P1 new acquisition: forked from addyosmani spec-driven-development,
  adapted to this stack: task breakdown delegates to tasks; execution
  delegates to implement / implement-all; acceptance criteria use the
  three-label convention. mattp to-spec is the "no interview, just synthesis"
  precedent.
- 2026-10 P6 (user-approved artifact-layout round): prd retired, upstream-
  aligned (mattp merged to-prd into to-spec long ago) — its duties absorbed
  here: Out of Scope returns, user-story coverage folds into Acceptance as a
  journey list, requirement triggers migrate into this skill's description.
  Template slimmed to decision-only: Tech Stack / Commands / Project
  Structure / Code Style / Testing Strategy dropped — repo-level facts live
  once in docs/CONSTRAINTS.md and AGENTS.md, and the model reads the real repo,
  which never goes stale the way a spec snapshot does. Boundaries narrowed to
  this-feature Ask First triggers. Landing is single and slug-mandatory:
  .dev/spec/<slug>.md as per-developer process memory, gitignored — parallel
  features never collide over one root SPEC.md.
-->

# Spec

The spec is the shared source of truth between you and the human: what is
being built, why, and how we will know it is done. Code without a spec is
guessing.

## What a spec owns: decisions, not blueprints

Pin what only the human can decide: why the work exists, what done means,
which decisions are already made, what must come back for sign-off. Leave
design to the build — which files exist, what style, which commands: the
model discovers those from the real repo, and a frozen snapshot inside a
spec goes stale where the repo does not. One test per candidate line:
**a decision already made → pin it; design still to be done → leave it.**

## Input ladder

Where the content comes from, in order:

1. **align's labeled candidates exist in this conversation**: harvest them
   verbatim into the spec's Acceptance criteria.
2. **Neither**: synthesize from the conversation and codebase as they stand
   (no interview), surface your assumptions (Phase 2), and let the approval
   gate catch the gaps.

## Scope test: one module or a capability map

Default to a single spec. Recurse only when the requirement names distinct
capabilities with their own consumers or data (identity, billing,
notifications), when acceptance criteria cluster into separately shippable
groups, or when one capability could be cut without rewriting the others.

**Propose a capability map before writing any module spec** — a module table
plus a build order, reviewed like every gate:

```markdown
# Capability Map: [Initiative]

| Module id | Responsibility | Depends on |
|---|---|---|
| identity | Accounts, sessions, SSO | — |
| billing | Plans, invoices, payments | identity |

Build order: identity → billing
```

- Stable kebab-case ids, chosen once. Specs, slices, and builds select work
  by these ids.
- Dependency arrows point one way; a cycle means one module.
- The map, not filename guessing, is the index: a multi-module initiative
  lands inside that initiative's feature dir `.dev/<initiative>/` — `map.md`
  plus one `SPEC-<id>.md` per module alongside it.

## Phase 2: Write the spec

**Surface assumptions first**, before any content:

```
ASSUMPTIONS I'M MAKING:
1. This is a web application (not native mobile)
2. The database is PostgreSQL (from the existing Prisma schema)
→ Correct me now or I'll proceed with these.
```

**Template** (write to `.dev/<slug>/spec.md` inside the feature's own
feature-first directory — slug mandatory; this is the only landing
implement-all looks in. Create `.dev/<slug>/` if absent and make sure `/.dev/`
is gitignored: the spec is per-developer process memory, not shared repo
content):

```markdown
# Spec: [slug]

## Objective
[What we're building and why. Who is the user. What success looks like —
one breath, user language.]

## Implementation Decisions
[Decisions already made, one line each: modules and test seams chosen (with
a note on what a test there catches and misses), stack changes (a new
dependency is also an Ask First trigger), schema/API contracts, interaction
decisions, prototype-sourced decision snippets trimmed to the decision-rich
parts (note they came from a prototype). No file paths as promises, no
working code. A "when in doubt" item is not a decision — it is an Open
Question.]

## Out of Scope
[What this work deliberately does not do.]

## Acceptance Criteria
[The contract. Three-label convention, mandatory; list the user journeys the
Objective names — every journey carries at least one criterion.]

- [check: <command>] — verified by running the command
- [evidence: <procedure>] — verified by capturing the named artifact
- [judgment: <who and why>] — only the named human can decide

An unlabeled criterion goes back to the ladder: give it a procedure, or
admit judgment.

## Ask First
[This feature's escalation triggers: decisions that must come back to the
human mid-build — schema changes, new dependencies, config or architecture
calls. Repo-wide always/never rules do not live here; they live once in
docs/CONSTRAINTS.md and AGENTS.md, not restated per spec.]

## Open Questions + Assumptions
[Anything unresolved that needs human input; the assumptions this spec is
built on.]
```

**Reframe vagueness as criteria.** "Make the dashboard faster" becomes "LCP
< 2.5s on 4G; initial load < 500ms; CLS < 0.1" — then the approval gate has
something to approve.

**External spec tools.** If the repo already uses OpenSpec or another spec
system, keep its artifact format and storage; this skill owns the
clarification, content, and approval gates, not the file format.

## Phase 3: Approval gate — stop here

1. Summarize the spec, list Open Questions and assumptions.
2. Ask the human to approve or amend.
3. **Stop your turn.** No slicing, no code, this turn.

After approval, this stack takes over (this skill hands off, it does not
plan or build):

- `tasks` — slices the spec into vertical tracer-bullet tickets (task
  breakdown is **tasks'** canonical authority; if this spec ever disagrees
  with the ticket graph, the graph wins and the spec gets updated).
- `implement` (one ticket) / `implement-all` (whole graph: auto serial
  single-approval, or parallel multi-agent) — execution.
- `code-review` — the Standards-vs-Spec axis reads this spec back.

## Keeping the spec alive

The spec is a living contract. When a discovery changes the data model or a
decision, update the spec first, then the code — a divergence between spec
and implementation is a finding, not a fact. It stays per-developer process
memory: the durable, shared record of why is the merged code, the commits,
and ADRs under docs/adr/; the local `.dev/<slug>/` directory — spec, plan,
todo, tickets, all in one place — is what lets its owner pick a half-done
feature back up.
