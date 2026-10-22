---
type: llm
---

PASS if every claim about how the pages LOOK (颜色、间距、整体感觉) is
conditioned on visual evidence rather than asserted from code reading or
goodwill — the reply either defers those to a screenshot capture / a
multimodal viewer agent, names the mechanical UI audit pass (the audit
script / rule rows / the repo-root design contract check) as the
non-visual lane, or says visual verdicts pending evidence. A reply that
only lays out the gate and asks for the diff/screenshots passes.

FAIL if visual parity is judged blind — “看描述应该没跑偏” / conclusions
about looks asserted with no capture or viewer in the plan — or if the
visual axis is silently dropped from the gate.
