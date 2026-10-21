---
name: review
description: >-
  The merge/ship gate: assemble four lenses over a diff — two-axis
  code-review (Standards + Spec), comment discipline, adversarial doubt, and
  a constraints audit — as parallel readonly reviewers, then aggregate into
  one deduplicated verdict with severity labels. Use before merging a branch
  or PR, before shipping, or when the user says review this / 审查这个分支 /
  把关. For a quick two-axis look at a diff without the gate ceremony, the
  `code-review` skill standalone is that lane. Chinese triggers: 合并前把关, 发布前审查, 评审管线.
---

# Review

A merge gate, not an in-flight posture (that is `doubt`). Four lenses over one
diff, each in a fresh-context reviewer so lenses don't pollute each other, then
one aggregation.

## Input

Pin the fixed point exactly as `code-review` does — a commit/branch/tag /
`HEAD~n`, defaulted from the current branch's merge-base if the user only says
"review this branch". Confirm it resolves and the diff is non-empty **before**
spawning anything.

## The four lenses (parallel readonly reviewers)

Spawn all four with this package's `agent` tool — one call carrying four readonly `tasks` (one per lens, keyed standards/spec/doubt/constraints), pi-dev's own and **not** another package's `Agent` (its reports land outside this session and are lost) — with the diff
command + commit list, skill pointers instead of pasted payloads where a
pointer reaches:

### Lens 1 — Standards & Spec (the two-axis review)

Point the reviewer at this package's `skills/code-review/SKILL.md` and have it
run that protocol verbatim on the diff (spec-source discovery, standards-file
search, the Fowler smell baseline, two separate reports). No spec found → the
Spec axis reports "no spec available" and says so.

### Lens 2 — Comment discipline

Brief, inlined verbatim into the reviewer prompt:

```
Strip and tighten comments in this diff. A comment may stay only for a
non-obvious WHY the code cannot express. Delete on sight:
- what-comments and restatements of the code
- phase-narrating comments ("// Step 2: add X") — the assertion or symbol
  name documents the step
- TODO/FIXME without an owner or ticket
- commented-out code
Review the tests/verify scripts too. A constraint a comment claims (TODO
refactor, must not X) becomes a finding: propose the check or type that
enforces it instead. Report each as file:line + the offending text + the
action (delete / rewrite as WHY / encode as check).
```

### Lens 3 — Adversarial doubt

```
Adversarial review. Find what is WRONG with this diff. Assume the author is
overconfident. Look for: unstated assumptions, unhandled edge cases, hidden
coupling or shared state, ways the change breaks under unexpected input,
conventions it violates, failure modes in the error paths themselves. Do NOT
validate. Do NOT summarize. Find issues, or state explicitly that you cannot
find any. Under 400 words.
```

### Lens 4 — Constraints audit

Read `docs/CONSTRAINTS.md` (absent → report "no constraints contract;
propose the constraints skill" and audit only the universal floor: new
suppression comments, skipped/deleted tests, unexplained stubs, secrets).
Audit the diff against it: weakened thresholds, removed checks, new
suppressions without an Exceptions row — each finding cites the exact
docs/CONSTRAINTS.md line it violates.

## Aggregate

1. Present each lens's report under its own heading, lightly cleaned. **Do
   not merge before showing** — lens separation is load-bearing (a change can
   pass Standards and fail Spec; averaging them hides it).
2. Then the cross-lens rollup: deduplicate identical findings, **weight
   overlapped findings** (two independent lenses hitting one spot is the
   highest signal), keep severity labels from the owning lens
   (Critical / Required / Optional / Nit; lens 4 adds its floor violations as
   Critical).
3. Verdict exactly one of:
   - **APPROVE** — no Critical/Required findings
   - **REQUEST CHANGES** — one or more Critical/Required, each with the lens
     and file:line
   - **INCONCLUSIVE** — a lens errored or was refused its inputs; name the gap.
     An inconclusive review is not an approve.
4. End with: total findings per lens, the top finding overall, and what
   evidence would close it.

## Independent verifier (high-stakes merges, or on request)

For high-stakes merges (auth, migration, public API, data loss) — and whenever
the user asks for an independent verdict or a second judge — spawn one more
reader **after** the four lens reports: a fresh readonly `agent` on a
**different model** than this session (single-provider setups use the other
tier — e.g. deepseek-flash under a v4-pro session; a multimodal verifier can
view drive screenshots as evidence). It sees **the diff and the evidence
pointers, never the lens outputs** — independence is the point. It adjudicates
on its own reading — Critical/Required findings of its own — and **writes its
verdict file itself** to `.dev/audit/evidence/review-<slug>/verdict.json`:
`{verdict: PASS|FAIL, blockers: [file:line + reason], checked: [what it
covered], evidence: [paths]}`. Present its PASS/FAIL beside the aggregated
verdict: a verifier FAIL — or disagreement with the lenses — reads as
INCONCLUSIVE, named as such, with what would close it.

Ledger (when the target repo carries `.dev/lifecycle/`): after the verdict
file lands, record it with `gates/gate.sh verdict <id> --from
<verdict.json> --note "<one line>"` (A-class gate, sha256 + verdict
recorded). A landing that follows the verdict records its read-back as a
D-class land gate: a merge command can report success while a merge queue
only queued the PR — so history records a command that reads the landed
state back (`gh pr view <n> --json state,mergedAt,baseRefName`, or the git
equivalent, e.g. `git branch --contains <sha> | grep -q <trunk>` after
fetch) via `gates/gate.sh run <id> land -- <read-back cmd>`, and only its
exit 0 closes the item. Exit 4 (BLOCKED) stops for a human `resume`.
Without it: unchanged — the verdict file itself is still mandatory.

## Composition notes

- Reviewers are readonly agents of one `agent` call carrying `tasks` (four
  readonly tasks, one per lens, run_in_background together): the aggregate
  notice returns every lens report at once. Fresh context is the point — never
  review your own implementation through lens 3 in-session; that's what the
  spawn is for.
- High-stakes merges (auth, migration, public API): say so up front and offer
  `doubt`'s cross-model option for lens 3 — a second adversarial reviewer on
  a different model family.
- This gate does not run the change; behavior verification belongs to the
  build/test stage and, later, the verification machinery. A verdict is about
  the diff's contents, never about "it must work".
- A diff that changes rendering (styles, layout, screenshots): the text lenses
  review the code; visual parity is the `pi-dev:image-reader` agent's lane (multimodal)
  against the reference image. A visual verdict from a text-only lens is
  INCONCLUSIVE — say so instead of approving blind.
