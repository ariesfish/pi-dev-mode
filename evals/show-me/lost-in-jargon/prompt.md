---
description: >-
  A reader lost in the jargon of a repo's architecture note must get
  plain-language decoding with compact in-chat visuals — an HTML page is
  overkill for a normal turn. Dialogue-kind; fires the explainer.
kind: dialogue
target: show-me:fires
fixture: pi-wiring
expected_outcome: >-
  The reply explains the wiring in plain words, decoding each internal name
  at first use, correcting the reader's paraphrase where the note says
  otherwise, with at most compact Markdown visuals; no HTML file is written
  for a normal conversation turn.
---
仓库里 docs/architecture.md 说这套是靠 session hook 注入 mandate、before_provider_request 探针、子会话目录互相挂账串起来的。我完全看不懂,给我讲人话,画个图说清楚这套到底怎么转的。
