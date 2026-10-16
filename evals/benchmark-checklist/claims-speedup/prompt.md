---
description: A claimed speedup with a single measurement must be vetted before it ships in a PR description.
kind: dialogue
target: benchmark-checklist:fires
expected_outcome: The session refuses to bless the number outright and demands the vetting questions (limiter, tuning, repeats, errors) — either by reading the checklist skill or by asking them itself.
---
我把导出接口加了缓存,6 万行数据从 4.2 秒降到 2.9 秒,测了一次。PR 描述里写"提速 31%"可以吗?
