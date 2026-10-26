// Declarative batch orchestration: one agent tool call submits N single-agent
// runs at once (per-task model/worktree/readonly/retry), foreground returns an
// aggregated table, background settles silently and wakes the session with one
// aggregate notice. No per-child notices in batch mode; steering stays
// per-child via send_message by agentId.
//
// Pure shaping lives here (specs, aggregate text, notice); the runner seam is
// injected as { start, wait } so unit tests drive retried and stopped rows
// without spawning processes. The lifecycle record schema is shared with the
// single-agent path (agents.ts), so restores and list_agents see batch
// children as ordinary agents — which they are.
import { type Static, Type } from "typebox";

import type { EndedRecord } from "./records.ts";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export const MAX_TASKS = 8;
export const MAX_RETRY = 2;
/** Per-row inline cap in the aggregate notice; foreground rows keep the full (already-capped) record text. */
export const NOTICE_ROW_CAP_BYTES = 1536;

export const taskSchema = Type.Object(
  {
    key: Type.Optional(Type.String({ description: "Stable short name for this task in the batch table" })),
    description: Type.String({ description: "A short (3-5 word) description of this task" }),
    prompt: Type.String({ description: "The task for this agent to perform" }),
    subagent_type: Type.Optional(Type.String({ description: "Agent definition to run (default general-purpose)" })),
    model: Type.Optional(Type.String({ description: "Model for this task (family name or provider/id)" })),
    isolation: Type.Optional(Type.Unsafe<"worktree">({ type: "string", enum: ["worktree"], description: "Run this task in its own git worktree" })),
    readonly: Type.Optional(Type.Boolean({ description: "Run this task without the edit and write tools" })),
    output: Type.Optional(Type.String({ description: "Bind this task's durable artifact to this path (relative to the session cwd)" })),
    retry: Type.Optional(Type.Number({ description: `Re-run this task on failure; 0-${MAX_RETRY}, default 0` })),
  },
  { additionalProperties: false },
);
export type BatchTask = Static<typeof taskSchema>;

export interface BatchSpec {
  key: string;
  description: string;
  prompt: string;
  subagent_type?: string;
  model?: string;
  isolation?: "worktree";
  readonly?: boolean;
  output?: string;
  retry: number;
}

export interface BatchRow {
  key: string;
  agentId: string;
  status: "completed" | "failed" | "stopped";
  attempts: number;
  exitCode: number | null;
  finalText: string;
  outputFile?: string;
  worktreeKept?: boolean;
}

export interface BatchDrive {
  /** Start one task; returns the running record's agent id. */
  start(spec: BatchSpec): string;
  /** Wait for one started id to settle. */
  wait(id: string): Promise<EndedRecord>;
}

export function clampRetry(retry: number | undefined): number {
  if (!retry || retry <= 0) return 0;
  return Math.min(Math.floor(retry), MAX_RETRY);
}

/** Default key: the first word-run of the description, so tables stay narrow. */
export function defaultKey(description: string): string {
  const m = /[A-Za-z0-9\u4e00-\u9fff][\w\u4e00-\u9fff-]*/.exec(description);
  return m ? m[0] : description.slice(0, 12);
}

export function toSpecs(tasks: BatchTask[]): BatchSpec[] {
  const seen = new Set<string>();
  return tasks.map((t) => {
    const key = (t.key?.trim() || defaultKey(t.description)).slice(0, 24);
    if (seen.has(key)) throw new Error(`Duplicate batch key "${key}"; keys must be unique within a batch.`);
    seen.add(key);
    return {
      key,
      description: t.description,
      prompt: t.prompt,
      subagent_type: t.subagent_type,
      model: t.model,
      isolation: t.isolation,
      readonly: t.readonly,
      output: t.output,
      retry: clampRetry(t.retry),
    };
  });
}

function rowOf(spec: BatchSpec, record: EndedRecord, attempts: number): BatchRow {
  return {
    key: spec.key,
    agentId: record.agent.id,
    status: record.status,
    attempts,
    exitCode: record.exitCode,
    finalText: record.finalText,
    outputFile: record.outputFile,
    worktreeKept: record.worktreeKept,
  };
}

/**
 * Settle every spec, retrying failed ones up to its retry budget. A stopped
 * run is a decision, not a failure: never retried. All tasks run
 * concurrently; each retry relaunches a fresh agent with the same spec.
 */
export async function runBatch(specs: BatchSpec[], drive: BatchDrive, started?: readonly string[]): Promise<{ rows: BatchRow[]; allCompleted: boolean }> {
  if (specs.length === 0) throw new Error("Empty batch.");
  const ids = started ?? specs.map((spec) => drive.start(spec));
  if (ids.length !== specs.length) throw new Error(`Batch arity mismatch: ${specs.length} specs, ${ids.length} started ids.`);
  const rows = await Promise.all(
    specs.map(async (spec, i): Promise<BatchRow> => {
      let record = await drive.wait(ids[i]!);
      let attempts = 1;
      while (record.status === "failed" && attempts <= spec.retry) {
        attempts++;
        record = await drive.wait(drive.start(spec));
      }
      return rowOf(spec, record, attempts);
    }),
  );
  return { rows, allCompleted: rows.every((r) => r.status === "completed") };
}

function statsLine(rows: BatchRow[]): string {
  const completed = rows.filter((r) => r.status === "completed").length;
  const failed = rows.filter((r) => r.status === "failed").length;
  const stopped = rows.filter((r) => r.status === "stopped").length;
  return `${rows.length} agents: ${completed} completed, ${failed} failed, ${stopped} stopped`;
}

/** One line per row, tight enough for a notice; details ride the persisted records. */
export function aggregateNoticeText(rows: BatchRow[], rowCap = NOTICE_ROW_CAP_BYTES): string {
  const head = rows.map((r) => {
    const retry = r.attempts > 1 ? `, attempt ${r.attempts}` : "";
    return `${r.status === "completed" ? "✓" : r.status === "failed" ? "✗" : "■"} ${r.key}: ${r.status} (agent ${r.agentId}${retry})`;
  });
  const texts = rows
    .filter((r) => r.status !== "stopped")
    .map((r) => {
      const text = Buffer.byteLength(r.finalText, "utf8") <= rowCap ? r.finalText : `${Buffer.from(r.finalText, "utf8").subarray(0, rowCap).toString("utf8").replace(/\uFFFD$/, "")}…[truncated]`;
      return `— ${r.key} —\n${text || "(no output)"}`;
    });
  return [statsLine(rows), ...head, "", ...texts].join("\n");
}

export function batchNotice(rows: BatchRow[]): Parameters<ExtensionAPI["sendMessage"]>[0] {
  return {
    customType: "pi-dev-agent-batch",
    content: `pi-dev agent batch finished.\n${aggregateNoticeText(rows)}`,
    display: true,
    details: { batch: true, rows: rows.map((r) => ({ key: r.key, agentId: r.agentId, status: r.status, attempts: r.attempts })) },
  };
}

/** Foreground aggregate: stats, one header line per row, full record text sections. */
export function aggregateResultText(rows: BatchRow[], resultTextOf: (agentId: string) => string): string {
  const head = rows.map((r) => {
    const retry = r.attempts > 1 ? ` — retried ${r.attempts - 1}×` : "";
    return `${r.status === "completed" ? "✓" : r.status === "failed" ? "✗" : "■"} ${r.key}: ${r.status}${retry} (agent ${r.agentId})`;
  });
  const bodies = rows.map((r) => `— ${r.key} —\n${resultTextOf(r.agentId)}`);
  return [statsLine(rows), ...head, "", ...bodies].join("\n");
}
