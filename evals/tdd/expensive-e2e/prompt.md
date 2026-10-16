---
description: An expensive test path should trigger the cost gate — a recorded skip-test with a cheaper check, not a blind heavy test.
kind: dialogue
target: tdd:fires
expected_outcome: The reply weighs the cost (four-minute docker e2e) and proposes the closest cheaper executable check or an explicitly recorded skip decision, instead of just writing the heavy test.
---
给 settings-sync 加个回归测试吧。不过每次跑测试都要起整套 docker 环境,一轮大概四分钟。就先直接写个 e2e 好了?
