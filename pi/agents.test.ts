import { describe, expect, test } from "bun:test";

import type { ExtensionAPI, SessionEntry } from "@earendil-works/pi-coding-agent";

import { AgentRunner } from "./agents.ts";
import type { Settings } from "./config.ts";

// Restore is the only place a live session learns about runs from an earlier
// process, and it must read the entry stream the way the record schema says:
// last write per agent id wins. Walking the raw stream instead let an old
// "running" write resurrect an agent that had finished since — the durable
// branch reattached to an idle bridge, read that as "the answer settled while
// nobody watched", and delivered the same notice again on every reload (T-042).

function fakePi(sent: unknown[]): ExtensionAPI {
  return {
    appendEntry: () => {},
    sendMessage: (message: unknown) => sent.push(message),
  } as unknown as ExtensionAPI;
}

const settings = { agentDir: "/tmp/pi-dev-test", depth: 0 } as unknown as Settings;

const identity = {
  id: "agent-1",
  description: "audit docs",
  subagentType: "general-purpose",
  sessionId: "11111111-1111-4111-8111-111111111111",
  sessionDir: "/tmp/pi-dev-test/sessions/agent-1",
  cwd: "/tmp",
  startedAt: "2026-10-26T03:42:01.838Z",
  durable: true,
};

function entry(data: Record<string, unknown>): SessionEntry {
  return { type: "custom", customType: "pi-dev-agents", data } as unknown as SessionEntry;
}

const running = () => entry({ agent: identity, status: "running", parentPid: 1, background: true });

const completed = (artifactDelivered: boolean) =>
  entry({
    agent: identity,
    status: "completed",
    exitCode: null,
    endedAt: "2026-10-26T03:42:29.403Z",
    finalText: "done",
    background: true,
    ...(artifactDelivered ? { artifactDelivered: true } : {}),
  });

const tick = () => new Promise((resolve) => setTimeout(resolve, 25));

describe("AgentRunner.restore", () => {
  test("a live history (running -> completed -> delivered) says nothing on reload", async () => {
    const sent: unknown[] = [];
    const runner = new AgentRunner(fakePi(sent), settings);
    runner.restore([running(), completed(false), completed(true)], undefined);
    await tick();
    expect(runner.list().map((r) => r.status)).toEqual(["completed"]);
    expect(sent).toHaveLength(0);
  });

  test("an ended record that was never delivered is delivered once", async () => {
    const sent: unknown[] = [];
    const runner = new AgentRunner(fakePi(sent), settings);
    runner.restore([running(), completed(false)], undefined);
    await tick();
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ customType: "pi-dev-agent" });
  });

  test("a record still marked running is the one that reattaches", async () => {
    const sent: unknown[] = [];
    const runner = new AgentRunner(fakePi(sent), settings);
    runner.restore([running()], undefined);
    await tick();
    // No bridge registry in this test, so the honest outcome is a stopped
    // record — and no notice: this process is the one asking for the stop.
    expect(sent).toHaveLength(0);
    expect(runner.list().map((r) => r.status)).toEqual(["stopped"]);
  });
});
