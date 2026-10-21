---
name: doubt
description: >-
  Subject every non-trivial decision to a fresh-context adversarial review
  before it stands: extract the artifact and contract, spawn a
  disprove-biased reviewer with no access to your reasoning, reconcile
  findings, loop bounded. Use before committing non-trivial code, before
  high-stakes or irreversible steps (auth, migrations, public APIs, deploys),
  or whenever a confident output is cheaper to verify now than debug later.
  Chinese triggers: 拷问, 我不放心, 对抗审查, 找茬, 挑战这个决策.
---

# Doubt

A confident answer is not a correct one. Long sessions accumulate context that
quietly turns assumptions into "facts". This skill materializes a fresh-context
reviewer — biased to **disprove**, not approve — before any non-trivial output
stands. This is not `review` (a verdict on a finished diff); it is an in-flight
posture while course-correction is still cheap.

## When it applies

A decision is non-trivial when at least one holds:

- introduces or modifies branching logic
- crosses a module or service boundary
- asserts a property the type system cannot verify (thread safety, idempotence, ordering, invariants)
- its correctness depends on context a future reader cannot see
- its blast radius is irreversible (deploy, data migration, public API change)

Apply before committing non-trivial code, before high-stakes steps, before
claiming a non-obvious fact. Skip mechanical operations, unambiguous
instructions, reads/summaries, one-liners with obvious correctness, and
anything the user explicitly marked speed-over-verification. Doubting every
keystroke ships nothing.

## The cycle

```
Doubt cycle:
- [ ] 1. CLAIM — the claim + why it matters, in two or three lines
- [ ] 2. EXTRACT — artifact + contract, reasoning stripped
- [ ] 3. DOUBT — fresh-context reviewer, adversarial prompt only
- [ ] 4. RECONCILE — classify every finding against the artifact
- [ ] 5. STOP — trivial findings only, or 3 cycles, or the user says ship it
```

### 1. CLAIM

```
CLAIM: "The new caching layer is safe under the read-heavy workload."
WHY THIS MATTERS: a race here corrupts data and QA won't catch it.
```

If you cannot write it that compactly, you have a vibe, not a decision.

### 2. EXTRACT

The reviewer needs the **artifact** and the **contract**, not the journey:

- Code: the diff or the function, not the whole file
- Decision: the proposal in 3–5 sentences plus its constraints
- Assertion: the claim plus its supporting evidence

Strip your reasoning — hand over conclusions and you get back validation of
your conclusions. Decompose anything a reviewer cannot hold in one read.

### 3. DOUBT — the reviewer

Launch a readonly background agent with the `agent` tool. The prompt **must be adversarial**:

```
Adversarial review. Find what is wrong with this artifact.
Assume the author is overconfident. Look for:
- Unstated assumptions
- Edge cases not handled
- Hidden coupling or shared state
- Ways the contract could be violated
- Existing conventions this might break
- Failure modes under unexpected input

Do NOT validate. Do NOT summarize. Find issues, or state explicitly that you
cannot find any after thorough examination.

ARTIFACT: <paste artifact>
CONTRACT: <paste contract>
```

**Pass ARTIFACT + CONTRACT only. Never the CLAIM** — your conclusion biases
the reviewer toward agreement. Point numeric claims at the benchmark
checklist's questions instead of freeform review.

**Cross-model, always offered, interactively.** One review model shares blind
spots with the author; a different family catches them. After the first
review returns (before RECONCILE), ask the user exactly once: continue with
these findings, or add a second reviewer on a different model family? The
user — not you — decides whether the cost is worth it. In non-interactive
contexts (print mode, child agents), skip and announce the skip; never route
around the user's choice.

**Nested context.** This cycle belongs to the main session. Inside a child
agent (depth-limited), say so and degrade honestly: rewrite ARTIFACT +
CONTRACT as a fresh self-prompt, walk the steps, and **flag the result as
degraded** — you carry your own context with you, which is exactly what this
skill exists to avoid.

### 4. RECONCILE

The reviewer's output is data, not verdict. **You remain the orchestrator.**
Re-read the artifact against each finding, classify in precedence order:

1. **Contract misread** — the CONTRACT you passed was unclear. Fix the contract first, re-loop.
2. **Valid + actionable** — change the artifact, re-loop.
3. **Valid trade-off** — document it explicitly so the user sees it.
4. **Noise** — correct under context the reviewer lacked. Note it, and ask whether the contract should carry that context next time.

A fresh reviewer can be wrong. Do not defer just because it is fresh.

### 5. STOP

Stop on trivial-only findings, or 3 completed cycles, or an explicit
"ship it". Three unresolved cycles is information about the artifact — surface
it to the user instead of grinding a fourth. If the bound feels obviously
insufficient, the artifact is too big: return to step 2 and decompose. Do not
lift the bound.

## Rationalizations, answered

| "I'm confident, skip it" | Confidence correlates poorly with correctness on novel problems; certainty is where blind spots hide. |
|---|---|
| "A reviewer is expensive" | Debugging a wrong commit is more expensive; the check is bounded, the bug isn't. |
| "It'll just nitpick" | Only if unscoped — constrain to "issues that would break the contract". |
| "I'll do doubt at the end with `review`" | `review` is a final gate; doubt catches wrong directions while they are cheap to change. |
