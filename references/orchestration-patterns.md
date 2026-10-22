# Orchestration Patterns

Reference catalog of agent orchestration patterns this repo endorses, plus anti-patterns to avoid. Read this before adding a new slash command that coordinates multiple personas, or before introducing a new persona that "wraps" existing ones.

Host mapping: the "Pi mapping" section at the end holds this package's primitives; when any text elsewhere names another host's conventions, `references/pi-host.md` is the single translation authority.

The governing rule: **the user (or a slash command) is the orchestrator. Personas do not invoke other personas.** Skills are mandatory hops inside a persona's workflow.

---

## Endorsed patterns

### 1. Direct invocation (no orchestration)

Single persona, single perspective, single artifact. The default and the cheapest option.

```
user → code-reviewer → report → user
```

**Use when:** the work is one perspective on one artifact and you can describe it in one sentence.

**Examples:**
- "Review this PR" → `code-reviewer`
- "Find security issues in `auth.ts`" → `security-auditor`
- "What tests are missing for the checkout flow?" → a test-discipline pass (implement skill)

**Cost:** one round trip. The baseline you should always compare orchestrated patterns against.

---

### 2. Single-persona slash command

A slash command that wraps one persona with the project's skills. Saves the user from re-explaining the workflow every time.

```
/review → code-reviewer (with code-review-and-quality skill) → report
```

**Use when:** the same single-persona invocation happens repeatedly with the same setup.

**Examples in this repo:** `/review`, `/test`, `/code-simplify`.

**Cost:** same as direct invocation. The slash command is just a saved prompt.

**Anti-signal:** if the slash command's body is mostly "decide which persona to call," delete it and let the user call the persona directly.

---

### 3. Parallel fan-out with merge

Multiple personas operate on the same input concurrently, each producing an independent report. A merge step (in the main agent's context) synthesizes them into a single decision.

```
                    ┌─→ code-reviewer    ─┐
/ship → fan out  ───┼─→ security-auditor ─┤→ merge → go/no-go + rollback
                    └─→ (test discipline)─┘
```

**Use when:**
- The sub-tasks are genuinely independent (no shared mutable state, no ordering dependency)
- Each sub-agent benefits from its own context window
- The merge step is small enough to stay in the main context
- Wall-clock latency matters

**Examples in this repo:** `/ship`.

**Cost:** N parallel sub-agent contexts + one merge turn. Higher than direct invocation, but faster wall-clock and produces better reports because each sub-agent stays focused on its single perspective.

**Validation checklist before adopting this pattern:**
- [ ] Can I run all sub-agents at the same time without ordering issues?
- [ ] Does each persona produce a different *kind* of finding, not just the same finding from a different angle?
- [ ] Will the merge step fit in the main agent's remaining context?
- [ ] Is the user's wait time long enough that parallelism is actually noticeable?

If any answer is "no," fall back to direct invocation or a single-persona command.

---

### 4. Sequential pipeline as user-driven slash commands

The user runs slash commands in a defined order, carrying context (or commit history) between them. There is no orchestrator agent — the user IS the orchestrator.

```
user runs:  /spec  →  /plan  →  /build  →  /test  →  /review  →  /ship
```

**Use when:** the workflow has dependencies (each step needs the previous step's output) and human judgment between steps adds value.

**Examples in this repo:** the entire DEFINE → PLAN → BUILD → VERIFY → REVIEW → SHIP lifecycle.

**Cost:** one sub-agent context per step. Free for the orchestration layer because there is no orchestrator agent.

**Why not automate it:** an LLM "lifecycle orchestrator" would (a) lose nuance between steps because it has to summarize for hand-off, (b) skip the human checkpoints that catch wrong-direction work early, and (c) double the token cost via paraphrasing turns.

---

### 5. Research isolation (context preservation)

When a task requires reading large amounts of material that shouldn't pollute the main context, spawn a research sub-agent that returns only a digest.

```
main agent → research sub-agent (reads 50 files) → digest → main agent continues
```

**Use when:**
- The main session needs to stay focused on a downstream task
- The investigation result is much smaller than the input it consumes
- The decision quality benefits from the main agent having room to think after

**Examples:** "Find every call site of this deprecated API across the monorepo," "Summarize what these 30 ADRs say about caching."

**Cost:** one isolated sub-agent context. Worth it any time the alternative is loading hundreds of files into the main context.

On pi, spawn `general-purpose` with `readonly: true` and the research brief (the `research` skill's own dispatch shape) rather than defining a custom research persona; write/edit are simply not in the spawn. Define a custom persona only when the brief needs a domain system prompt the model wouldn't infer (this package's agents/).

---

## Pi mapping (host conventions)

This catalog is harness-agnostic; the primitive it runs on here is this package's own extension (host conventions live in `references/pi-host.md`):

- **Personas live in `agents/` at the package root** and register as `pi-dev:<file>` agent types the `agent` tool spawns (`pi-dev:code-reviewer`, `pi-dev:security-auditor`, `pi-dev:image-reader`). The test-discipline pass was folded into the implement skill's test discipline; no path configuration exists or is needed.
- **Parallel fan-out (Pattern 3) is ONE `agent` call carrying `tasks: [...]`** (2-8 single-agent tasks; foreground returns an aggregate table, background settles silently and one notice wakes the session). Sequential one-by-one calls work but serialize execution — orchestrator commands should call out the batch shape explicitly.
- **Subagents cannot spawn their own subagents**: the extension passes `--pi-dev-depth` down and caps it, so anti-pattern B (persona-calls-persona) and D (deep persona trees) are blocked by construction.
- **No teammates primitive**: agents that must challenge each other's findings run through the doubt skill's reconcile loop or the review pipeline's lens aggregation — coordination stays in the parent session, which is the governing rule above.
- **Persona frontmatter honored here**: `name`, `description` (trigger surface), `model`, `effort`. Spend/permission shaping belongs to the spawn call (`readonly: true`, `isolation: "worktree"`, per-run `model`), not the persona file.

---
## Worked example: competing-hypothesis debugging (the reconcile loop)

This example shows when to reach for the **reconcile loop** (batched lenses + adversarial reconciliation in the parent session) instead of a plain subagent fan-out. The two patterns look similar from a distance — both spawn the same lenses — but the value comes from a different place.

### The scenario

> *Checkout occasionally hangs for ~30 seconds before completing. It happens roughly once every 50 sessions. No errors in logs. Started after last week's release.*

Plausible root causes (mutually exclusive, all fit the symptoms):

1. A race condition in the new payment-confirmation flow
2. An auth check that occasionally falls through to a slow synchronous network call
3. A missing index on a query that scales with cart size
4. A flaky third-party API where the SDK retries silently before timing out

A single agent will pick the first plausible theory and stop investigating. A plain subagent fan-out would have each lens report independently — but their reports never meet, so nothing rules out the wrong theories.

This is the case the reconcile loop exists for: multiple independent investigators actively trying to disprove each other, so the theory that survives is much more likely to be the actual root cause.

### Why this is *not* a `review` job

| | two-axis `code-review` | reconcile loop |
|--|--------------------|-------------|
| Lenses see | The same diff, different axes | The same mystery, disproof-biased briefs |
| Output | Two reports → one aggregated verdict | Adversarial reconciliation → consensus root cause |
| Right when | You want a verdict on a known artifact | You want to *find* the artifact among hypotheses |

`review` is a verdict; the reconcile loop is an investigation.

### Setup

None: the doubt skill's reconcile loop over one batched `agent` call is the whole machinery — no experimental flags, no team config.

### The trigger prompt

Type into the lead session, in natural language:

```
Users report checkout hangs for ~30 seconds intermittently after last
week's release. No errors in logs.

Debug this with competing hypotheses. Make one batched `agent` call
(`tasks: [...]`), three readonly lenses:

  - code-reviewer  — investigate race conditions and blocking calls
                     in the checkout code path
  - security-auditor — investigate auth checks, session handling,
                       and any synchronous network calls added recently
  - test-discipline pass — propose tests that would distinguish between the
                     hypotheses and check coverage gaps in checkout

Then run the doubt skill's reconcile loop over the three reports:
converge only when two lenses agree they can disprove the others'.
```

The lead makes one batched `agent` call (foreground: one aggregate table); each child runs readonly in its own context with its lens brief, and writes its report into the run artifact the lead collects.

### What happens

1. Each lens runs in its own context window, exploring the codebase from its own view.
2. Reports land in the parent session, which is where challenge-between-lenses lives: the reconcile loop posts each report against the others and demands disproof-shaped responses.
3. When the code-review lens finds a `Promise.all` that should be sequential, the reconcile loop puts that to the security lens — confirm the auth call isn't part of the race, or produce counter-evidence.
4. The test-discipline lens proposes a focused integration test for whichever theory is winning; the loop uses it to verify before declaring consensus.
5. The lead synthesizes the converged finding and presents it to you.

You can steer any still-running lens by its agentId with `send_message` — useful for redirecting an investigator who's gone down a wrong path; a finished one resumes with its context when you message it.

### When to clean up

The batch settles on its own: one aggregate table (foreground) or one notice (background). Nothing to clean up beyond the worktrees an `isolation: "worktree"` task created, which settle as their runs end.

### Cost expectation

Three readonly lenses running for ~10–15 minutes of investigation cost noticeably more than a single-lens pass. The justification is *quality of conclusion* — for production debugging where the wrong fix is expensive, the extra tokens are a bargain. For a routine PR review, stick with the two-axis `code-review` pass.

### Anti-pattern in this scenario

Do **not** rebuild this as a `/debug` slash command that just fans out agents and copies their reports into the transcript verbatim. The value is the reconcile loop — subagent reports that never meet adversarial review are three unverified opinions. If the workflow keeps coming up, document the trigger prompt above as a snippet and keep the reconcile loop as the skill-blessed middle.

### When *not* to use the reconcile loop

- Production-bound verdict on a known diff → use `review` (five lenses + one aggregated verdict, design axis included).
- One specialist perspective on one artifact → direct persona invocation.
- Sequential lifecycle (spec → plan → build) → user-driven lifecycle commands (Pattern 4).
- Read-heavy research with a small digest → a single readonly background `agent` run.

Reach for the reconcile loop only when the lenses **need** to challenge each other to produce the right answer.

Reach for the reconcile loop only when the lenses **need** to challenge each other to produce the right answer.

---

## Anti-patterns

### A. Router persona ("meta-orchestrator")

A persona whose job is to decide which other persona to call.

```
/work → router-persona → "this needs a review" → code-reviewer → router (paraphrases) → user
```

**Why it fails:**
- Pure routing layer with no domain value
- Adds two paraphrasing hops → information loss + roughly 2× token cost
- The user already knew they wanted a review; they could have called `/review` directly
- Replicates the work that slash commands and intent mapping in `AGENTS.md` already do

**What to do instead:** add or refine slash commands. Document intent → command mapping in `AGENTS.md`.

---

### B. Persona that calls another persona

A `code-reviewer` that internally invokes `security-auditor` when it sees auth code.

**Why it fails:**
- Personas were designed to produce a single perspective; chaining them defeats that
- The summary the calling persona passes loses context the called persona needs
- Failure modes multiply (which persona's output format wins? whose rules apply?)
- Hides cost from the user

**What to do instead:** have the calling persona *recommend* a follow-up audit in its report. The user or a slash command runs the second pass.

---

### C. Sequential orchestrator that paraphrases

An agent that calls `/spec`, then `/plan`, then `/build`, etc. on the user's behalf.

**Why it fails:**
- Loses the human checkpoints that catch wrong-direction work
- Each hand-off summarizes context — accumulated drift over a long pipeline
- Doubles token cost: orchestrator turn + sub-agent turn for every step
- Removes user agency at exactly the points where judgment matters most

**What to do instead:** keep the user as the orchestrator. Document the recommended sequence in `README.md` and let users invoke it.

---

### D. Deep persona trees

`/ship` calls a `pre-ship-coordinator` that calls a `quality-coordinator` that calls `code-reviewer`.

**Why it fails:**
- Each layer adds latency and tokens with no decision value
- Debugging becomes a multi-level investigation
- The leaf personas lose context to multiple summarization steps

**What to do instead:** keep the orchestration depth at most 1 (slash command → personas). The merge happens in the main agent.

---

## Decision flow

When considering a new orchestrated workflow, walk this flow:

```
Is the work one perspective on one artifact?
├── Yes → Direct invocation. Stop.
└── No  → Will the same composition repeat?
         ├── No  → Direct invocation, ad hoc. Stop.
         └── Yes → Are sub-tasks independent?
                  ├── No  → Sequential slash commands run by user (Pattern 4).
                  └── Yes → Parallel fan-out with merge (Pattern 3).
                           Validate against the checklist above.
                           If any check fails → fall back to single-persona command (Pattern 2).
```

---

## When to add a new pattern to this catalog

Add a new entry only after:

1. You've used the pattern at least twice in real work
2. You can name a concrete artifact in this repo that demonstrates it
3. You can explain why an existing pattern wouldn't have worked
4. You can describe its anti-pattern shadow (what people will mistakenly build instead)

Premature catalog entries become aspirational documentation that no one follows.
