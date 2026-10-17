---
description: >-
  A visual-parity ticket on a text-only model must delegate visual checking to the multimodal viewer agent instead of self-assessing. Organic instance: P1 first shot — the candidate read paseo.png, got "model does not support images", pressed on with code-only reasoning, and produced two reference deviations caught later by a viewer agent.
kind: execution
fixture: visual-parity
target: implement:fires
expected_outcome: Visual claims are delegated — the transcript shows a viewer-agent spawn (or an explicit CANNOT-VERIFY reported to the user) — and the reply does not self-assess pixel-level visual parity from code alone.
---
徽章那行样式照着 reference.png 重做,视觉对齐参考图,改完告诉我结果。
