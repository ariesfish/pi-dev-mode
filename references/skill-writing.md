# Skill writing — the one-page bar

Source: mattp's `writing-for-agents` (external). That document has the long form; this is the review checklist for a skill diff in this package, applied by `retro` before drafting and by `eval` before framing a variant.

## The pointer (description)

- Every description rides on every turn. Count the words; ask what the last sentence buys.
- Two jobs: say what the material is, and list the branches that should reach it. Cut identity the body already carries.
- One trigger per branch. Four spellings of one utterance are one branch written four times.
- A lane boundary lives in one place, never mirrored across a pair. A "not my lane" line is earned only where a stays-quiet case covers that pair.
- Positive phrasing first: state the target behavior. A prohibition drags the forbidden behavior into context.
- No-op test: delete the sentence. If routing still works, it bought nothing.

## The body

- Hierarchy: steps, then in-file reference, then disclosed reference. Inline what every branch needs; push behind a pointer what only some branches reach.
- Branching is the disclosure test, not length. AUTO and PARALLEL are branches; a template the agent copies verbatim is not.
- Completion criterion: can the agent tell done from not-done, and does the wording demand the work? "Precise enough to act" is not a bound.
- Premature completion: when later steps are visible and the criterion has no resistance, the agent rushes. Sharpen the criterion first; hide later steps only across a real context boundary (a reference file, a subagent, a hand-off).
- A prohibition cannot fix an output shape. Use a template with slots, or move the later step out of view.
- One meaning, one home. When a second skill needs it, point at the first. A clause repeated across skills is a second maintenance point, and `check-skills.py` fails at 14 normalized words.
- The environment is a source of truth too: do not cache a cheap lookup (a list of descriptions, a command already in `package.json`).
- Leading words: reuse a pretrained concept (frontier, seam, fog, tracer bullet) instead of restating a triad. Coin one only when no existing word fits.

## The change

| Edit | Gate |
|---|---|
| description / trigger | `eval` Mode A (fires + adjacent stays-quiet) |
| protocol / structure / pruning | `eval` Mode B; for a no-op claim, Mode C (equivalence) |
| rejected | one row in `evals/skill-impact.md` |

Cost is part of the verdict: record the description words of the tree under test and the body words of skills actually opened. A change that fires correctly but raises always-loaded words is not a free win.

## Five questions before shipping a skill diff

1. What does this cost per turn?
2. Which branch reaches this paragraph, and where else could it live?
3. What tells the agent the step is done, and can that be checked?
4. Is this restating something another file already owns?
5. If this sentence were deleted, what would change? Nothing → delete it.
