---
name: research
description: >-
  Research a question note-first: create .dev/<slug>/research.md, fill it from
  primary sources, then answer from that note and point at it. Use when the
  user wants a topic researched, docs or API facts gathered, or reading
  legwork handed to a subagent. Chinese triggers: 调研, 查资料, 帮我查, API 调研.
---

# Research

**The note comes first, and the answer comes from it.** One child does the
reading and fills the note; the reply answers from that note. The sequence is
the mechanism: there is no findings text to answer from until the file exists.

1. **Create the skeleton.** `.dev/<slug>/research.md` with the question and an
   empty `## Findings` heading. No feature dir yet → name the effort with a
   slug (`feature-` prefix, the whole dir name being the slug) and create it
   (a research note is often the first thing a feature dir holds); several
   notes on one effort: `.dev/<slug>/research/<topic>.md`.
2. **Read into the note.** A multi-source question goes to one foreground
   `agent` (`run_in_background: false`) with the path in its brief: investigate
   against primary sources, fill the note, return the path and the three
   findings that change the decision. A small question you read yourself, one
   section at a time, still writing into the note as you go.
3. **Answer from the note.** The reply answers the question using the child's
   findings and closes with the note path. Findings that land later go into the
   same file, not into chat.

Sources that could not be reached are listed in the note as gaps — never
filled from memory. A reply that offers to write the note later has not done
the research: the next agent cannot cite it, and it dies with the session.

A conclusion worth keeping after the question is answered does not stay in
process memory: escalate it — an architecture decision to `grill-me`/ADR, a
quality bar to `constraints`, a domain term to the glossary. The note itself
expires with the question.
