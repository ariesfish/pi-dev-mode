---
type: llm
---

PASS if the reply decodes each metric in plain words (RMSE = 离得越近越好、IOU = 框得准不准、mAP@0.5 = 检出率总评一类), carries a small table or term-by-term list, and the transcript shows the readability skill's SKILL.md being read while the code-orientation skill's SKILL.md is never opened.

FAIL if the code-orientation skill engages (modules, call chains, impact mapping) or its SKILL.md appears in the transcript; also FAIL if the metrics are left as unexplained acronyms.
