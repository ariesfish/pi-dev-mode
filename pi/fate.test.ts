import { describe, expect, test } from "bun:test";

import { fateOf, parseProcStat, parsePsLine } from "./fate.ts";

// fate.test.ts — the four-state decision table of a running record's process,
// from what the system says (or cannot). Pure: the probes and the system
// reader are both injected, so the table is locked without a live process.
// (The refresh caller's interrupted→unverified flip is refreshRestored's own
// business; the audit's "one seam per fact" made the flip direct there.)

const looks = (parentPid: number, start: string) => () => ({ parentPid, start });

describe("fateOf (decision table)", () => {
  // gone: no process is there, or another one owns the pid.
  test("no pid on the record → gone", () => {
    expect(fateOf({ parentPid: 100 }, { isAlive: () => true, inspect: () => undefined, self: 10 })).toBe("gone");
  });
  test("dead pid → gone", () => {
    expect(fateOf({ pid: 5, pidStart: "t0", parentPid: 100 }, { isAlive: () => false, inspect: looks(100, "t0"), self: 10 })).toBe("gone");
  });
  test("pid reused: recorded start ≠ current start → gone", () => {
    expect(fateOf({ pid: 5, pidStart: "t0", parentPid: 100 }, { isAlive: () => true, inspect: looks(100, "t1"), self: 10 })).toBe("gone");
  });

  // kept: still a child of the live pi process that launched it.
  test("launcher holds it (other parent, inspect agrees) → kept", () => {
    expect(fateOf({ pid: 5, pidStart: "t0", parentPid: 100 }, { isAlive: () => true, inspect: looks(100, "t0"), self: 10 })).toBe("kept");
  });
  test("inspect silent, launcher process alive → kept (two live pids keep the record)", () => {
    expect(fateOf({ pid: 5, parentPid: 100 }, { isAlive: () => true, inspect: () => undefined, self: 10 })).toBe("kept");
  });

  // orphan: this process is the record's, its launcher gone, identity certain.
  test("launcher gone, inspect confirms the recorded start → orphan", () => {
    expect(fateOf({ pid: 5, pidStart: "t0", parentPid: 100 }, { isAlive: () => true, inspect: looks(1, "t0"), self: 10 })).toBe("orphan");
  });
  test("record claims this very process but no live run of it → orphan", () => {
    expect(fateOf({ pid: 5, pidStart: "t0", parentPid: 10 }, { isAlive: () => true, inspect: looks(1, "t0"), self: 10 })).toBe("orphan");
  });

  // unknown: a process is there, and nothing says whether it is the agent's.
  test("inspect silent, launcher dead → unknown", () => {
    expect(fateOf({ pid: 5, parentPid: 100 }, { isAlive: () => true, inspect: () => undefined, self: 10 })).toBe("unknown");
  });
  test("no start on record, inspect present, launcher dead → unknown", () => {
    expect(fateOf({ pid: 5, parentPid: 100 }, { isAlive: () => true, inspect: looks(1, "t0"), self: 10 })).toBe("unknown");
  });
});

// The real reader's own shapes: /proc first, ps pinned to C locale/UTC as the
// fallback. Pure parsers, so the two literal formats are locked without a
// live process or a patchable fs.
describe("inspect's parsers (formats)", () => {
  test("/proc stat: state, parent pid, 17 skipped fields, then start ticks — the command name may hold any character", () => {
    expect(parseProcStat("12345 (pi (child)) R 1 42 0 0 -1 4194560 123 0 0 0 1 2 3 4 5 6 7 8 9999 0 0\n")).toEqual({ parentPid: 1, start: "9999" });
    expect(parseProcStat("")).toBe(undefined);
    expect(parseProcStat("garbage without shape")).toBe(undefined);
  });
  test("ps -o ppid= -o lstart= line: ppid then the pinned UTC start text", () => {
    expect(parsePsLine("  42 Mon Oct 22 01:02:03 2026\n")).toEqual({ parentPid: 42, start: "Mon Oct 22 01:02:03 2026" });
    expect(parsePsLine("")).toBe(undefined);
  });
});
