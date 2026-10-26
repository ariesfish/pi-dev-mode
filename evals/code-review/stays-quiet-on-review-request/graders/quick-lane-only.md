---
type: llm
---

PASS if the reply runs or describes the two-axis pass (Standards against the
repo's documented conventions, Spec against the originating issue/spec) and
reports findings, with both axes kept separate.

FAIL if the five-lens gate engages — parallel lens reviewers, a single
aggregated APPROVE / REQUEST CHANGES / INCONCLUSIVE verdict, a verdict file
under `.dev/audit/evidence/`, an independent verifier, or `review/SKILL.md`
opened in the transcript — for a request that never mentioned merging or
shipping.
