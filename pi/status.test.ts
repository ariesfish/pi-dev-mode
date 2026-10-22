// pi/status.test.ts — the status footer's pure half: every string the footer
// shows is built by a function here, computed from a record or a session
// entry, so the questions (what the tokens say, what order, what drops when
// the terminal is narrow) are answered in a test, not in a live TUI.
import { describe, expect, test } from "bun:test";
import { visibleWidth } from "@earendil-works/pi-tui";

import type { AgentRecord } from "./agents.ts";
import { ICONS, agentsSummary, agentSegments, elapsed, formatTokens, modelToken, statsTokens, summarizeUsage } from "./status.ts";
import type { SessionEntry } from "@earendil-works/pi-coding-agent";

// ─── fixtures ───────────────────────────────────────────────────────────────

const usage = (input: number, output: number, cacheRead: number, cacheWrite: number, total: number) => ({
  input,
  output,
  cacheRead,
  cacheWrite,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total },
});

const assistantEntry = (u: ReturnType<typeof usage>) =>
  ({ type: "message", message: { role: "assistant", usage: u } }) as unknown as SessionEntry;

function running(id: string, description: string, startedAt: string): AgentRecord {
  return {
    agent: { id, description, subagentType: "general-purpose", sessionId: "s", sessionDir: "/x", cwd: "/x", startedAt },
    status: "running",
    parentPid: 1,
  } as unknown as AgentRecord;
}

function ended(id: string, description: string, status: "completed" | "failed" | "stopped", endedAt: string): AgentRecord {
  return {
    agent: { id, description, subagentType: "general-purpose", sessionId: "s", sessionDir: "/x", cwd: "/x", startedAt: "2020-01-01T00:00:00.000Z" },
    status,
    exitCode: 0,
    endedAt,
    finalText: "",
  } as unknown as AgentRecord;
}

// ─── icons ──────────────────────────────────────────────────────────────────

describe("icons render one column wide", () => {
  test("every glyph the footer prints is width 1", () => {
    for (const [name, glyph] of Object.entries(ICONS)) {
      expect(visibleWidth(glyph), name).toBe(1);
    }
  });
});

// ─── token numbers ──────────────────────────────────────────────────────────

describe("formatTokens", () => {
  test("same semantics as pi's built-in footer", () => {
    expect(formatTokens(0)).toBe("0");
    expect(formatTokens(999)).toBe("999");
    expect(formatTokens(1000)).toBe("1.0k");
    expect(formatTokens(9999)).toBe("10.0k");
    expect(formatTokens(12000)).toBe("12k");
    expect(formatTokens(123456)).toBe("123k");
    expect(formatTokens(1234567)).toBe("1.2M");
    expect(formatTokens(128000)).toBe("128k");
  });
});

// ─── usage totals ───────────────────────────────────────────────────────────

describe("summarizeUsage", () => {
  test("usage entries, assistant messages, tool results, summaries all add up", () => {
    const entries = [
      { type: "usage", usage: usage(100, 20, 5, 0, 0.01) },
      assistantEntry(usage(500, 80, 900, 100, 0.09)),
      { type: "message", message: { role: "toolResult", usage: usage(10, 0, 0, 0, 0) } },
      { type: "branch_summary", usage: usage(1, 2, 3, 4, 0.002) },
    ] as unknown as SessionEntry[];
    const totals = summarizeUsage(entries);
    expect(totals.input).toBe(611);
    expect(totals.output).toBe(102);
    expect(totals.cacheRead).toBe(908);
    expect(totals.cacheWrite).toBe(104);
    expect(totals.cost).toBeCloseTo(0.102, 5);
    // hit rate from the latest assistant prompt only
    expect(totals.cacheHitRate).toBeCloseTo(60.0, 5); // 900 of the 1500-token prompt
  });

  test("an empty session has no hit rate", () => {
    const totals = summarizeUsage([]);
    expect(totals.input).toBe(0);
    expect(totals.cacheHitRate).toBeUndefined();
  });
});

// ─── the stats tokens (line 2 right side) ───────────────────────────────────

describe("statsTokens", () => {
  test("icon-led tokens, ctx before cost, zeros omitted", () => {
    const totals = { input: 12500, output: 3200, cacheRead: 890000, cacheWrite: 12000, cost: 0.456, cacheHitRate: 98.2 };
    const { tokens, ctxIndex } = statsTokens(totals, { percent: 34.2, contextWindow: 128000 });
    expect(tokens).toEqual(["↑13k", "↓3.2k", "≡98.2%", "◔34.2%/128k", "$0.456"]); // 12.5k rounds like pi's footer
    expect(tokens[ctxIndex]).toBe("◔34.2%/128k");
  });

  test("no cache, no cost, unknown context", () => {
    const totals = { input: 10, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, cacheHitRate: undefined };
    const { tokens, ctxIndex } = statsTokens(totals, { percent: null, contextWindow: 128000 });
    expect(tokens).toEqual(["↑10", "◔?%/128k"]);
    expect(tokens[ctxIndex]).toBe("◔?%/128k");
  });

  test("nothing to show, no context", () => {
    const totals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, cacheHitRate: undefined };
    expect(statsTokens(totals).tokens).toEqual([]);
  });
});

// ─── the model token (line 2 left side) ─────────────────────────────────────

describe("modelToken", () => {
  test("provider/model with effort when the model reasons", () => {
    expect(modelToken({ provider: "funai", id: "gpt-5.6-terra", reasoning: true }, "high")).toBe("◆ funai/gpt-5.6-terra · high");
  });

  test("a reasoning model without a level shows off", () => {
    expect(modelToken({ provider: "funai", id: "gpt-5.6-terra", reasoning: true }, undefined)).toBe("◆ funai/gpt-5.6-terra · off");
  });

  test("a non-reasoning model has no effort suffix", () => {
    expect(modelToken({ provider: "funai", id: "gpt-5.6-sol", reasoning: false }, "high")).toBe("◆ funai/gpt-5.6-sol");
  });

  test("no model", () => {
    expect(modelToken(undefined, undefined)).toBe("◆ no-model");
  });
});

// ─── elapsed ────────────────────────────────────────────────────────────────

describe("elapsed", () => {
  const start = "2026-10-22T10:00:00.000Z";
  const at = (offsetMs: number) => Date.parse(start) + offsetMs;

  test("seconds, minutes, zero-padded hours, days", () => {
    expect(elapsed(start, at(0))).toBe("0s");
    expect(elapsed(start, at(45_000))).toBe("45s");
    expect(elapsed(start, at(60_000))).toBe("1m");
    expect(elapsed(start, at(5 * 60_000))).toBe("5m");
    expect(elapsed(start, at(63 * 60_000))).toBe("1h03m");
    expect(elapsed(start, at(24 * 3_600_000))).toBe("1d0h");
    expect(elapsed(start, at(26 * 3_600_000))).toBe("1d2h");
  });

  test("a clock behind the record clamps to zero", () => {
    expect(elapsed(start, at(-5_000))).toBe("0s");
  });
});

// ─── the agents line ────────────────────────────────────────────────────────

describe("agentsSummary", () => {
  test("empty is undefined", () => {
    expect(agentsSummary([])).toBeUndefined();
  });

  test("running oldest first, ended newest first, ended capped at 3", () => {
    const summary = agentsSummary(
      [
        running("a2", "second spawn", "2026-10-22T09:56:00.000Z"),
        ended("e1", "done long ago", "completed", "2026-10-22T09:10:00.000Z"),
        running("a1", "first spawn", "2026-10-22T09:50:00.000Z"),
        ended("e4", "newest fail", "failed", "2026-10-22T09:58:00.000Z"),
        ended("e3", "stopped run", "stopped", "2026-10-22T09:40:00.000Z"),
        ended("e2", "other done", "completed", "2026-10-22T09:50:30.000Z"),
      ],
    )!;
    expect(summary.running).toBe(2);
    expect(summary.ended).toBe(4);
    expect(summary.items.map((i) => i.id)).toEqual(["a1", "a2", "e4", "e2", "e3"]); // a1 older than a2
    expect(summary.more).toBe(1);
  });
});

describe("agentSegments", () => {
  const now = Date.parse("2026-10-22T10:00:00.000Z");

  test("mixed: ratio prefix, running with elapsed, ended marks, +more", () => {
    const summary = agentsSummary(
      [
        running("a1", "review ui diff", "2026-10-22T09:48:00.000Z"),
        ended("e2", "build site", "failed", "2026-10-22T09:58:00.000Z"),
        ended("e1", "t040 cleanup", "completed", "2026-10-22T09:50:00.000Z"),
        ended("e3", "old run", "stopped", "2026-10-22T09:30:00.000Z"),
        ended("e4", "older still", "completed", "2026-10-22T09:20:00.000Z"),
      ],
    )!;
    const segments = agentSegments(summary, now);
    expect(segments[0]).toEqual({ text: "agents 1/5 running", color: "dim" }); // 1 running of 5 total
    expect(segments).toContainEqual({ text: "review ui diff (12m)", color: "accent" });
    expect(segments).toContainEqual({ text: "✗ build site", color: "error" });
    expect(segments).toContainEqual({ text: "✓ t040 cleanup", color: "success" });
    expect(segments).toContainEqual({ text: "– old run", color: "dim" });
    expect(segments.at(-1)).toEqual({ text: "+1", color: "dim" });
  });

  test("all running: plain count prefix", () => {
    const summary = agentsSummary([running("a1", "one", "2026-10-22T09:59:00.000Z"), running("a2", "two", "2026-10-22T09:59:30.000Z")])!;
    const segments = agentSegments(summary, now);
    expect(segments[0]).toEqual({ text: "agents 2 running", color: "dim" });
    expect(segments).toContainEqual({ text: "one (1m)", color: "accent" });
  });

  test("all ended: ended prefix, no running items", () => {
    const summary = agentsSummary([ended("e1", "a", "completed", "2026-10-22T09:58:00.000Z"), ended("e2", "b", "stopped", "2026-10-22T09:55:00.000Z")])!;
    const segments = agentSegments(summary, now);
    expect(segments[0]).toEqual({ text: "agents 2 ended", color: "dim" });
    expect(segments.find((s) => s.color === "accent")).toBeUndefined();
  });
});
