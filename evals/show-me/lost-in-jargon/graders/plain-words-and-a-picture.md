---
type: llm
---

PASS if the reply decodes the mechanism chain from `docs/architecture.md` in plain words — each internal name (session hook / mandate injection, the before_provider_request probe, the child-session hand-off) gets a short plain-language line at first use — and any visual stays compact in-chat Markdown (pseudocode, tree, diff, or Mermaid), and no HTML file is written or opened for this normal turn.

FAIL if the reply stacks internal names without plain decoding, invents a
mechanism the note does not describe, or an HTML page appears where the
in-chat answer belongs.
