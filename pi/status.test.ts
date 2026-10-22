// pi/status.test.ts — the status bar's pure half: every string the bar
// shows is built by a function here, computed from a record or a session
// entry, so the questions (what the segments say, what order, what colors,
// what drops when the terminal is narrow) are answered in a test, not in a
// live TUI.
import { describe, expect, test } from "bun:test";
import { rgbColor, visibleWidth } from "@earendil-works/pi-tui";

import type { AgentRecord } from "./agents.ts";
import {
  ICONS,
  METER_WIDTH,
  agentsSummary,
  agentSegments,
  colorize,
  elapsed,
  fitStatusLine,
  formatTokens,
  meterSegments,
  modelSegment,
  statusSegments,
  summarizeUsage,
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

function ended(id: string, description: string, status: "completed" | "failed" | "stopped", endedAt: string): AgentRecord {
  return {
    agent: { id, description, subagentType: "general-purpose", sessionId: "s", sessionDir: "/x", cwd: "/x", startedAt: "2020-01-01T00:00:00.000Z" },
    status,
    exitCode: 0,
    endedAt,
    finalText: "",
  } as unknown as AgentRecord;
}

/** Tags theme calls instead of emitting ANSI; colors are concrete Color values. */
const tagTheme: StatusTheme = {
  fg: (color, text) => `<${color}:${text}>`,
  style: (text) => `[${text}]`,
  colors: { success: rgbColor(1, 2, 3), dim: rgbColor(4, 5, 6), toolSuccessBg: rgbColor(7, 8, 9) },
};

// ─── icons ──────────────────────────────────────────────────────────────────

describe("icons render one column wide", () => {
  test("every glyph the bar prints is width 1", () => {
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

// ─── the context meter ──────────────────────────────────────────────────────

describe("meterSegments", () => {
  test("filled cells round the percent, the rest is dot track, 12 cells wide", () => {
    const segments = meterSegments(8.5); // round(0.085 * 12) = 1
    expect(segments.map((s) => s.text).join("")).toHaveLength(METER_WIDTH);
    expect(segments).toEqual([
      { text: ICONS.meterFill, color: "meterFill" },
      { text: ICONS.meterTrack.repeat(11), color: "meterTrack" },
    ]);
  });

  test("null percent renders an empty track", () => {
    expect(meterSegments(null)).toEqual([{ text: ICONS.meterTrack.repeat(METER_WIDTH), color: "meterTrack" }]);
  });

  test("100% fills every cell", () => {
    expect(meterSegments(100)).toEqual([{ text: ICONS.meterFill.repeat(METER_WIDTH), color: "meterFill" }]);
  });
});

// ─── the stats segments ─────────────────────────────────────────────────────

describe("usageSegments", () => {
  test("icon-led stats in screenshot order, zeros omitted, two-space gaps", () => {
    const segments = usageSegments({ input: 74000, output: 35000, cacheRead: 1600000, cacheWrite: 100000, cost: 0 });
    expect(segments).toEqual([
      { text: `  ${ICONS.in}74k`, color: "success" },
      { text: `  ${ICONS.out}35k`, color: "accent" },
      { text: `  ${ICONS.cache}1.7M`, color: "text" },
    ]);
  });

  test("empty totals produce no segments", () => {
    expect(usageSegments({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0 })).toEqual([]);
  });
});

// ─── the status line (left half) ────────────────────────────────────────────

describe("statusSegments", () => {
  const totals = { input: 74000, output: 35000, cacheRead: 1700000, cacheWrite: 0, cost: 0 };
  const context = { percent: 8.5, contextWindow: 1000000 };

  test("screenshot field order: path, branch, stats, wide gap, meter, used/window, percent", () => {
    const segments = statusSegments(totals, context, "~/Projects/WT-DeepInfer", "deepinfer-sm90");
    expect(segments.map((s) => s.text).join("")).toBe(
      `${ICONS.folder} ~/Projects/WT-DeepInfer (deepinfer-sm90)  ${ICONS.in}74k  ${ICONS.out}35k  ${ICONS.cache}1.7M     ${ICONS.meterFill}${ICONS.meterTrack.repeat(11)}  85k/1.0M 8.5%`,
    );
    expect(segments.map((s) => s.color)).toEqual([
      "dim",
      "dim",
      "success",
      "accent",
      "text",
      "plain",
      "meterFill",
      "meterTrack",
      "dim",
      "dim",
    ]);
  });

  test("no identity, no stats: the meter follows the path after one space", () => {
    const segments = statusSegments({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0 }, context, "~", undefined);
    expect(segments.map((s) => s.text).join("")).toBe(
      `${ICONS.folder} ~ ${ICONS.meterFill}${ICONS.meterTrack.repeat(11)}  85k/1.0M 8.5%`,
    );
  });

  test("unknown percent: empty track, question mark, no percent segment", () => {
    const segments = statusSegments(totals, { percent: null, contextWindow: 128000 }, "~", undefined);
    const joined = segments.map((s) => s.text).join("");
    expect(joined).toContain(`${ICONS.meterTrack.repeat(METER_WIDTH)}  ?/128k`);
    expect(joined).not.toContain("%");
  });

  test("no context: no meter, no used/window, no percent", () => {
    const segments = statusSegments(totals, undefined, "~", undefined);
    expect(segments.some((s) => s.color === "meterFill" || s.color === "meterTrack")).toBe(false);
    expect(segments.map((s) => s.text).join("")).not.toContain("/");
  });
});

// ─── the model segment (right half) ─────────────────────────────────────────

describe("modelSegment", () => {
  test("robot icon, provider model effort — space separated, dim", () => {
    expect(modelSegment({ provider: "推理集群", id: "deepseek-daily", reasoning: true }, "max")).toEqual({
      text: `${ICONS.model} 推理集群 deepseek-daily max`,
      color: "dim",
    });
  });

  test("a reasoning model without a level shows off", () => {
    expect(modelSegment({ provider: "funai", id: "gpt-5.6-terra", reasoning: true }, undefined)).toEqual({
      text: `${ICONS.model} funai gpt-5.6-terra off`,
      color: "dim",
    });
  });

  test("a non-reasoning model has no effort suffix", () => {
    expect(modelSegment({ provider: "funai", id: "gpt-5.6-sol", reasoning: false }, "high")).toEqual({
      text: `${ICONS.model} funai gpt-5.6-sol`,
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
  test("token colors go through theme.fg, meter segments through theme.style", () => {
    expect(colorize({ text: "x", color: "dim" }, tagTheme)).toBe("<dim:x>");
    expect(colorize({ text: "x", color: "success" }, tagTheme)).toBe("<success:x>");
    expect(colorize({ text: "x", color: "accent" }, tagTheme)).toBe("<accent:x>");
    expect(colorize({ text: "x", color: "meterFill" }, tagTheme)).toBe("[x]");
    expect(colorize({ text: "x", color: "meterTrack" }, tagTheme)).toBe("[x]");
  });

  test("plain and text segments pass through unstyled", () => {
    expect(colorize({ text: "x", color: "plain" }, tagTheme)).toBe("x");
    expect(colorize({ text: "x", color: "text" }, tagTheme)).toBe("x");
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

  test("mixed: ratio prefix, running with elapsed, nerd marks, +more", () => {
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
    expect(segments).toContainEqual({ text: `${ICONS.running} review ui diff (12m)`, color: "accent" });
    expect(segments).toContainEqual({ text: `${ICONS.failed} build site`, color: "error" });
    expect(segments).toContainEqual({ text: `${ICONS.done} t040 cleanup`, color: "success" });
    expect(segments).toContainEqual({ text: `${ICONS.stopped} old run`, color: "dim" });
    expect(segments.at(-1)).toEqual({ text: "+1", color: "dim" });
  });

  test("all running: plain count prefix", () => {
    const summary = agentsSummary([running("a1", "one", "2026-10-22T09:59:00.000Z"), running("a2", "two", "2026-10-22T09:59:30.000Z")])!;
    const segments = agentSegments(summary, now);
    expect(segments[0]).toEqual({ text: "agents 2 running", color: "dim" });
    expect(segments).toContainEqual({ text: `${ICONS.running} one (1m)`, color: "accent" });
  });

  test("all ended: ended prefix, no running items", () => {
    const summary = agentsSummary([ended("e1", "a", "completed", "2026-10-22T09:58:00.000Z"), ended("e2", "b", "stopped", "2026-10-22T09:55:00.000Z")])!;
    const segments = agentSegments(summary, now);
    expect(segments[0]).toEqual({ text: "agents 2 ended", color: "dim" });
    expect(segments.find((s) => s.color === "accent")).toBeUndefined();
  });
});
