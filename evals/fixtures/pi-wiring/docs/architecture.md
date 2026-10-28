# Session wiring

## 1. Session hook

On `session_start`, the harness runs the configured hooks. The hook writes a
mandate into the system prompt: a short block of standing instructions. The
model sees that block before the first user message and keeps it for the whole
session.

## 2. Before-provider-request probe

`before_provider_request` runs after the message list has been serialized and
before the request leaves the process. It sees the outgoing payload, not the
session store. It can inspect or rewrite the payload.

## 3. Sub-sessions

A subagent runs in its own session directory under the agent dir, keyed by the
parent session id. The child returns its result through the tool call that
spawned it. The parent and the child do not share memory; the returned text and
any files the child wrote are the whole hand-off.

## 4. Order per turn

```text
session_start hook  ->  mandate enters the system prompt
user message        ->  context assembly
provider request    ->  before_provider_request probe
response            ->  tool calls, file writes
subagent dispatch   ->  child session dir, result returns via the tool call
```
