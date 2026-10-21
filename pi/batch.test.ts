import { describe, expect, test } from "bun:test";

import {
  aggregateNoticeText,
  aggregateResultText,
  clampRetry,
  defaultKey,
  runBatch,
  toSpecs,
  type BatchSpec,
} from "./batch.ts";
import type { EndedRecord, RunningRecord } from "./agents.ts";

function ended(id: string, status: "completed" | "failed" | "stopped", finalText = "ok"): EndedRecord {
  const agent = {
    id,
    description: `desc ${id}`,
    subagentType: "general-purpose",
    sessionId: id,
    sessionDir: "/dev/null",
    cwd: "/tmp",
    startedAt: "2026-10-21T00:00:00Z",
  };
  return { agent, status, pid: 1, exitCode: status === "completed" ? 0 : 1, endedAt: "2026-10-21T00:01:00Z", finalText };
}

describe("clampRetry", () => {
  test("falsy and negative clamp to 0, values cap at 2, fractions floor", () => {
    expect(clampRetry(undefined)).toBe(0);
    expect(clampRetry(0)).toBe(0);
    expect(clampRetry(-3)).toBe(0);
    expect(clampRetry(1)).toBe(1);
    expect(clampRetry(2)).toBe(2);
    expect(clampRetry(9)).toBe(2);
  });
});

describe("toSpecs", () => {
  test("default key is the first word of the description, retry clamped", () => {
    const [a] = toSpecs([{ description: "Check the API surface", prompt: "p", retry: 9 }]);
    expect(a?.key).toBe("Check");
    expect(a?.retry).toBe(2);
  });
  test("explicit keys honored and trimmed to 24 chars", () => {
    const [a] = toSpecs([{ key: "  reviewer-a  ", description: "d", prompt: "p" }]);
    expect(a?.key).toBe("reviewer-a");
    const [b] = toSpecs([{ key: "x".repeat(40), description: "d", prompt: "p" }]);
    expect(b?.key).toHaveLength(24);
  });
  test("duplicate keys throw before anything starts", () => {
    expect(() =>
      toSpecs([
        { key: "same", description: "d1", prompt: "p" },
        { key: "same", description: "d2", prompt: "p" },
      ]),
    ).toThrow(/unique/);
  });
});

describe("runBatch", () => {
  // script: per-task-key attempt-outcome sequences (the cursor advances per
  // wait, so a retry's fresh id still reads the next outcome for that task).
  function drive(script: Record<string, Array<"completed" | "failed" | "stopped">>): { drive: Parameters<typeof runBatch>[1]; log: string[] } {
    const log: string[] = [];
    let seq = 0;
    const keyOf = new Map<string, string>();
    const cursors = new Map<string, number>();
    return {
      log,
      drive: {
        start(spec: BatchSpec) {
          const id = `a${seq++}`;
          keyOf.set(id, spec.key);
          log.push(`start ${spec.key} → ${id}`);
          return id;
        },
        async wait(id: string): Promise<EndedRecord> {
          const key = keyOf.get(id) ?? id;
          const i = cursors.get(key) ?? 0;
          cursors.set(key, i + 1);
          const outcome = (script[key] ?? [])[i] ?? "completed";
          log.push(`wait ${id} → ${outcome}`);
          return ended(id, outcome);
        },
      },
    };
  }

  test("all-green batch: one start per task, one wait per task, attempts at 1", async () => {
    const { drive: d, log } = drive({ a: ["completed"], b: ["completed"] });
    const { rows, allCompleted } = await runBatch(toSpecs([{ key: "a", description: "d", prompt: "p" }, { key: "b", description: "d", prompt: "p" }]), d);
    expect(allCompleted).toBe(true);
    expect(rows.map((r) => [r.key, r.status, r.attempts])).toEqual([["a", "completed", 1], ["b", "completed", 1]]);
    expect(log.filter((l) => l.startsWith("start"))).toHaveLength(2);
  });

  test("failure retries up to the spec budget, marking attempts", async () => {
    const { drive: d } = drive({ flaky: ["failed", "completed"], steady: ["completed"] });
    const { rows, allCompleted } = await runBatch(
      toSpecs([
        { key: "flaky", description: "d", prompt: "p", retry: 2 },
        { key: "steady", description: "d", prompt: "p" },
      ]),
      d,
    );
    expect(allCompleted).toBe(true);
    expect(rows[0]?.attempts).toBe(2);
    expect(rows[1]?.attempts).toBe(1);
  });

  test("retry budget exhausted keeps failed status with attempts recorded", async () => {
    const { drive: d } = drive({ doomed: ["failed", "failed", "failed"], ok: ["completed"] });
    const { rows, allCompleted } = await runBatch(
      toSpecs([
        { key: "doomed", description: "d", prompt: "p", retry: 2 },
        { key: "ok", description: "d", prompt: "p" },
      ]),
      d,
    );
    expect(allCompleted).toBe(false);
    expect(rows[0]).toMatchObject({ status: "failed", attempts: 3 });
    expect(rows[1]).toMatchObject({ status: "completed", attempts: 1 });
  });

  test("stopped is a decision, never retried", async () => {
    const { drive: d, log } = drive({ halt: ["stopped"], go: ["completed"] });
    const { rows } = await runBatch(
      toSpecs([
        { key: "halt", description: "d", prompt: "p", retry: 2 },
        { key: "go", description: "d", prompt: "p" },
      ]),
      d,
    );
    expect(rows[0]).toMatchObject({ status: "stopped", attempts: 1 });
    expect(log.filter((l) => l.startsWith("start"))).toHaveLength(2);
  });

  test("pre-started ids are driven instead of starting fresh", async () => {
    let starts = 0;
    const drive = {
      start: () => {
        starts++;
        return "pre";
      },
      wait: async (id: string) => ended(id, "completed"),
    };
    const { rows } = await runBatch(toSpecs([{ description: "d", prompt: "p" }]), drive, ["pre"]);
    expect(starts).toBe(0);
    expect(rows[0]?.agentId).toBe("pre");
  });

  test("arity mismatch between specs and started ids throws", async () => {
    const drive = { start: () => "x", wait: async (id: string) => ended(id, "completed") };
    expect(runBatch(toSpecs([{ description: "d", prompt: "p" }]), drive, ["x", "y"])).rejects.toThrow(/arity/);
  });
});

describe("aggregate notices and tables", () => {
  const rows = [
    { key: "a", agentId: "a1", status: "completed" as const, attempts: 1, exitCode: 0, finalText: "fine result", worktreeKept: undefined, outputFile: undefined },
    { key: "b", agentId: "b1", status: "failed" as const, attempts: 3, exitCode: 1, finalText: "boom", worktreeKept: undefined, outputFile: undefined },
    { key: "c", agentId: "c1", status: "stopped" as const, attempts: 1, exitCode: null, finalText: "", worktreeKept: undefined, outputFile: undefined },
  ];

  test("notice: stats line, per-row one-liners, stopped row carries no text section", () => {
    const text = aggregateNoticeText(rows);
    expect(text).toContain("3 agents: 1 completed, 1 failed, 1 stopped");
    expect(text).toContain("✓ a: completed (agent a1)");
    expect(text).toContain("✗ b: failed (agent b1, attempt 3)");
    expect(text).toContain("■ c: stopped (agent c1)");
    expect(text).toContain("— a —\nfine result");
    expect(text).not.toContain("— c —");
  });

  test("notice: oversized row text is truncated with a marker", () => {
    const big = [{ ...rows[0]!, finalText: "x".repeat(4000) }];
    const text = aggregateNoticeText(big);
    expect(text).toContain("…[truncated]");
  });

  test("foreground table: full per-row sections come from the injected resultText lookup", () => {
    const text = aggregateResultText(rows, (id) => (id === "a1" ? "FULL a" : id === "b1" ? "FULL b" : "FULL c"));
    expect(text).toContain("✓ a: completed (agent a1)");
    expect(text).toContain("— a —\nFULL a");
    expect(text).toContain("retried 2×");
  });
});
