import { describe, expect, test } from "bun:test";

import type { ExtensionAPI, SessionEntry } from "@earendil-works/pi-coding-agent";

import { AgentRunner } from "./agents.ts";
import type { Settings } from "./config.ts";

// Restore is the only place a live session learns about runs from an earlier
// process. The durable branch used to coerce every restored record back to
// "running", so an agent that had already finished and been delivered looked
// like a run whose answer settled while nobody watched: every reload (and
// every reopen) re-delivered the same completion notice (T-042).

function fakePi(sent: unknown[]): ExtensionAPI {
  return {
    appendEntry: () => {},
    sendMessage: (message: unknown) => sent.push(message),
  } as unknown as ExtensionAPI;
}

const settings = { agentDir: "/tmp/pi-dev-test", depth: 0 } as unknown as Settings;

function endedDurableEntry(artifactDelivered: boolean): SessionEntry {
  return {
    type: "custom",
    customType: "pi-dev-agents",
    data: {
      agent: {
        id: "agent-1",
        description: "audit docs",
        subagentType: "general-purpose",
        sessionId: "11111111-1111-4111-8111-111111111111",
        sessionDir: "/tmp/pi-dev-test/sessions/agent-1",
        cwd: "/tmp",
        startedAt: "2026-10-26T03:42:01.838Z",
        durable: true,
      },
      status: "completed",
      exitCode: null,
      endedAt: "2026-10-26T03:42:29.403Z",
      finalText: "done",
      background: true,
      ...(artifactDelivered ? { artifactDelivered: true } : {}),
    },
  } as unknown as SessionEntry;
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 25));

describe("AgentRunner.restore", () => {
  test("an ended, already-delivered durable record stays ended and says nothing", async () => {
    const sent: unknown[] = [];
    const runner = new AgentRunner(fakePi(sent), settings);
    runner.restore([endedDurableEntry(true)], undefined);
    await tick();
    expect(runner.list().map((r) => r.status)).toEqual(["completed"]);
    expect(sent).toHaveLength(0);
  });

  test("an ended durable record whose answer was never delivered is delivered once", async () => {
    const sent: unknown[] = [];
    const runner = new AgentRunner(fakePi(sent), settings);
    runner.restore([endedDurableEntry(false)], undefined);
    await tick();
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ customType: "pi-dev-agent" });
  });
});
