---
name: retro
description: >-
  Conduct a retrospective over a finished session: read its transcript, find
  improvement candidates, then route each to the highest level that enforces it
  (architecture > types/lint > tests > docs/skill edits) and propose concrete
  changes. Use at the end of a session, before handoff, or when the user asks
  what to improve. Chinese triggers: 复盘, 总结这轮, 沉淀经验.
---

# Retro

The user asked for a retrospective. You are proposing improvements to the
agent's **environment** — the repo, the checks, the steering files, and this
stack's own skills — so the next run goes better. One-off events are not
findings; a class counts once it has happened twice.

## Steps

1. **Locate the session's primary sources.** The user names a session, or
   default to the current one. Pi sessions live under
   `~/.pi/agent/sessions/--<cwd>--/` (each line an entry with `id`/`parentId`;
   follow `parentId` back from the last entry for the active branch; subagent
   sessions the extension started live under
   `<agent dir>/pi-dev/<parent session id>/agents/`). Read this workspace's
   directory only — never glob across unrelated projects. Complement with the
   session's diffs and commits.

2. **Hunt candidates in these categories:**

   - **Navigation** — the agent searched long for things a pointer would have
     named. Finding: a navigation pointer (GLOSSARY, docs/REPO.md, a comment) or
     misplaced docs.
   - **Ledger rates (opt-in)** — when the target repo carries
     `.dev/lifecycle/`, first run this package's `gates/gate.sh mine`: the
     D-gate first-pass rate plus the A-verdict flip count, together with the
     `skip_test` rate from `.dev/audit/*.tsv`. Route the three rates into
     fixes: encode as constraints rows (new gates) or fold into existing lint
     (correct's highest enforcement tier) — never prose edits alone. Without a
     ledger, mine the tsv only, unchanged.
   - **ADR health** — when the repo carries `docs/adr/`: run the repo's ADR
     checker if it is wired (`scripts/check-adrs.py` — numbering, status
     tokens, supersede closure); an overturned decision whose old half never
     got marked is mechanical drift, and a repo where that check is missing
     routes back to `constraints` for installation. What the checker cannot
     see stays a judgment finding: a `proposed` status hanging undecided, a
     `deprecated` ADR that nothing replaced, or code that has visibly
     outgrown a decision — surface those to the user rather than silently
     rewriting the ADR.
   - **Automated checks** — a mistake a check could have caught. Read the
     repo's own lint/typecheck/test commands and CI first: an existing check
     that sits unwired or broken is the finding. A repo with no guardrail at
     all is itself a finding.
   - **Coding standards** — should a rule be added, removed, or clarified?
     Classify first: a **mechanical** violation (fixed pattern, banned API,
     import shape, file location) gets a deterministic check — custom lint
     rule, pre-commit hook, or CI job, whichever the repo's guardrail makes
     cheapest. Reserve `CODING_STANDARDS.md`/constraint prose for genuine
     judgment calls. If docs/CONSTRAINTS.md is absent, propose the `constraints`
     skill instead of a prose list.
   - **Steering files** — instructions in AGENTS.md/CLAUDE.md that didn't
     change behavior (no-ops), or that belong in checks/standards.
   - **Tool economy** — expensive calls, token-heavy passages a pointer or a
     script would have replaced.
   - **Information access** — a crucial signal the agent couldn't reach
     (logs, traces, state); propose teeing it to a path it can read.
   - **Skill edits (this stack)** — a skill that triggered wrongly, triggered
     late, or whose steps misfired in practice. Route: trivial edits (tighten
     a line, fix a stale fact) do directly; substantive edits (new section,
     new table) draft the change and show it; a skill that failed to trigger
     gets a description tune — say which trigger words should have fired.

3. **Classify and route each finding to the highest level that enforces it** (first that works wins):

   | Level | Route | Enforced by |
   |---|---|---|
   | Architecture | one owner per state, one supported way per task, internals hidden | the wrong way no longer compiles/imports |
   | Types | make the bad state unrepresentable | the compiler |
   | Lint/check | a rule whose error names the fix | linter / pre-commit / CI |
   | Tests | behavior locked at the right seam | the suite |
   | Docs / rules / skill edits | prose, navigation pointers, skill text | nothing — that's why it's last |

   Anything a check could enforce does not go to prose. Prove each proposed
   check fails on a real past mistake from the session — a check that can't
   fail on history enforces nothing.

4. **Synthesize.** Sort findings: each gets one line — the class, its
   evidence from the transcript (quote or cite), the routing level, and why
   the higher levels didn't work. Distinguish findings about the repo from
   findings about this stack's skills.

5. **Apply with approval.** Present the full list; the user picks the subset
   and may redirect routings — skill edits affect every future agent. Trivial
   edits (a line, a stale fact) apply directly after approval; **substantive
   edits (a description/trigger change, a changed protocol) route through the
   `eval` skill first**: trigger changes rerun the case bank, protocol changes
   run a variant A/B — only eval-passing edits apply, and rejected ones get a
   `evals/skill-impact.md` ledger row so the next retro doesn't re-propose
   them blind. Record accepted rules in a table pairing each rule with what
   enforces it — a rule with nothing enforcing it is a repeat waiting to happen.

6. **Reply:** findings in routing order, evidence inline, what was applied,
   what was declined, and the one change with the highest expected payback
   for the next session.

## Style for anything written (inlined, no external dependency)

Write for a cold reader: lead with the trigger (when to read this), keep the
step the reader executes next visible, prefer a table over a paragraph when
comparing, and never trust a rule that nothing enforces.
