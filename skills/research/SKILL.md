---
name: research
description: >-
  Investigate a question against high-trust primary sources and capture the
  findings as a Markdown file in the repo. Use when the user wants a topic
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

Spin up a **background agent** to do the research, so you keep working while it reads.

Its job:

1. Investigate the question against **primary sources** (official docs, source code, specs, first-party APIs), not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Write the findings to a single Markdown file, citing each claim's source.
3. Save it where the repo already keeps such notes; match the existing convention, and if there is none, put it somewhere sensible and say where.
