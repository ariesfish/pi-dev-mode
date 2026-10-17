---
name: eval
description: >-
  The promotion gate for skill changes: run controlled, blinded experiments
  before a skill, description, or trigger edit goes live. Two modes — trigger
  regression (rerun the fires/stays-quiet case bank against the edited tree)
  and variant A/B (baseline vs candidate on one task, judge sees anonymized
  outputs only). Use after retro proposes a skill change, before applying it,
  or when a skill's triggering misbehaves in practice. Chinese triggers:
  评一下技能改动, 技能评估, 盲评, 这个改动值得上吗, 触发回归,
  上线前评测, eval.
---

<!-- pi-dev-mode changelog:
- 2026-10 P2.5: new, synthesizing pstack's Eval playbook (blinding discipline,
  transcript-verified chains, promote/reject synthesis) with addyosmani's
  evals harness (fires/stays-quiet case bank, graders, skill-impact ledger).
  Pi-native: candidates run as headless `pi -p` with --skill <tree> only;
  judges attach transcripts via @file; transcripts live under --session-dir.
- 2026-10 P2.6.1: dialogue-kind candidates run --tools read (unbounded full-tool candidates dig instead of answering).
- 2026-10 P2.7 (D, retro A-F round): fixture mechanism — execution-kind cases run full-tool in a fixture copy with a timeout; dialogue cases may declare a fixture copied into the scratch cwd (contents-in-cwd: the candidate's cwd IS the project root; a fixture landing as a subdir reads as an empty cwd — observed in the first dogfood run). check-skills.py validates fixture wiring.
-->

# Eval

A skill change is a hypothesis. This skill runs the experiment before the
change ships, so the cheap failure happens here instead of in every future
session. It is the gate `retro` hands its substantive skill edits to.

## Blinding discipline (non-negotiable, both modes)

- No `eval` / `test` / `judge` / `experiment` / `rubric` / `score` / `compare`
  words in anything a candidate can see: the prompt, the working directory
  names, the skill-tree copy path. Use project-shaped names a user might pick.
- The candidate prompt looks like an organic user request: state the goal,
  never the meta. Never mention that other candidates exist.
- The judge may know it is judging, but sees outputs by sanitized label only —
  never which tree, model, or arm an output came from.
- Grade chain-following from **what the transcript shows was actually opened**
  and the shape of the reply — never from a candidate's self-report.

## Case bank

Cases live under `evals/<skill>/<case>/`: a `prompt.md` (frontmatter:
`description`, `kind: dialogue | execution`, `target`, `expected_outcome`;
body: the organic prompt) plus one or more `graders/*.md` (a PASS/FAIL rule
each). See `evals/README.md` for the format and how to add cases.

## Mode A — trigger regression (for description/trigger edits)

The cheap gate: the edited tree must still fire the skill where it should and
stay quiet where it must not.

1. Pick the cases: every case under `evals/<skill-under-test>/`, plus the
   stays-quiet cases of sibling skills most likely to be stolen from.
2. For each case, run one candidate in a scratch working directory:
   ```bash
   cd $(mktemp -d)
   # dialogue 档(触发判别):限 read 工具;case 声明了 fixture 就把它的
   # 内容拷进 cwd(候选的 cwd 即项目根,顶层直接可见 package.json 等)。
   cp -r <repo>/evals/fixtures/<name>/. .   # 仅当 prompt.md 声明了 fixture
   pi -p --session-dir "$PWD/session" --no-extensions --no-skills \
     --tools read --skill <repo>/skills "$(cat <case>/prompt.md 的正文)"
   # execution 档(行为判别):全量工具,以 fixture 内容为 cwd(必需 fixture),
   # 限时(900s 观察够用);路由行为类保留扩展(-e <repo>/pi/index.ts),
   # mandate/repo-state 是产品的一部分。
   cp -r <repo>/evals/fixtures/<name>/. "$PWD/workspace"
   cd "$PWD/workspace"
   timeout 900 pi -p --session-dir "$OLDPWD/session" [--no-extensions] \
     --no-skills --skill <repo>/skills "$(cat <case>/prompt.md 的正文)"
   ```
   Dialogue-kind cases run `--tools read`: the candidate can open skill files
   (the chain evidence) but cannot wander the filesystem or start executing —
   the run stays bounded. Validation record: full-tool dialogue candidates
   dig the repo for minutes and never reach a reply (observed 2026-10-16,
   >7 min, killed) — that is why execution-kind cases get a fixture cwd and
   a timeout instead of unbounded access.
   `--no-extensions` keeps the mandate and repo-state notes out of the
   candidate's system prompt (they would hint the chain); `--no-skills`
   disables the user's global skills so the tree under test is all the
   candidate sees; the transcript lands under `$PWD/session`.
3. Grade: attach the transcript and reply to a judge as a fresh readonly run
   (`pi -p --no-skills --no-extensions "…grading rule… @<transcript> @<reply>"`),
   one grader rule per finding. Or grade against the rule yourself when the
   rule is mechanical.
4. Verdict: **any FAIL in a fires case** = the edit broke triggering; **any
   FAIL in a stays-quiet case** = the edit now steals a sibling's trigger.
   Fix the description and rerun. A change that cannot pass without weakening
   a case is rejected into `evals/skill-impact.md` (append one row: date,
   skill, attempted change, outcome) — the ledger keeps the next retro from
   re-proposing it blind.

## Mode B — variant A/B (for behavior/protocol edits)

The promotion experiment: does the candidate change outcomes, and is that
better?

1. **Frame.** One sentence: what variant is under test, what observable
   behavior counts as success. Write a 3–6 criterion rubric **for the judge
   only**. Hold it back from candidates.
2. **Set up sanitized arms.** Copy the baseline tree and the variant tree into
   scratch dirs with project-shaped names. Same task material in each.
3. **Author one organic prompt** from the task — no leakage of what differs
   between arms.
4. **Run N candidate sessions per arm** with Mode A's invocation shape (the
   arm's tree, its own session dir). Same prompt across every run.
5. **Judge blind.** One judge run, fed all outputs as anonymized pairs
   (`Apple / Banana`, never `base`/`variant`), the rubric, and the instruction
   to score both on one scale in a single pass. Attach transcripts via
   `@file`; the judge verifies from the files each candidate actually opened.
6. **Verify with your own eyes.** Read every candidate output end to end.
   Judge-vs-you disagreement means either a biased judge or an ambiguous
   rubric — resolve it, don't average it.

## Reply

Variant under test, rubric, per-candidate notes (transcript evidence, not
self-report), judge's verdict, your synthesis, and a recommendation: promote,
revise, or reject-with-ledger-row. Never promote on judge verdict alone when
your own reading disagrees.
