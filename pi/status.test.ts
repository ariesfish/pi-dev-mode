// pi/status.test.ts — the status bar's pure half: every string the bar
// shows is built by a function here, computed from a record or a session
// entry, so the questions (what the segments say, what order, what colors,
// what drops when the terminal is narrow) are answered in a test, not in a
// live TUI.
import { describe, expect, test } from "bun:test";
import { visibleWidth } from "@earendil-works/pi-tui";

import type { AgentRecord } from "./agents.ts";
import {
  ICONS,
  agentsSummary,
  agentSegments,
  colorize,
  contextSegments,
  costSegments,
  elapsed,
  fitStatusLine,
  formatTokens,
  modelSegment,
  pathSegments,
  statusSegments,
  summarizeUsage,
  turnStart,
  usageSegments,
  type StatusTheme,
} from "./status.ts";
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

function ended(
  id: string,
  description: string,
  status: "completed" | "failed" | "stopped",
  endedAt: string,
  startedAt = "2020-01-01T00:00:00.000Z",
): AgentRecord {
  return {
    agent: { id, description, subagentType: "general-purpose", sessionId: "s", sessionDir: "/x", cwd: "/x", startedAt },
    status,
    exitCode: 0,
    endedAt,
    finalText: "",
  } as unknown as AgentRecord;
}

/** Tags theme calls instead of emitting ANSI. */
const tagTheme: StatusTheme = {
  fg: (color, text) => `<${color}:${text}>`,
};

// ─── icons ──────────────────────────────────────────────────────────────────

describe("icons render one column wide", () => {
  test("every glyph matches pi-tui's width table (cache bolt is the one 2-wide)", () => {
    for (const [name, glyph] of Object.entries(ICONS)) {
      expect(visibleWidth(glyph), name).toBe(name === "cache" ? 2 : 1);
    }
  });
});

// ─── token numbers ──────────────────────────────────────────────────────────

describe("formatTokens", () => {
  test("owner's uppercase style", () => {
    expect(formatTokens(0)).toBe("0");
    expect(formatTokens(999)).toBe("999");
    expect(formatTokens(1000)).toBe("1.0K");
    expect(formatTokens(9999)).toBe("10.0K");
    expect(formatTokens(12000)).toBe("12K");
    expect(formatTokens(123456)).toBe("123K");
    expect(formatTokens(1234567)).toBe("1.2M");
    expect(formatTokens(128000)).toBe("128K");
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

// ─── the stats segments ─────────────────────────────────────────────────────

describe("usageSegments", () => {
  test("icon-led stats in owner order, one space after arrow icons, hit rate after the bolt", () => {
    const segments = usageSegments({ input: 74000, output: 35000, cacheRead: 1600000, cacheWrite: 100000, cost: 0, cacheHitRate: 98.2 });
    expect(segments).toEqual([
      { text: `  ${ICONS.in} 74K`, color: "success" },
      { text: `  ${ICONS.out} 35K`, color: "accent" },
      { text: `  ${ICONS.cache}98.2%`, color: "text" },
    ]);
  });

  test("no cache hit rate: the bolt stays hidden even with cache traffic", () => {
    const segments = usageSegments({ input: 10, output: 0, cacheRead: 900, cacheWrite: 0, cost: 0, cacheHitRate: undefined });
    expect(segments.map((s) => s.text).join("")).not.toContain(ICONS.cache);
  });

  test("empty totals produce no segments", () => {
    expect(usageSegments({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0 })).toEqual([]);
  });
});

// ─── the context group ──────────────────────────────────────────────────────

describe("contextSegments", () => {
  test("database icon, used/window, percent — uppercase, one space after the icon", () => {
    expect(contextSegments({ percent: 8.5, contextWindow: 1000000 })).toEqual([
      { text: `  ${ICONS.context} 85K/1.0M`, color: "dim" },
      { text: " 8.5%", color: "dim" },
    ]);
  });

  test("unknown percent: question mark, no percent segment", () => {
    const segments = contextSegments({ percent: null, contextWindow: 128000 });
    expect(segments).toEqual([{ text: `  ${ICONS.context} ?/128K`, color: "dim" }]);
  });

  test("no context: no segments", () => {
    expect(contextSegments(undefined)).toEqual([]);
  });
});

// ─── the cost segment ───────────────────────────────────────────────────────

describe("costSegments", () => {
  test("plain dollar, 3 decimals, dim", () => {
    expect(costSegments({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0.456 })).toEqual([
      { text: "  $0.456", color: "dim" },
    ]);
  });

  test("zero cost is omitted", () => {
    expect(costSegments({ input: 1, output: 1, cacheRead: 0, cacheWrite: 0, cost: 0 })).toEqual([]);
  });
});

// ─── the status line (left half) ────────────────────────────────────────────

describe("statusSegments", () => {
  const totals = { input: 74000, output: 35000, cacheRead: 1700000, cacheWrite: 0, cost: 0.456, cacheHitRate: 98.2 };
  const context = { percent: 8.5, contextWindow: 1000000 };
  const model = { provider: "推理集群", id: "deepseek-daily", reasoning: true };

  test("owner order: model first, stats, hit rate, context, cost", () => {
    const segments = statusSegments(totals, context, model, "max");
    expect(segments.map((s) => s.text).join("")).toBe(
      `${ICONS.model} 推理集群/deepseek-daily max  ${ICONS.in} 74K  ${ICONS.out} 35K  ${ICONS.cache}98.2%  ${ICONS.context} 85K/1.0M 8.5%  $0.456`,
    );
    expect(segments.map((s) => s.color)).toEqual(["dim", "success", "accent", "text", "dim", "dim", "dim"]);
  });

  test("no context, no cost: model and stats only", () => {
    const segments = statusSegments({ input: 10, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0 }, undefined, model, "max");
    expect(segments.map((s) => s.text).join("")).toBe(
      `${ICONS.model} 推理集群/deepseek-daily max  ${ICONS.in} 10`,
    );
  });
});

// ─── the path group (right half) ────────────────────────────────────────────

describe("pathSegments", () => {
  test("folder, path, git branch with its icon", () => {
    expect(pathSegments("~/Projects/WT-DeepInfer", "deepinfer-sm90", undefined)).toEqual([
      { text: `${ICONS.folder} ~/Projects/WT-DeepInfer`, color: "dim" },
      { text: ` ${ICONS.branch} deepinfer-sm90`, color: "dim" },
    ]);
  });

  test("no branch: session name in parens as the fallback", () => {
    expect(pathSegments("~", undefined, "mysession")).toEqual([
      { text: `${ICONS.folder} ~`, color: "dim" },
      { text: " (mysession)", color: "dim" },
    ]);
  });

  test("nothing else: path alone", () => {
    expect(pathSegments("~", undefined, undefined)).toEqual([{ text: `${ICONS.folder} ~`, color: "dim" }]);
  });
});

// ─── the model segment (right half) ─────────────────────────────────────────

describe("modelSegment", () => {
  test("robot icon, Provider/model Effort — dim", () => {
    expect(modelSegment({ provider: "推理集群", id: "deepseek-daily", reasoning: true }, "max")).toEqual({
      text: `${ICONS.model} 推理集群/deepseek-daily max`,
      color: "dim",
    });
  });

  test("a reasoning model without a level shows off", () => {
    expect(modelSegment({ provider: "funai", id: "gpt-5.6-terra", reasoning: true }, undefined)).toEqual({
      text: `${ICONS.model} funai/gpt-5.6-terra off`,
      color: "dim",
    });
  });

  test("a non-reasoning model has no effort suffix", () => {
    expect(modelSegment({ provider: "funai", id: "gpt-5.6-sol", reasoning: false }, "high")).toEqual({
      text: `${ICONS.model} funai/gpt-5.6-sol`,
      color: "dim",
    });
  });

  test("no model", () => {
    expect(modelSegment(undefined, undefined)).toEqual({ text: `${ICONS.model} no-model`, color: "dim" });
  });
});

// ─── line fitting ───────────────────────────────────────────────────────────

describe("fitStatusLine", () => {
  const left = "a b c"; // 5 wide
  const right = "x y"; // 3 wide

  test("plenty of room: right flush, flexible gap", () => {
    expect(fitStatusLine(left, right, 20)).toEqual({ left, right, gap: 12 });
  });

  test("tight: the gap collapses to one space", () => {
    expect(fitStatusLine(left, right, 9)).toEqual({ left, right, gap: 1 });
  });

  test("narrower: the right side truncates first", () => {
    expect(fitStatusLine(left, right, 7)).toEqual({ left, right: "x\u001b[0m", gap: 1 });
  });

  test("no room for the right side: left alone, truncated from its tail", () => {
    expect(fitStatusLine(left, right, 4)).toEqual({ left: "a b\u001b[0m…\u001b[0m", right: "", gap: 0 });
  });

  test("CJK on either side counts double width", () => {
    expect(fitStatusLine("abc", "推理", 9)).toEqual({ left: "abc", right: "推理", gap: 2 });
    expect(fitStatusLine("推理", "xy", 8)).toEqual({ left: "推理", right: "xy", gap: 2 });
  });
});

// ─── theme glue ─────────────────────────────────────────────────────────────

describe("colorize", () => {
  test("every segment color goes through theme.fg", () => {
    expect(colorize({ text: "x", color: "dim" }, tagTheme)).toBe("<dim:x>");
    expect(colorize({ text: "x", color: "success" }, tagTheme)).toBe("<success:x>");
    expect(colorize({ text: "x", color: "accent" }, tagTheme)).toBe("<accent:x>");
    expect(colorize({ text: "x", color: "text" }, tagTheme)).toBe("<text:x>");
  });
});

// ─── elapsed ────────────────────────────────────────────────────────────────

describe("elapsed", () => {
  const start = "2026-10-22T10:00:00.000Z";
  const at = (offsetMs: number) => Date.parse(start) + offsetMs;

  test("always seconds — a run past a minute keeps ticking instead of freezing on \"1m\"", () => {
    expect(elapsed(start, at(0))).toBe("0s");
    expect(elapsed(start, at(45_000))).toBe("45s");
    expect(elapsed(start, at(60_000))).toBe("60s");
    expect(elapsed(start, at(61_000))).toBe("61s");
    expect(elapsed(start, at(5 * 60_000))).toBe("300s");
    expect(elapsed(start, at(63 * 60_000))).toBe("3780s");
    expect(elapsed(start, at(26 * 3_600_000))).toBe("93600s");
  });

  test("a clock behind the record clamps to zero", () => {
    expect(elapsed(start, at(-5_000))).toBe("0s");
  });
});

// ─── the agents line ────────────────────────────────────────────────────────

const sessionEntry = (role: string, timestamp: string) =>
  ({ type: "message", message: { role }, timestamp }) as unknown as SessionEntry;

describe("turnStart", () => {
  test("the last user message opens the turn", () => {
    const entries = [
      sessionEntry("user", "2026-10-22T09:00:00.000Z"),
      sessionEntry("assistant", "2026-10-22T09:00:05.000Z"),
      sessionEntry("user", "2026-10-22T10:00:00.000Z"),
      sessionEntry("assistant", "2026-10-22T10:00:09.000Z"),
    ];
    expect(turnStart(entries)).toBe("2026-10-22T10:00:00.000Z");
  });

  test("no user message yet: no boundary, nothing is filtered out", () => {
    expect(turnStart([sessionEntry("assistant", "2026-10-22T10:00:09.000Z")])).toBeUndefined();
    expect(turnStart([])).toBeUndefined();
  });
});

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

  test("a turn boundary drops earlier turns' finished agents but keeps their live runs", () => {
    const records = [
      ended("old1", "previous turn done", "completed", "2026-10-22T09:30:00.000Z", "2026-10-22T09:20:00.000Z"),
      running("live", "still going from last turn", "2026-10-22T09:35:00.000Z"),
      ended("new1", "this turn done", "completed", "2026-10-22T10:00:30.000Z", "2026-10-22T10:00:05.000Z"),
    ];
    const scoped = agentsSummary(records, "2026-10-22T10:00:00.000Z")!;
    expect(scoped.running).toBe(1);
    expect(scoped.ended).toBe(1); // old1 dropped, new1 kept
    expect(scoped.items.map((i) => i.id)).toEqual(["live", "new1"]);
  });

  test("nothing left in this turn: undefined, the line hides", () => {
    const stale = [ended("old", "a", "completed", "2026-10-22T09:00:00.000Z", "2026-10-22T08:00:00.000Z")];
    expect(agentsSummary(stale, "2026-10-22T10:00:00.000Z")).toBeUndefined();
  });
});

describe("agentSegments", () => {
  const now = Date.parse("2026-10-22T10:00:00.000Z");

  test("mixed: running and done counts, running with elapsed, nerd marks, +more", () => {
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
    expect(segments[0]).toEqual({ text: "agents 1 running · 4 done", color: "dim" });
    expect(segments).toContainEqual({ text: `${ICONS.running} review ui diff (720s)`, color: "accent" });
    expect(segments).toContainEqual({ text: `${ICONS.failed} build site`, color: "error" });
    expect(segments).toContainEqual({ text: `${ICONS.done} t040 cleanup`, color: "success" });
    expect(segments).toContainEqual({ text: `${ICONS.stopped} old run`, color: "dim" });
    expect(segments.at(-1)).toEqual({ text: "+1", color: "dim" });
  });

  test("all running: plain count prefix", () => {
    const summary = agentsSummary([running("a1", "one", "2026-10-22T09:59:00.000Z"), running("a2", "two", "2026-10-22T09:59:30.000Z")])!;
    const segments = agentSegments(summary, now);
    expect(segments[0]).toEqual({ text: "agents 2 running", color: "dim" });
    expect(segments).toContainEqual({ text: `${ICONS.running} one (60s)`, color: "accent" });
  });

  test("all ended: done prefix, no running items", () => {
    const summary = agentsSummary([ended("e1", "a", "completed", "2026-10-22T09:58:00.000Z"), ended("e2", "b", "stopped", "2026-10-22T09:55:00.000Z")])!;
    const segments = agentSegments(summary, now);
    expect(segments[0]).toEqual({ text: "agents 2 done", color: "dim" });
    expect(segments.find((s) => s.color === "accent")).toBeUndefined();
  });
});
