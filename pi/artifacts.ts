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

/** The text a record keeps: capped, with the full copy on disk when it was cut. */
export function saveOutput(identity: AgentIdentity, text: string): Pick<EndedRecord, "finalText" | "outputFile"> {
  const capped = truncateUtf8(text, OUTPUT_CAP_BYTES);
  if (capped === text) return { finalText: text };
  const outputFile = join(identity.sessionDir, `${identity.id}.${Date.now()}.out.md`);
  try {
    writeFileSync(outputFile, text);
    return { finalText: capped, outputFile };
  } catch (e) {
    return { finalText: `${capped}\n\n(full output not saved: ${(e as Error).message})` };
  }
}

/** The header field list every artifact writer prints — one source for both
 *  sides (the parent's fallback record and the child's self-record). */
function artifactHeadFields(identity: AgentIdentity, status: string, exitCodeLine: string): string[] {
  const lines = [
    `agent: ${identity.id}`,
    `description: ${identity.description}`,
    `type: ${identity.subagentType}`,
    identity.model ? `model: ${identity.model}` : undefined,
    `status: ${status}`,
    exitCodeLine,
    `started: ${identity.startedAt}`,
    `cwd: ${identity.cwd}`,
    identity.worktree ? `worktree: ${identity.worktree.path}` : undefined,
  ];
  return lines.filter((l): l is string => l !== undefined);
}

/** The artifact's header: field list, one line each. */
export function artifactHeader(identity: AgentIdentity, status: string, exitCode: number | null): string {
  return artifactHeadFields(identity, status, `exit code: ${exitCode ?? "unknown"}`).join("\n");
}

/** The artifact's full content: metadata header, rule, then the complete final text. */
export function artifactContent(identity: AgentIdentity, status: string, exitCode: number | null, finalText: string): string {
  return `${artifactHeader(identity, status, exitCode)}\n---\n${finalText}\n`;
}

/** Reads an artifact whole: header fields parsed once, payload under the rule.
 *  The read side of the write paired in artifactContent — head lists only one
 *  source above, and this is the only parser (the restore path's regex is gone). */
export function readArtifact(content: string): { fields: Record<string, string>; text: string } {
  const i = content.indexOf("\n---\n");
  const fields: Record<string, string> = {};
  for (const line of (i === -1 ? content : content.slice(0, i)).split("\n")) {
    const m = /^([a-z ]+): (.*)$/.exec(line);
    if (m) fields[m[1]] = m[2];
  }
  return { fields, text: i === -1 ? content : content.slice(i + 5) };
}

/** Reads only the payload under the header rule, for restored notices. */
export function artifactText(content: string): string {
  return readArtifact(content).text;
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
  try {
    writeArtifactFile(
      flagValue,
      artifactHeadFields(identityArgs, outcome, `exit code: unknown (self-recorded at shutdown)`),
      text,
    );
  } catch {
    // A failed self-record is a missing artifact, nothing more: the parent's
    // fallback or the next restore synthesizes what it can from its own side.
  }
}

/** One write ritual for both writers: mkdir, header, rule, payload. */
function writeArtifactFile(file: string, fields: string[], text: string): void {
  mkdirSync(file.slice(0, file.lastIndexOf("/")), { recursive: true });
  writeFileSync(file, `${fields.join("\n")}\n---\n${text}\n`);
}

// The parent's fallback at finish(): the child writes its artifact at its own
// shutdown, which races the parent noticing the exit; if the file is missing
// now, this side is the only writer left.
export function ensureArtifact(record: EndedRecord): void {
  const path = record.artifactFile;
  if (!path || existsSync(path)) return;
  try {
    writeArtifactFile(path, artifactHeadFields(record.agent, record.status, `exit code: ${record.exitCode ?? "unknown"}`), record.finalText);
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
    const { fields, text: payload } = readArtifact(readFileSync(path, "utf8"));
    // The child's self-recorded header carries its honest outcome; a parent
    // fallback artifact keeps the record's own status via the same header.
    if (fields["status"] === "stopped" || fields["status"] === "failed") status = fields["status"];
    text = payload.trim() || "(artifact present but empty)";
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
