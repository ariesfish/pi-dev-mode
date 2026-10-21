---
name: research
description: >-
  Investigate a question against high-trust primary sources and capture the
  findings as a Markdown file inside the feature's own .dev/<slug>/ directory. Use when the user wants a topic
  researched, docs or API facts gathered, or reading legwork delegated to a
  background agent. Chinese triggers: 调研, 查资料, 帮我查, API 调研.
---

# Research

Spin up a **background agent** with the `agent` tool — `run_in_background: true` — so you keep working while it reads.

Its job:

1. Investigate the question against **primary sources** (official docs, source code, specs, first-party APIs), not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Write the findings to a single Markdown file at `.dev/<slug>/research.md`, citing each claim's source — the feature's own directory; no feature dir yet → name the effort with a slug (it starts with `feature-`, the whole dir name being the slug) and create it (a research note is often the first thing a feature dir holds). Several notes on one effort: `.dev/<slug>/research/<topic>.md`.
3. A conclusion worth keeping after the question is answered does not stay in process memory: escalate it — an architecture decision to `grill-me`/ADR, a quality bar to `constraints`, a domain term to the glossary. The note itself expires with the question.
