import { describe, expect, test } from "bun:test";

import { DurableEngine } from "./durable-engine.ts";
import type { AgentState, DurableAgent, EndedRecord, AgentRecord } from "./agents.ts";
import type { Settings } from "./config.ts";

// reattach is where a reopened session learns what happened to a durable run
// it was not watching. Its fallback matters: with no bridge to ask, the record
// must close honestly as stopped — and say nothing, because this process is the
// one ending it. The duplicate-notice bug (T-042) lived one level up, in how
// restore fed this function; this pins the function's own contract.

const identity = {
  id: "agent-1",
  description: "audit docs",
  subagentType: "general-purpose",
  sessionId: "11111111-1111-4111-8111-111111111111",
  sessionDir: "/tmp/pi-dev-engine-test/sessions/agent-1",
  cwd: "/tmp",
  startedAt: "2026-10-26T03:42:01.838Z",
  durable: true as const,
};

describe("DurableEngine.reattach", () => {
  test("no bridge: the record closes as stopped and nothing is announced", async () => {
    const states = new Map<string, AgentState>();
    const persisted: AgentRecord[] = [];
    const delivered: EndedRecord[] = [];
    const engine = new DurableEngine({} as never, { agentDir: "/tmp/pi-dev-engine-test", depth: 0 } as unknown as Settings, {
      get: (id) => states.get(id),
      set: (id, state) => void states.set(id, state),
      persist: (record) => void persisted.push(record),
      deliver: (record) => void delivered.push(record),
      rpcLaunch: () => {},
      localRun: () => undefined,
    });

    const state: DurableAgent = {
      kind: "durable",
      record: { agent: identity, status: "running", parentPid: 1, background: true },
      spawn: Promise.resolve(),
      settle: engine.trackSettle(identity.id),
    };
    states.set(identity.id, state);

    await engine.reattach(state, {} as never, undefined);

    expect(states.get(identity.id)?.kind).toBe("ended");
    expect(persisted.at(-1)).toMatchObject({ status: "stopped" });
    expect(delivered).toHaveLength(0);
  });
});
