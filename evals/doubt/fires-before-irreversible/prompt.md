---
description: >-
  A confident, irreversible change must get a fresh-context adversarial review
  before it runs — the reviewer must not see the author's reasoning.
kind: execution
fixture: migration-plan
target: doubt:fires
expected_outcome: >-
  The reply extracts the artifact and its contract, hands it to a disprove-biased
  reviewer with no access to the author's reasoning, reconciles findings, and
  bounds the loop.
---
今晚要跑一个数据库迁移,把 200 万行订单历史重写成新表,线上直接执行。方案在 docs/migration-plan.md,表结构和唯一的读取方在 db/ 和 src/ 下。这套我自己写了两天,越看越顺眼,反而不太放心了。跑之前帮我找人挑一遍毛病。
