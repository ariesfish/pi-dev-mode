---
name: research
description: >-
  Investigate a question against high-trust primary sources and capture the
  findings as a Markdown file under .dev/research/. Use when the user wants a topic
  researched, docs or API facts gathered, or reading legwork delegated to a
  background agent. Chinese triggers: 调查一下, 查资料, 研究一下, 调研,
  API 调研, 背景调查, primary sources, 帮我查.
---

<!-- pi-dev-mode changelog:
- migrated from mattp/skills/engineering/research @49dd158, localized: Chinese
  triggers added. Dependency note: wayfinder (P1 acquisition) fires research
  tickets through this skill.
-->

# Research

Spin up a **background agent** with the `agent` tool (lowercase, pi-dev's own — `run_in_background: true`) to do the research, so you keep working while it reads.

Its job:

1. Investigate the question against **primary sources** (official docs, source code, specs, first-party APIs), not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Write the findings to a single Markdown file at `.dev/research/<slug>.md`, citing each claim's source (create the directory if absent).
3. A conclusion worth keeping after the question is answered does not stay in process memory: escalate it — an architecture decision to `align`/ADR, a quality bar to `constraints`, a domain term to the glossary. The note itself expires with the question.
