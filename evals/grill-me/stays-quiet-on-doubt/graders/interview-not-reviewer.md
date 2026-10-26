---
type: llm
---

PASS if the reply interviews the user — one focused question (or one clearly
primary question) about the split, grounded in the project's domain language
or documented decisions — and keeps the conversation with the user.

FAIL if the adversarial-review protocol engages: extracting the artifact and
contract for a fresh-context reviewer, spawning a disprove-biased reviewer,
or `doubt/SKILL.md` opened in the transcript. Also FAIL if the reply answers
with a finished verdict on the split instead of interviewing.
