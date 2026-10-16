---
name: prd
description: >-
  Turn the current conversation context into a PRD and publish it to the project
  issue tracker. Use when the user wants to create a PRD from the current
  context as part of a developer workflow. Chinese triggers: 写 PRD, 生成 PRD,
  整理需求, 需求文档, 产品需求, 把对话整理成 PRD, 写产品文档, 需求沉淀.
---

# PRD

<!-- pi-dev-mode changelog:
- migrated from ~/.agents/skills/dev-prd (mattp to-prd derived; upstream has since
  removed to-prd — keeping the PRD layer is an intentional pi-dev-mode divergence)
- 2026-10-15 synced to mattp@49dd158 (#1192): each proposed module/seam gets a
  one-line note on what testing there catches and misses.
- 2026-10 P1 upgrade (03 matrix row): Acceptance Criteria section added to the template with the three-label convention; align's labeled candidates are harvested verbatim.
- 2026-10 P1.2 (pie dogfood observation): missing config bootstraps in place (one confirmation with a recommendation) instead of stopping to demand setup.
-->

This skill takes the current conversation context and codebase understanding and produces a PRD. Do NOT interview the user — synthesize what you already know.

This skill sits after `align`, `code-map`, or `proto` in the developer workflow and before `issues`.

The issue tracker and triage label vocabulary should have been provided by `setup`. If missing, do not stop and send the user away: infer the tracker from repo evidence (git remote on github.com → GitHub; `tasks/plan.md` → Tasks files; `.scratch/` → local markdown; default and no-remote → Tasks files, zero service dependencies), ask exactly ONE confirmation question carrying your recommendation, seed `docs/agents/` from the setup skill's references, then continue the work this skill was invoked for.

## Process

1. Explore the repo to understand the current state of the codebase, if you haven't already. Use the project's domain glossary vocabulary throughout the PRD, and respect any ADRs in the area you're touching.

2. Sketch out the major modules you will need to build or modify to complete the implementation. Actively look for opportunities to extract deep modules that can be tested in isolation.

A deep module (as opposed to a shallow module) is one which encapsulates a lot of functionality in a simple, testable interface which rarely changes.

Give each proposed module or seam a one-line note on what a test there catches and what it misses — that note is what lets the user judge the test surface, not just the module list.

Check with the user that these modules match their expectations. Check with the user which modules they want tests written for.

3. Harvest acceptance criteria. If `align` ran in this conversation, lift its three-label candidates (`[check]` / `[evidence]` / `[judgment]`) verbatim into the template's Acceptance Criteria section. Where they do not cover a user story, write new criteria and label each one.

4. Write the PRD using the template below, then publish it to the project issue tracker. Apply the `ready-for-agent` triage label - no need for additional triage.

<prd-template>

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format of:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

This list of user stories should be extremely extensive and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.

Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it within the relevant decision and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase)

## Out of Scope

A description of the things that are out of scope for this PRD.

## Acceptance Criteria

Each criterion carries exactly one label, lowercase and square-bracketed:

- `[check: <command to run>]` — a machine verifies it: run the command, read its output or exit code.
- `[evidence: <procedure to follow>]` — an agent verifies it by capturing the named artifact (screenshot, ARIA snapshot, log excerpt).
- `[judgment: <who decides, and why only a human can>]` — no machine can verify it; name the decider.

Every user story has at least one criterion. A criterion with no label is returned to the ladder: either give it a `[check]`/`[evidence]` procedure, or admit it is `[judgment]`.

## Further Notes

Any further notes about the feature.

</prd-template>
