// Durable run artifacts and detached-survive semantics (T-025).
//
// Every agent run plans one artifact file: the CHILD session itself writes it
// during its own shutdown (--pi-dev-artifact flag), so the artifact survives a
// parent that exits first; the parent's finish() only falls back to writing it
// when the child died before writing. A normal session_shutdown never kills
// children: detached in their own process group, they run to completion and
// self-record. The next session that restores their records finds the artifact
// on disk, synthesizes the ended state, and delivers the undelivered notice.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { AgentIdentity, EndedRecord, RunningRecord } from "./agents.ts";
import { OUTPUT_CAP_BYTES, truncateUtf8 } from "./agent-text.ts";

export function artifactHeader(identity: AgentIdentity, status: string, exitCode: number | null): string {
  const lines = [
    `agent: ${identity.id}`,
    `description: ${identity.description}`,
    `type: ${identity.subagentType}`,
    identity.model ? `model: ${identity.model}` : undefined,
    `status: ${status}`,
    `exit code: ${exitCode ?? "unknown"}`,
    `started: ${identity.startedAt}`,
    `cwd: ${identity.cwd}`,
    identity.worktree ? `worktree: ${identity.worktree.path}` : undefined,
  ];
  return lines.filter(Boolean).join("\n");
}

/** The artifact's full content: metadata header, rule, then the complete final text. */
export function artifactContent(identity: AgentIdentity, status: string, exitCode: number | null, finalText: string): string {
  return `${artifactHeader(identity, status, exitCode)}\n---\n${finalText}\n`;
}

/** Reads only the payload under the header rule, for restored notices. */
export function artifactText(content: string): string {
  const i = content.indexOf("\n---\n");
  return i === -1 ? content : content.slice(i + 5);
}

// If the artifact already exists, the map name is what the running session needs.
function lastAssistantOutcome(getBranch: () => unknown[]): { status: "completed" | "stopped"; text: string } {
  for (let i = getBranch().length - 1; i >= 0; i--) {
    const entry = getBranch()[i] as { type?: string; message?: { role?: string; content?: Array<{ type: string; text?: string }>; stopReason?: string } };
    if (entry.type !== "message") continue;
    const msg = entry.message;
    if (!msg || msg.role !== "assistant") continue;
    const text = (msg.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("\n").trim();
    if (text) return { status: "completed", text };
    if (msg.stopReason && msg.stopReason !== "stop") return { status: "stopped", text: `(stopped: ${msg.stopReason})` };
  }
  return { status: "stopped", text: "(no reply recorded)" };
}

/**
 * The child session's own shutdown hook: writes its artifact before the
 * process exits. Synchronous on purpose — the shutdown must not outrun the
 * write. Writes nothing when the artifact is already there (a rewrite after a
 * fallback would race the parent's copy).
 */
export function writeSelfArtifact(
  flagValue: string | undefined,
  sidecar: { id: string; description: string; subagentType: string; model?: string; startedAt: string; cwd: string } | undefined,
  getBranch: () => unknown[],
): void {
  if (!flagValue) return;
  if (existsSync(flagValue)) return;
  const identityArgs = sidecar ?? { id: "unknown", description: "(identity sidecar missing)", subagentType: "general-purpose", startedAt: "", cwd: "" };
  const { status: outcome, text } = lastAssistantOutcome(getBranch);
  const header = [
    `agent: ${identityArgs.id}`,
    `description: ${identityArgs.description}`,
    `type: ${identityArgs.subagentType}`,
    identityArgs.model ? `model: ${identityArgs.model}` : undefined,
    `status: ${outcome}`,
    `exit code: unknown (self-recorded at shutdown)`,
    `started: ${identityArgs.startedAt}`,
    `cwd: ${identityArgs.cwd}`,
  ]
    .filter(Boolean)
    .join("\n");
  try {
    mkdirSync(flagValue.slice(0, flagValue.lastIndexOf("/")), { recursive: true });
    writeFileSync(flagValue, `${header}\n---\n${text}\n`);
  } catch {
    // A failed self-record is a missing artifact, nothing more: the parent's
    // fallback or the next restore synthesizes what it can from its own side.
  }
}

// The parent's fallback at finish(): the child writes its artifact at its own
// shutdown, which races the parent noticing the exit; if the file is missing
// now, this side is the only writer left.
export function ensureArtifact(record: EndedRecord): void {
  const path = record.artifactFile;
  if (!path || existsSync(path)) return;
  try {
    mkdirSync(path.slice(0, path.lastIndexOf("/")), { recursive: true });
    writeFileSync(path, artifactContent(record.agent, record.status, record.exitCode, record.finalText));
  } catch {
    // Deliberately swallowed: the notice and entry already carry the capped text.
  }
}

/**
 * Restore-time discovery over one running record: an existing artifact means
 * the child finished after its parent went away. The synthesized record keeps
 * the identity (so resumes stay stable) and marks the text from the artifact.
 */
export function synthesizeFromArtifact(running: RunningRecord): EndedRecord | undefined {
  const path = (running.agent as AgentIdentity & { artifactFile?: string }).artifactFile;
  if (!path || !existsSync(path)) return undefined;
  let text = "";
  let status: EndedRecord["status"] = "completed";
  try {
    const content = readFileSync(path, "utf8");
    // The child's self-recorded header carries its honest outcome; a parent
    // fallback artifact keeps the record's own status via the same header.
    const statusLine = /^[a-z- ]*status: (\w+)$/m.exec(content);
    if (statusLine?.[1] === "stopped" || statusLine?.[1] === "failed") status = statusLine[1];
    text = artifactText(content).trim() || "(artifact present but empty)";
  } catch {
    return undefined;
  }
  return {
    agent: running.agent,
    status,
    pid: running.pid,
    exitCode: null,
    endedAt: new Date().toISOString(),
    finalText: truncateUtf8(text, OUTPUT_CAP_BYTES),
    artifactFile: path,
    artifactDelivered: false,
    restoredFromArtifact: true,
  };
}

/** Reads the identity sidecar the parent wrote before spawning this child. */
export function readIdentitySidecar(path: string | undefined): Parameters<typeof writeSelfArtifact>[1] {
  if (!path) return undefined;
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as NonNullable<Parameters<typeof writeSelfArtifact>[1]>;
    return { ...raw, model: raw.model || undefined };
  } catch {
    return undefined;
  }
}
