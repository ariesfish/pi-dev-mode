import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { alive } from "./child.ts";

// What became of the process a running record names — decided in one place,
// testable without a live process (the records and the system reader are both
// injectable; the table lives in fate.test.ts):
// - kept: it is still a child of the live pi process that launched it;
// - orphan: it is the process the record was written for, its launcher gone;
// - unknown: a process is there, and nothing says whether it is the agent's;
// - gone: no process is there, or another one is.
export type Fate = "kept" | "orphan" | "unknown" | "gone";

/** The fields a running record carries that fate is decided on. */
export interface FateProbe {
  pid?: number;
  pidStart?: string;
  parentPid: number;
}

/** What the system says about one live process, or undefined when it cannot. */
export type ProcInspect = (pid: number) => { parentPid: number; start: string } | undefined;

// What the system records about a live process. Neither value is the process's
// to change, unlike its arguments: pi sets its title, and ps then shows that in
// their place. Linux keeps both in /proc, the start as clock ticks since boot.
// ps works its start time out from the wall clock there, so a clock change
// moves it, and ps is asked only where /proc is missing, with the locale and
// time zone pinned so the text is the same on every read.
export function parseProcStat(stat: string): { parentPid: number; start: string } | undefined {
  // State, parent pid, and 17 more fields up to the start time. They follow
  // the command name, which is in parentheses and may hold any character.
  const proc = /^ \S (\d+)(?: \S+){17} (\d+) /.exec(stat.slice(stat.lastIndexOf(")") + 1));
  return proc ? { parentPid: Number(proc[1]), start: proc[2] } : undefined;
}

export function parsePsLine(out: string): { parentPid: number; start: string } | undefined {
  const m = /^\s*(\d+)\s+(\S.*\S)\s*$/.exec(out);
  return m ? { parentPid: Number(m[1]), start: m[2] } : undefined;
}

export function inspect(pid: number): { parentPid: number; start: string } | undefined {
  let stat = "";
  try {
    stat = readFileSync(`/proc/${pid}/stat`, "utf8");
  } catch {}
  const proc = parseProcStat(stat);
  if (proc) return proc;
  const ps = spawnSync("ps", ["-o", "ppid=", "-o", "lstart=", "-p", String(pid)], { encoding: "utf8", env: { ...process.env, LC_ALL: "C", TZ: "UTC" } });
  return ps.status === 0 ? parsePsLine(ps.stdout) : undefined;
}

export function fateOf(
  probe: FateProbe,
  deps: { inspect?: ProcInspect; isAlive?: (pid: number) => boolean; self?: number } = {},
): Fate {
  const look = deps.inspect ?? inspect;
  const isAlive = deps.isAlive ?? alive;
  const self = deps.self ?? process.pid;
  const { pid, pidStart, parentPid } = probe;
  if (pid === undefined || !isAlive(pid)) return "gone";
  const info = look(pid);
  if (info && pidStart !== undefined && info.start !== pidStart) return "gone";
  // With no word from the system, two live pids keep the record: calling a
  // live agent stopped would let a message start a second process on its session.
  const launcherHasIt = info ? info.parentPid === parentPid : isAlive(parentPid);
  if (parentPid !== self && launcherHasIt) return "kept";
  return info && info.start === pidStart ? "orphan" : "unknown";
}
