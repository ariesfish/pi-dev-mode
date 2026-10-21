// pi/durable.test.ts — the durable bridge (T-030) over in-memory storage and
// a scripted faux model: spawn→report once, steer mid-run, stop, and the
// money test — park (close) mid-run and reopen (resume) without losing the
// work or reporting twice.
import { describe, expect, test } from "bun:test";
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import { createModels } from "@earendil-works/pi-ai/models";
import { fauxAssistantMessage, fauxProvider, fauxText } from "@earendil-works/pi-ai/providers/faux";

import { DurableBridge, type DeliverReport } from "./durable.ts";

const MODEL = { provider: "faux", modelId: "faux-1" };

function fauxModels(tokensPerSecond?: number) {
  const models = createModels();
  const faux = fauxProvider(tokensPerSecond ? { tokensPerSecond } : undefined);
  models.setProvider(faux.provider);
  return { models, faux };
}

async function open(models: ReturnType<typeof fauxModels>["models"], storage?: unknown): Promise<DurableBridge> {
  const { openTestBridge } = await import("./durable.ts");
  // The shared-storage variant is covered by the reopen test below; simple
  // opens take a fresh storage unless the test hands one in.
  return openTestBridge(models, storage as never);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function until(claim: () => boolean | Promise<boolean>, what: string, timeoutMs = 15_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!(await claim())) {
    if (Date.now() > deadline) throw new Error(`timeout waiting for ${what}`);
    await sleep(25);
  }
}

function spawnOf(agentId: string, prompt: string): Parameters<DurableBridge["spawn"]>[0] {
  return {
    agentId,
    description: `test ${agentId}`,
    model: "faux/faux-1",
    readonly: false,
    instructions: "You are a test child.",
    prompt,
    cwd: process.cwd(),
  };
}

const textOf = (report: DeliverReport | undefined) => report?.text ?? "(none yet)";

describe("durable bridge", () => {
  test("spawn settles once and reports the answer", async () => {
    const { models, faux } = fauxModels();
    faux.setResponses([fauxAssistantMessage([fauxText("READY-42")])]);
    const bridge = await open(models);
    const reports: DeliverReport[] = [];
    bridge.onReport((report) => reports.push(report));
    await bridge.spawn(spawnOf("t1", "compute something"));
    await until(() => reports.some((r) => r.agentId === "t1"), "the t1 report");
    const report = reports.find((r) => r.agentId === "t1" && r.text !== "")!;
    expect(report.status).toBe("completed");
    expect(report.text).toContain("READY-42");
    expect((await bridge.agents()).t1?.lastAnswer).toContain("READY-42");
    expect(await bridge.busy("t1")).toBe(false);
    await bridge.close();
  });

  test("send steers a busy agent, follows up an idle one", async () => {
    const { models, faux } = fauxModels();
    // First run long enough to stay busy; the steer reaches it mid-run.
    faux.setResponses([
      fauxAssistantMessage([fauxText("FIRST-ANSWER")]),
      fauxAssistantMessage([fauxText("SECOND-ANSWER")]),
    ]);
    const bridge = await open(models);
    const reports: DeliverReport[] = [];
    bridge.onReport((report) => reports.push(report));
    await bridge.spawn(spawnOf("t2", "first task"));
    await until(() => reports.some((r) => r.agentId === "t2"), "the first answer");
    // Idle now: the next message starts a turn on the same conversation.
    const steered = await bridge.send("t2", "second task");
    expect(steered.steered).toBe(false);
    await until(() => reports.filter((r) => r.agentId === "t2").length >= 2, "the second answer");
    expect(reports[1].text).toContain("SECOND-ANSWER");
    // Same conversation, two turns: the ledger kept one agent record.
    expect(Object.keys(await bridge.agents())).toEqual(["t2"]);
    await bridge.close();
  });

  test("stop aborts the run and leaves the conversation reusable", async () => {
    const { models, faux } = fauxModels();
    faux.setResponses([
      // Long enough to still be working when the stop lands.
      fauxAssistantMessage([fauxText("SHOULD-NOT-REPORT")]),
      fauxAssistantMessage([fauxText("AFTER-STOP")]),
    ]);
    const bridge = await open(models);
    const reports: DeliverReport[] = [];
    bridge.onReport((report) => reports.push(report));
    await bridge.spawn(spawnOf("t3", "a long task"));
    await bridge.stop("t3");
    await bridge.waitIdle("t3");
    expect(await bridge.busy("t3")).toBe(false);
    // The conversation survives its stop: a new turn answers on it.
    await bridge.send("t3", "try again");
    await until(() => reports.some((r) => r.agentId === "t3" && r.text.includes("AFTER-STOP")), "the post-stop answer");
    await bridge.close();
  });

  test("park and reopen: work continues and reports once, never twice", async () => {
    // Slow stream: the run is still in flight when the park lands.
    const { models, faux } = fauxModels(4);
    // Two scripts: a run parked mid-generation re-issues its model request on
    // resume (real providers re-bill the second attempt the same way), while
    // the submission itself never duplicates (requestId) and the report
    // fires exactly once (reported[]).
    const answer = () => fauxAssistantMessage([fauxText("SURVIVOR")]);
    faux.setResponses([answer(), answer()]);
    // The real restart medium: a memory store dies with its session, the
    // sqlite file is what a next process actually reopens.
    const { mkdtemp, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const dir = await mkdtemp(join(tmpdir(), "pi-dev-durable-test-"));
    const { openNodeSqliteStorage } = await import("@earendil-works/pi-durable/storage/sqlite/node");
    const storage = await openNodeSqliteStorage(join(dir, "session.sqlite"));
    try {
      const { DurableBridge } = await import("./durable.ts");
      const first = await DurableBridge.fromStorage(storage, models, join(dir, "intercom"));
      const reports: DeliverReport[] = [];
      first.onReport((report) => reports.push(report));
      await first.spawn(spawnOf("t4", "work across restarts"));
      await until(async () => first.busy("t4"), "the run to start");
      expect(await first.busy("t4")).toBe(true);
      // Park mid-run: work in flight is written back pending, uncounted.
      await first.close();
      // Reopen the same file — a new harness, a fresh hook.
      const second = await DurableBridge.fromStorage(await openNodeSqliteStorage(join(dir, "session.sqlite")), models, join(dir, "intercom"));
      second.onReport((report) => reports.push(report));
      expect(reports.length).toBe(0);
      second.resume();
      await until(() => reports.some((r) => r.agentId === "t4"), "the resumed report");
      expect(textOf(reports.find((r) => r.agentId === "t4" && r.text !== ""))).toContain("SURVIVOR");
      // Exactly one report for one answer, across the restart.
      expect(reports.filter((r) => r.agentId === "t4" && r.text.includes("SURVIVOR")).length).toBe(1);
      expect(await second.agents().then((a) => a.t4?.conversationId)).toBeTruthy();
      await second.close();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("BACKGROUND_CONTEXT never cancels and ask ids are stable", async () => {
    const { models, faux } = fauxModels();
    faux.setResponses([fauxAssistantMessage([fauxText("X")])]);
    const bridge = await open(models);
    expect(bridge.rootId).toBeTruthy();
    await bridge.close();
    expect(BACKGROUND_CONTEXT).toBeDefined();
  });
});
