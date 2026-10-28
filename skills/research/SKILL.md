---
name: research
description: >-
  Investigate a question against high-trust primary sources and capture the
  findings as a Markdown file inside the feature's own .dev/<slug>/ directory. Use when the user wants a topic
  researched, docs or API facts gathered, or reading legwork delegated to a
  background agent. Chinese triggers: 调研, 查资料, 帮我查, API 调研.
---

# Research

**Step 0 — create the note before reading.** The deliverable exists before the
answer can be composed: create `.dev/<slug>/research.md` with the question and
an empty `## Findings` heading, then investigate into it. No feature dir yet →
name the effort with a slug (`feature-` prefix, the whole dir name being the
slug) and create it (a research note is often the first thing a feature dir
holds); several notes on one effort: `.dev/<slug>/research/<topic>.md`.

Spin up a **background agent** with the `agent` tool — `run_in_background: true`
— handing it that path, so you keep working while it reads.

**The file is the deliverable.** A summary in chat that offers to write the note
has not done the research: the next agent cannot cite it, and it dies with the
session. Report by pointing at the file. Sources that could not be reached are
listed in the note as gaps — never filled from memory.

Its job:

1. Investigate the question against **primary sources** (official docs, source code, specs, first-party APIs), not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Fill the note: one file per question, every claim carrying its source. Findings that land after the note is written go into the same file, not into chat.
3. A conclusion worth keeping after the question is answered does not stay in process memory: escalate it — an architecture decision to `grill-me`/ADR, a quality bar to `constraints`, a domain term to the glossary. The note itself expires with the question.
