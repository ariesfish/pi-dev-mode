---
name: tdd
description: >-
  Build features or fix bugs using test-driven development with a strict
  red-green-refactor loop and vertical tracer-bullet slices. Use when the user
  wants TDD, test-first development, integration-style behavior tests,
  public-interface tests, regression tests, or mentions red-green-refactor.
  Chinese triggers: 测试先行, 红绿重构, 先写测试, 回归测试, 测试驱动开发.
---

# TDD

## Philosophy

**Core principle**: Tests should verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't.

**Good tests** are integration-style: they exercise real code paths through public APIs. They describe _what_ the system does, not _how_ it does it. A good test reads like a specification - "user can checkout with valid cart" tells you exactly what capability exists. These tests survive refactors because they don't care about internal structure.

**Bad tests** are coupled to implementation. They mock internal collaborators, test private methods, or verify through external means (like querying a database directly instead of using the interface). The warning sign: your test breaks when you refactor, but behavior hasn't changed. If you rename an internal function and tests fail, those tests were testing implementation, not behavior.

See [references/tests.md](references/tests.md) for examples and [references/mocking.md](references/mocking.md) for mocking guidelines.

## Anti-Pattern: Horizontal Slices

**DO NOT write all tests first, then all implementation.** This is "horizontal slicing" - treating RED as "write all tests" and GREEN as "write all code."

This produces **crap tests**:

- Tests written in bulk test _imagined_ behavior, not _actual_ behavior
- You end up testing the _shape_ of things (data structures, function signatures) rather than user-facing behavior
- Tests become insensitive to real changes - they pass when behavior breaks, fail when behavior is fine
- You outrun your headlights, committing to test structure before understanding the implementation

**Correct approach**: Vertical slices via tracer bullets. One test → one implementation → repeat. Each test responds to what you learned from the previous cycle. Because you just wrote the code, you know exactly what behavior matters and how to verify it.

```
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  RED→GREEN: test3→impl3
  ...
```

## Cost gate

Before writing a test, price it honestly. If the test path is expensive — slow end-to-end runs, heavy fixtures, production-like state, an unclear repro — do not force it. Fall back to the **closest executable check** (a targeted script, a snapshot diff, a log assertion, a focused integration check), and record the decision in the decision trail (`.dev/audit/<ticket-slug>.tsv`, or a comment on the issue) as:

```
skip-test: <reason> | fallback: <the check you ran instead>
```

A bad test — mock-heavy, brittle, testing imagined behavior, deleted a week later — is worse than no test. But "no test" must be a **recorded decision with a fallback check**, never a silent omission.

The assertion discipline that keeps the remaining tests honest: a test that would still pass if every function it called returned `undefined` asserts nothing. If you find one, rewrite the assertion against the observable result, or delete the test.

## Answer-only requests

If the user asks where/what/why — locate, explain, point at the line, sanity-check — or says don't touch it (no takeover, I'll fix it myself), the deliverable is an answer with evidence: exact file:line and the precise change they would make. Never edit. Edits need an explicit do-request. "Just tell me" is a hard no-edit signal, not a soft one. If you catch yourself opening an editor after a tell-me request: stop, undo, answer. This rule outranks the red-green loop — a red typecheck is information to report, not a license to fix.

## Workflow

### 1. Planning

When exploring the codebase, use the project's domain glossary so that test names and interface vocabulary match the project's language, and respect ADRs in the area you're touching.

Before writing any code:

- [ ] Confirm with user what interface changes are needed
- [ ] Confirm with user which behaviors to test (prioritize)
- [ ] Identify opportunities for [deep modules](references/deep-modules.md) (small interface, deep implementation)
- [ ] Design interfaces for [testability](references/interface-design.md)
- [ ] List the behaviors to test (not implementation steps)
- [ ] Get user approval on the plan

Ask: "What should the public interface look like? Which behaviors are most important to test?"

**You can't test everything.** Confirm with the user exactly which behaviors matter most. Focus testing effort on critical paths and complex logic, not every possible edge case.

### 2. Tracer Bullet

Write ONE test that confirms ONE thing about the system:

```
RED:   Write test for first behavior → test fails
GREEN: Write minimal code to pass → test passes
```

This is your tracer bullet - proves the path works end-to-end.

### 3. Incremental Loop

For each remaining behavior:

```
RED:   Write next test → fails
GREEN: Minimal code to pass → passes
```

Rules:

- One test at a time
- Only enough code to pass current test
- Don't anticipate future tests
- Keep tests focused on observable behavior

### 4. Refactor

After all tests pass, look for [refactor candidates](references/refactoring.md):

- [ ] Extract duplication
- [ ] Deepen modules (move complexity behind simple interfaces)
- [ ] Apply SOLID principles where natural
- [ ] Consider what new code reveals about existing code
- [ ] Run tests after each refactor step

**Never refactor while RED.** Get to GREEN first.

## Checklist Per Cycle

```
[ ] Test describes behavior, not implementation
[ ] Test uses public interface only
[ ] Test would survive internal refactor
[ ] The test fails if the behavior it names breaks (not if every callee returned undefined)
[ ] Code is minimal for this test
[ ] No speculative features added
[ ] skip-test decisions, if any, are in the decision trail with their fallback check
```
