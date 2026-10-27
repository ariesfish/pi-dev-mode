---
description: >-
  A repo with no scripted way to prove behavior must get a generated
  project-local verification skill that drives the real app, not ad-hoc test
  scripts written once.
kind: dialogue
target: create-verification-skill:fires
expected_outcome: >-
  The reply proposes generating a project-local verify skill for this app:
  inventory the real surfaces, write the driver, then prove it by running the
  whole thing end to end before handover.
---
我们这个 web 应用每次改完都得手动点一遍才算验过,慢又漏。想让 agent 自己能像用户一样开页面、点流程、截图留证,以后每次改动都跑同一套。有办法把它做成长期可用的东西吗?
