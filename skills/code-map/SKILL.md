---
name: code-map
description: >-
  Map an unfamiliar area of code at a higher level: relevant modules, callers,
  dependencies, domain concepts, and how the code fits into the bigger system.
  Use when the user is unfamiliar with a code section, asks to zoom out, needs
  orientation before changing code, or wants to understand impact and
  surrounding context. Chinese triggers: 看懂这块代码, 梳理代码, 解释模块, 调用链,
  依赖关系, 影响范围, 从哪里改, 定位代码, 代码地图.
---

# Dev Code Map

<!-- ariesfish changelog:
- migrated from ~/.agents/skills/dev-code-map (2026-10); no upstream mattp@49dd158 delta applied this round.
-->
Go up a layer of abstraction before changing code.

Use `code-map` before `prd`, `issues`, `tdd`, `diagnose`, or `refact` when the relevant code area is unfamiliar. For repo-wide durable onboarding, use `repo-map` instead.

Use the project's domain glossary vocabulary when available. Explain the area in terms of domain concepts first, then implementation names.

Produce a concise code map covering:

- **Purpose** — what this area is responsible for.
- **Domain concepts** — the project vocabulary that names the concepts here.
- **Relevant modules** — the key files, functions, classes, routes, commands, or packages.
- **Callers** — what invokes this code.
- **Dependencies** — what this code invokes or assumes.
- **Data/control flow** — the normal path through the area.
- **Change impact** — what is likely affected by edits here.
- **Good next step** — what to inspect, test, or ask before making changes.

Do not implement changes while using this skill unless the user explicitly asks. The output is orientation, not a patch.
