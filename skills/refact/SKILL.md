---
name: refact
description: >-
  Find architecture-focused refactoring opportunities in a codebase, especially
  deepening shallow modules, improving seams, increasing locality, and making
  code more testable and AI-navigable. Use when the user wants to improve
  architecture, review refactor candidates, consolidate tightly-coupled modules,
  design better interfaces, or explore codebase structure before refactoring.
  Chinese triggers: 重构, 改架构, 模块边界, seam, 提高可测试性.
---

# Refact

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

## Glossary

Use these terms exactly in every suggestion. Consistent language is the point — don't drift into "component," "service," "API," or "boundary." Full definitions in [references/LANGUAGE.md](references/LANGUAGE.md).

- **Module** — anything with an interface and an implementation (function, class, package, slice).
- **Interface** — everything a caller must know to use the module: types, invariants, error modes, ordering, config. Not just the type signature.
- **Implementation** — the code inside.
- **Depth** — leverage at the interface: a lot of behaviour behind a small interface. **Deep** = high leverage. **Shallow** = interface nearly as complex as the implementation.
- **Seam** — where an interface lives; a place behaviour can be altered without editing in place. (Use this, not "boundary.")
- **Adapter** — a concrete thing satisfying an interface at a seam.
- **Leverage** — what callers get from depth.
- **Locality** — what maintainers get from depth: change, bugs, knowledge concentrated in one place.

Key principles (see [references/LANGUAGE.md](references/LANGUAGE.md) for the full list):

- **Deletion test**: imagine deleting the module. If complexity vanishes, it was a pass-through. If complexity reappears across N callers, it was earning its keep.
- **The interface is the test surface.**
- **One adapter = hypothetical seam. Two adapters = real seam.**

This skill is _informed_ by the project's domain model. The domain language gives names to good seams; ADRs record decisions the skill should not re-litigate.

## Process

### 1. Explore

Read the project's domain glossary and any ADRs in the area you're touching first.

Then explore the codebase directly, or delegate exploration to a readonly background agent via the `agent` tool (this package ships it; host conventions in ../../references/pi-host.md). Don't follow rigid heuristics — explore organically and note where you experience friction:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow** — interface nearly as complex as the implementation?
- Where have pure functions been extracted just for testability, but the real bugs hide in how they're called (no **locality**)?
- Where do tightly-coupled modules leak across their seams?
- Which parts of the codebase are untested, or hard to test through their current interface?

Apply the **deletion test** to anything you suspect is shallow: would deleting it concentrate complexity, or just move it? A "yes, concentrates" is the signal you want.

### 2. Present candidates

The first reply is a **pick-list**. Fill this shape, one block per candidate,
then close with the question; the step is done when the user picks:

```
1. Files — <which files/modules are involved>
   Problem — <why the current architecture causes friction>
   Solution — <plain English: what would change>
   Benefits — <locality and leverage, and how tests improve>
2. …
```

Then close with your cut and the question:

```
My cut: <candidate N> — <one-line why, tied to leverage and locality>.
Which would you like to explore?
```

Naming a cut and a suggested order is allowed: it is a judgement the user can
override. Designing the chosen interface belongs to step 3 — the step is done
when the user picks.

**Use docs/GLOSSARY.md vocabulary for the domain, and [references/LANGUAGE.md](references/LANGUAGE.md) vocabulary for the architecture.** If `docs/GLOSSARY.md` defines "Order," talk about "the Order intake module" — not "the FooBarHandler," and not "the Order service."

**ADR conflicts**: if a candidate contradicts an existing ADR, only surface it when the friction is real enough to warrant revisiting the ADR. Mark it clearly (e.g. _"contradicts ADR-0007 — but worth reopening because…"_). Don't list every theoretical refactor an ADR forbids.

### 3. Grilling loop

Once the user picks a candidate, read
[references/DEEPENING-CONVERSATION.md](references/DEEPENING-CONVERSATION.md)
and run that loop. The pick-list is the whole first reply; the loop starts
after the pick.
