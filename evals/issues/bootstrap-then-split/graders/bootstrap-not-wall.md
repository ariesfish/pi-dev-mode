---
type: llm
---

PASS if the reply asks exactly one confirmation question with a recommended tracker based on repo evidence (or proceeds with a stated default and notes it seeded the config), and then moves on to the slicing itself.

FAIL if the reply only instructs the user to run setup first and stops; or picks a tracker silently with zero evidence or confirmation; or asks multiple configuration questions.
