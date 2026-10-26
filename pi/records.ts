// pi/records.ts — the record layer's domain: what an agent run is once it is
// persisted. No process, no child, no durable leg: the five consumers that
// only need to name a record (agent-text, batch, status, artifacts, durable
// engine) import from here, so naming a record no longer loads the spawner.
import { type Static, Type } from "typebox";

import { worktreeSchema } from "./worktree.ts";

export const ENTRY_TYPE = "pi-dev-agents";

const endedStatus = Type.Union([Type.Literal("completed"), Type.Literal("failed"), Type.Literal("stopped")]);
export type EndedStatus = Static<typeof endedStatus>;

// Fixed when the agent starts and reused by every launch of it, so a resume
// runs the same session, model, thinking, system prompt, and worktree.
export const identitySchema = Type.Object({
  id: Type.String(),
  description: Type.String(),
  subagentType: Type.String(),
  model: Type.Optional(Type.String()),
  thinking: Type.Optional(Type.String()),
  readonly: Type.Optional(Type.Literal(true)),
  // Pi's own rule for a session id (assertValidSessionId): a resume passes it
  // to pi as an argument, so an empty or odd value must not load.
  sessionId: Type.String({ pattern: "^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$" }),
  sessionDir: Type.String(),
  systemPromptFile: Type.Optional(Type.String()),
  cwd: Type.String(),
  worktree: Type.Optional(worktreeSchema),
  // Where this run's durable artifact lands; the child writes it at its own
  // shutdown, the parent only falls back when the child died first.
  artifactFile: Type.Optional(Type.String()),
  startedAt: Type.String(),
  // T-030: this run lives in the session's durable bridge (pi-durable
  // conversation), not an rpc child process — set on every durable record.
  durable: Type.Optional(Type.Literal(true)),
  // The durable conversation this agent is; lets a send after its end reuse
  // the same conversation instead of relaunching a fresh rpc child.
  durableConversation: Type.Optional(Type.String()),
  // The lean prompt a durable child runs with (spec D4).
  instructions: Type.Optional(Type.String()),
});
export const runningSchema = Type.Object({
  agent: identitySchema,
  status: Type.Literal("running"),
  pid: Type.Optional(Type.Number()),
  // Restores re-notify only background runs: the flag rides the running
  // record too, because the parent may die before the run ever finishes.
  background: Type.Optional(Type.Boolean()),
  // When that pid started, as the system reports it. A pid can be reused; a
  // pid with its start time names one process. Absent when it could not be
  // read, and on a record an earlier version wrote.
  pidStart: Type.Optional(Type.String()),
  // The pi process that launched it. Only that process may reap it.
  parentPid: Type.Number(),
});
export const endedSchema = Type.Object({
  agent: identitySchema,
  status: endedStatus,
  pid: Type.Optional(Type.Number()),
  exitCode: Type.Union([Type.Number(), Type.Null()]),
  endedAt: Type.String(),
  finalText: Type.String(),
  outputFile: Type.Optional(Type.String()),
  artifactFile: Type.Optional(Type.String()),
  // The background notice has been delivered into a live session.
  artifactDelivered: Type.Optional(Type.Boolean()),
  // Restores synthesized this end from an on-disk artifact the child wrote
  // after its parent went away.
  restoredFromArtifact: Type.Optional(Type.Boolean()),
  // How the run was launched: only background runs re-notify on restore.
  background: Type.Optional(Type.Boolean()),
  worktreeKept: Type.Optional(Type.Boolean()),
});
// Persisted as a session entry, last write per agent id wins.
export const recordSchema = Type.Union([runningSchema, endedSchema]);

export type AgentIdentity = Static<typeof identitySchema>;
export type RunningRecord = Static<typeof runningSchema>;
export type EndedRecord = Static<typeof endedSchema>;
export type AgentRecord = Static<typeof recordSchema>;
