import { randomBytes, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI, ExtensionContext, SessionEntry } from "@earendil-works/pi-coding-agent";
import { type Static, Type } from "typebox";
import { Value } from "typebox/value";

import { ensureArtifact, saveOutput, synthesizeFromArtifact } from "./artifacts.ts";
import { INTERCOM_FLAG } from "./intercom.ts";
import { noticeOf, OUTPUT_CAP_BYTES, truncateUtf8 } from "./agent-text.ts";
import type { AgentParams } from "./agent-tools.ts";
import { type ChildExit, PiChild } from "./child.ts";
import { fateOf } from "./fate.ts";
import { ARTIFACT_FLAG, DEPTH_FLAG, GENERAL_PURPOSE, IDENTITY_FLAG, loadAgentTypes, readSheet, resolveModel, type Settings } from "./config.ts";
import { SessionState } from "./session-state.ts";
import { DurableEngine } from "./durable-engine.ts";
import { ensureWorktree, planWorktree, settleGuarded, type Worktree, worktreeSchema } from "./worktree.ts";

const ENTRY_TYPE = "pi-dev-agents";
// Claude Code lets agents nest three layers below the main session and withholds
// the Agent tool at the third.
const MAX_SPAWN_DEPTH = 3;

const endedStatus = Type.Union([Type.Literal("completed"), Type.Literal("failed"), Type.Literal("stopped")]);
type EndedStatus = Static<typeof endedStatus>;

// Fixed when the agent starts and reused by every launch of it, so a resume
// runs the same session, model, thinking, system prompt, and worktree.
const identitySchema = Type.Object({
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
const runningSchema = Type.Object({
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
const endedSchema = Type.Object({
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
const recordSchema = Type.Union([runningSchema, endedSchema]);

type AgentIdentity = Static<typeof identitySchema>;
type RunningRecord = Static<typeof runningSchema>;
export type EndedRecord = Static<typeof endedSchema>;
export type AgentRecord = Static<typeof recordSchema>;

interface Run {
  child: PiChild;
  background: boolean;
  // Set once the run is told to end: the exit code no longer decides the
  // status. teardown means the session is going away, so no notice follows.
  ending?: "stopped" | "teardown";
  done: Promise<EndedRecord>;
}

// A remote agent runs under the live pi process that restore left it to.
type LocalAgent = { kind: "local"; record: RunningRecord; run: Run };
// A durable agent runs as a pi-durable conversation behind the session
// bridge (T-030): no child pid, its lifetime is the storage's, and every
// process that reopens the storage can act on it.
interface DurableAgent {
  kind: "durable";
  record: RunningRecord;
  // Resolves once the spawn attempt committed (or fell back to rpc, which
  // swaps this state for a local one under the same agent id).
  spawn: Promise<void>;
  // Resolves with the EndedRecord when the run settles; durable settles and
  // stop/stopAll resolve it.
  settle: Promise<EndedRecord>;
  ending?: "stopped" | "teardown";
}
// Unverified restores retry identity checks; interrupted ones await termination.
type AgentState = LocalAgent
  | DurableAgent
  | { kind: "remote"; record: RunningRecord }
  | { kind: "unverified"; record: RunningRecord }
  | { kind: "interrupted"; record: RunningRecord }
  | { kind: "ended"; record: EndedRecord };

// How a run ended, from what its process left behind. A run that settled on a
// reply completed, whatever the exit code of the shutdown after it. Stderr
// diagnoses a failure; a stopped child's stderr is not its output (pi warns
// there on every first run of a --session-id).
function outcomeOf(exit: ChildExit, stopped: boolean): { status: EndedStatus; finalText: string } {
  if (stopped) return { status: "stopped", finalText: exit.finalText || "(stopped before it replied)" };
  if (exit.settled && exit.finalText && !exit.errorMessage) return { status: "completed", finalText: exit.finalText };
  const diagnostics = exit.errorMessage || exit.stderr.trim();
  const finalText = exit.finalText && diagnostics ? `${exit.finalText}\n\n${diagnostics}` : exit.finalText || diagnostics || "(no output)";
  return { status: "failed", finalText };
}

function childArgs(identity: AgentIdentity, depth: number, identityFile?: string, channel?: string): string[] {
  const args = ["--mode", "rpc", "--session-id", identity.sessionId, "--session-dir", identity.sessionDir];
  // inherit the parent's no-extensions isolation: a parent started with
  // --no-extensions -e … (dev smoke, staged deploys) must not let children
  // auto-discover packages and double-register the same tools
  const parentArgs = process.argv.slice(2);
  if (parentArgs.some((a) => a === "--no-extensions" || a === "-ne")) args.push("--no-extensions");
  if (identity.model) args.push("--model", identity.model);
  if (identity.thinking) args.push("--thinking", identity.thinking);
  if (identity.systemPromptFile) args.push("--append-system-prompt", identity.systemPromptFile);
  if (identity.artifactFile && identityFile) {
    args.push(`--${ARTIFACT_FLAG}`, identity.artifactFile);
    args.push(`--${IDENTITY_FLAG}`, identityFile);
  }
  if (channel) args.push(`--${INTERCOM_FLAG}`, channel);
  args.push(`--${DEPTH_FLAG}`, String(depth + 1));
  const excluded = [...(identity.readonly ? ["edit", "write"] : []), ...(depth + 1 >= MAX_SPAWN_DEPTH ? ["agent"] : [])];
  if (excluded.length) args.push("--exclude-tools", excluded.join(","));
  return args;
}

// An orphan keeps running by design (T-025): detached in its own process
// group, it finishes, self-writes its artifact, and the next session that
// restores its records discovers the artifact and delivers the notice. Only
// a live parent with a session behind it may stop anything — its fate table
// lives in fate.ts, tested there without a live process.
const now = () => new Date().toISOString();

export class AgentRunner {
  private readonly agents = new Map<string, AgentState>();
  // Set once the session tears its agents down; a launch after that would
  // start a child nothing stops.
  private closed = false;
  // The durable execution leg (T-030): bridge lifecycle, settle bookkeeping,
  // spawn/send/stop behind the bridge. This class keeps the record layer.
  private readonly engine: DurableEngine;

  constructor(
    private readonly pi: ExtensionAPI,
    private readonly settings: Settings,
  ) {
    this.engine = new DurableEngine(pi, settings, {
      get: (id) => this.agents.get(id),
      set: (id, state) => this.agents.set(id, state),
      persist: (record) => this.persist(record),
      deliver: (record, triggerTurn) => this.notify(noticeOf(record), triggerTurn),
      rpcLaunch: (identity, prompt, background) => this.launch(identity, prompt, background),
      localRun: (id) => {
        const state = this.agents.get(id);
        return state?.kind === "local" ? { done: state.run.done } : undefined;
      },
    });
  }

  start(params: AgentParams, ctx: ExtensionContext, hint?: { background: boolean }): RunningRecord {
    const type = params.subagent_type || GENERAL_PURPOSE;
    const types = loadAgentTypes(this.settings);
    const def = types.get(type);
    if (!def) throw new Error(`Unknown subagent_type "${type}". Valid types: ${[...types.keys()].join(", ")}.`);
    const parentModel = ctx.model ? `${ctx.model.provider}/${ctx.model.id}` : undefined;
    const model = resolveModel(params.model ?? def.model, this.settings, readSheet(this.settings.agentDir), parentModel);

    const background = params.run_in_background === true || hint?.background === true;
    const state = new SessionState(this.settings.agentDir, ctx.sessionManager.getSessionId());
    if (background && this.settings.depth === 0 && !this.closed) {
      // Spec D2: background runs behind the durable bridge when it can open —
      // depth 0 only; children of children stay rpc.
      const begun = this.engine.begin(state, { params, def, model, background }, ctx.modelRegistry);
      if (begun) {
        this.agents.set(begun.record.agent.id, { kind: "durable", ...begun });
        this.persist(begun.record);
        return begun.record;
      }
    }

    const id = `a${randomBytes(8).toString("hex")}`;
    mkdirSync(state.agents, { recursive: true });
    const sessionDir = state.agents;
    const systemPromptFile = def.body ? state.promptFile(id) : undefined;
    const worktree = params.isolation === "worktree" ? planWorktree(ctx.cwd, id) : undefined;
    const identity: AgentIdentity = {
      id,
      description: params.description,
      subagentType: type,
      model,
      // Claude Code subagents without an effort run at the session's effort.
      thinking: def.effort ?? this.pi.getThinkingLevel(),
      readonly: params.readonly || undefined,
      sessionId: randomUUID(),
      sessionDir,
      systemPromptFile,
      cwd: worktree?.path ?? ctx.cwd,
      worktree,
      artifactFile: state.artifactFile(id, params.output),
      startedAt: now(),
    };
    return this.launch(identity, params.prompt, background);
  }

  private launch(identity: AgentIdentity, prompt: string, background: boolean): RunningRecord {
    if (this.closed) throw new Error("This session is shutting down; no agent can start.");
    try {
      // First, so a failure here leaves no worktree or branch behind.
      this.ensureSystemPrompt(identity);
      if (identity.worktree) ensureWorktree(identity.worktree);
    } catch (e) {
      const failed: EndedRecord = { agent: identity, status: "failed", exitCode: null, endedAt: now(), finalText: (e as Error).message };
      this.agents.set(identity.id, { kind: "ended", record: failed });
      this.persist(failed);
      throw e;
    }
    const { command, args } = this.settings.pi;
    const identityFile = identity.artifactFile ? this.ensureIdentityFile(identity) : undefined;
    // The intercom channel sits in the parent session's own state directory.
    const channel = SessionState.fromSessionDir(identity.sessionDir).intercom;
    const env = { PI_DEV_AGENT_ID: identity.id, PI_DEV_AGENT_DESCRIPTION: identity.description };
    const child = new PiChild(
      command,
      [...args, "--extension", join(this.settings.pluginRoot, "pi", "index.ts"), "--skill", join(this.settings.pluginRoot, "skills"), ...childArgs(identity, this.settings.depth, identityFile, channel)],
      { cwd: identity.cwd, exitGraceMs: this.settings.exitGraceMs, env },
      prompt,
    );
    const pidStart = child.pid === undefined ? undefined : inspect(child.pid)?.start;
    const record: RunningRecord = { agent: identity, status: "running", pid: child.pid, pidStart, parentPid: process.pid, background: background || undefined };
    const run: Run = { child, background, done: child.exited.then((exit) => this.finish(identity, run, exit)) };
    this.agents.set(identity.id, { kind: "local", record, run });
    this.persist(record);
    return record;
  }

  // Pi appends a path it cannot find as the prompt text itself.
  private ensureSystemPrompt(identity: AgentIdentity): void {
    const file = identity.systemPromptFile;
    if (!file || existsSync(file)) return;
    const body = loadAgentTypes(this.settings).get(identity.subagentType)?.body;
    if (!body) throw new Error(`Agent ${identity.id} has lost its system prompt file, and its type "${identity.subagentType}" no longer provides one.`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, body, { mode: 0o600 });
  }

  private ensureIdentityFile(identity: AgentIdentity): string {
    const file = SessionState.fromSessionDir(identity.sessionDir).identityFile(identity.id);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(
      file,
      JSON.stringify({
        id: identity.id,
        description: identity.description,
        subagentType: identity.subagentType,
        model: identity.model,
        startedAt: identity.startedAt,
        cwd: identity.cwd,
      }),
      { mode: 0o600 },
    );
    return file;
  }

  // Delivers a custom message into this session: background completions and
  // batch notices go through here. triggerTurn starts the next run; a stop
  // notice joins without one.
  notify(text: Parameters<ExtensionAPI["sendMessage"]>[0], triggerTurn = true): void {
    this.pi.sendMessage(text, triggerTurn ? { triggerTurn: true, deliverAs: "steer" } : { triggerTurn: false });
  }

  private finish(identity: AgentIdentity, run: Run, exit: ChildExit): EndedRecord {
    const { status, finalText } = outcomeOf(exit, run.ending !== undefined);
    const worktree = identity.worktree && settleGuarded(identity.worktree);
    // Run.background rides the record: restores re-notify only background runs.
    const record: EndedRecord = {
      agent: identity,
      status,
      pid: run.child.pid,
      exitCode: exit.exitCode,
      endedAt: now(),
      worktreeKept: worktree?.kept,
      artifactFile: identity.artifactFile,
      background: run.background || undefined,
      ...saveOutput(identity, finalText + (worktree?.note ?? "")),
    };
    ensureArtifact(record);
    this.agents.set(identity.id, { kind: "ended", record });
    this.persist(record);
    // The model that called stop_agent already has the result, so a stop's
    // notice joins the context without starting another turn.
    if (run.background && run.ending !== "teardown") {
      this.notify(noticeOf(record), status !== "stopped");
      this.persist({ ...record, artifactDelivered: true });
    }
    return record;
  }

  // The end of the agent's run in flight, or its record when it has ended.
  async wait(id: string): Promise<EndedRecord> {
    const state = this.owned(id);
    if (state.kind === "local") return state.run.done;
    // The durable settle (or the rpc run a fallback swapped in) is the
    // engine's bookkeeping.
    if (state.kind === "durable") return this.engine.settleOf(state);
    return state.record;
  }

  /** Session teardown parks the durable bridge (T-030). */
  parkDurable(): void {
    this.engine.park();
  }

  private locals(): LocalAgent[] {
    return [...this.agents.values()].filter((state): state is LocalAgent => state.kind === "local");
  }

  get busy(): boolean {
    return this.locals().length > 0;
  }
  // Resolves once the first running agent exits, at once when none is running.
  async nextExit(): Promise<void> {
    const locals = this.locals();
    if (locals.length) await Promise.race(locals.map((state) => state.run.done));
  }

  private find(to: string): AgentState {
    const byId = this.agents.get(to);
    if (byId) return this.refreshRestored(byId);
    const states = [...this.agents.values()];
    const matches = states.filter((state) => state.record.agent.description === to);
    if (matches.length === 1) return this.refreshRestored(matches[0]);
    if (matches.length > 1) {
      throw new Error(`"${to}" matches several agents (${matches.map((state) => state.record.agent.id).join(", ")}); pass an agentId.`);
    }
    const known = states.map(({ record }) => `${record.agent.id} (${record.agent.description})`);
    throw new Error(`No agent "${to}". Known agents: ${known.join(", ") || "none"}.`);
  }

  // An agent this process can act on. One running under another pi process is
  // not: only that process holds its stdin and can message or stop it.
  private owned(to: string): Exclude<AgentState, { kind: "remote" | "unverified" | "interrupted" }> {
    const state = this.find(to);
    if (state.kind === "remote") {
      throw new Error(`Agent ${state.record.agent.id} is running under another pi process (pid ${state.record.parentPid}); only that process can message or stop it.`);
    }
    if (state.kind === "unverified" || state.kind === "interrupted") {
      throw new Error(`Agent ${state.record.agent.id}'s previous process (pid ${state.record.pid}) has not exited; it cannot resume or be stopped here until its exit is confirmed.`);
    }
    return state;
  }

  // A running agent takes the message as a steer, after its current tool calls.
  // A finished one, or one that has settled and is exiting, resumes with it,
  // including one that settled just before the steer reached it. A durable
  // run never relaunches: the same conversation takes the next turn (T-030).
  async send(to: string, message: string): Promise<{ record: AgentRecord; running: boolean }> {
    const state = this.owned(to);
    const { id } = state.record.agent;
    if (state.kind === "durable") {
      const sent = await this.engine.send(SessionState.fromSessionDir(state.record.agent.sessionDir), id, message);
      if (sent === undefined) throw new Error(`Agent ${id}'s durable bridge is unavailable; the rpc fallback cannot be messaged mid-run.`);
      if (!sent.steered) {
        // A new turn on the same conversation: back to a running record.
        const fresh: DurableAgent = { kind: "durable", record: state.record, spawn: Promise.resolve(), settle: this.engine.trackSettle(id) };
        this.agents.set(id, fresh);
        this.persist(fresh.record);
      }
      return { record: this.find(id).record, running: true };
    }
    // Another send may have launched a run while this one awaited, so the state
    // is read again after every wait and the launch follows the last read.
    for (let state = this.agents.get(id); state?.kind === "local"; state = this.agents.get(id)) {
      const { run } = state;
      const { response, taken } = await run.child.steer(message);
      if (taken) return { record: this.find(id).record, running: true };
      if (response && !response.success) throw new Error(`Agent ${id} did not take the message: ${response.error}`);
      await run.done;
      if (run.ending) throw new Error(`Agent ${id} was stopped before it read the message; it was not delivered.`);
    }
    // A durable agent that ended keeps its conversation: send reuse beats
    // relaunch (spec D6). Without a bridge, fall back to a fresh rpc run.
    const ended = this.agents.get(id);
    if (ended?.kind === "ended" && ended.record.agent.durable) {
      const sent = await this.engine.send(SessionState.fromSessionDir(ended.record.agent.sessionDir), id, message);
      if (sent !== undefined) {
        const running: DurableAgent = {
          kind: "durable",
          record: { agent: { ...ended.record.agent }, status: "running", parentPid: process.pid, background: true },
          spawn: Promise.resolve(),
          settle: this.engine.trackSettle(id),
        };
        this.agents.set(id, running);
        this.persist(running.record);
        return { record: running.record, running: true };
      }
    }
    return { record: this.launch(this.find(id).record.agent, message, true), running: false };
  }

  async stop(to: string, ending: NonNullable<Run["ending"]> = "stopped"): Promise<EndedRecord> {
    const state = this.owned(to);
    if (state.kind === "ended") return state.record;
    if (state.kind === "durable") {
      return this.engine.stop(state, SessionState.fromSessionDir(state.record.agent.sessionDir), ending);
    }
    const { run } = state;
    if (run.ending !== "teardown") run.ending = ending;
    void run.child.command({ type: "abort" });
    run.child.end(this.settings.killGraceMs);
    return run.done;
  }

  async stopAll(): Promise<void> {
    this.closed = true;
    await Promise.all(this.locals().map((state) => this.stop(state.record.agent.id, "teardown")));
  }

  // For an exit that cannot wait: SIGTERM lets each child pi stop its own agents.
  signalAll(): void {
    this.closed = true;
    for (const { run } of this.locals()) {
      run.ending = "teardown";
      run.child.signal("SIGTERM");
    }
  }

  list(): AgentRecord[] {
    return [...this.agents.values()].map((state) => this.refreshRestored(state).record);
  }

  private persist(record: AgentRecord): void {
    this.pi.appendEntry(ENTRY_TYPE, record);
  }

  private refreshRestored(state: AgentState): AgentState {
    // A durable run is the storage's, not a pid's: nothing to inspect, and
    // the bridge's reattach wake (restore) is its authority.
    if (state.kind === "durable" || state.kind === "local" || state.kind === "ended") return state;
    const { record } = state;
    const fate = fateOf(record);
    if (fate === "kept" && state.kind === "remote") return state;
    if (fate !== "gone") {
      if (state.kind === "interrupted") return state;
      // An interrupted orphan waits only to be seen again: nothing here ends
      // it (only a live parent with a session behind it may stop anything),
      // so the unverified flip is this read's own business.
      const restored: AgentState = { kind: "unverified", record };
      this.agents.set(record.agent.id, restored);
      return restored;
    }
    const stopped: EndedRecord = {
      agent: record.agent,
      status: "stopped",
      pid: record.pid,
      exitCode: null,
      endedAt: now(),
      finalText: "(interrupted: the session that started it ended)",
      background: record.background,
    };
    const ended: AgentState = { kind: "ended", record: stopped };
    this.agents.set(record.agent.id, ended);
    this.persist(stopped);
    return ended;
  }

  restore(entries: readonly SessionEntry[], registry?: unknown): void {
    for (const entry of entries) {
      if (entry.type !== "custom" || entry.customType !== ENTRY_TYPE || !Value.Check(recordSchema, entry.data)) continue;
      const { id } = entry.data.agent;
      if (this.agents.get(id)?.kind === "local") continue;
      // A durable run never had a process to re-inspect: reattach to the
      // bridge (or close honestly when the bridge cannot open).
      if (entry.data.agent.durable === true) {
        if (this.agents.get(id)?.kind === "durable") continue;
        const state: DurableAgent = { kind: "durable", record: entry.data.status === "running" ? entry.data : { ...entry.data, status: "running" }, spawn: Promise.resolve(), settle: this.engine.trackSettle(id) };
        this.agents.set(id, state);
        void this.engine.reattach(state, SessionState.fromSessionDir(state.record.agent.sessionDir), registry);
        continue;
      }
      this.agents.set(id, entry.data.status === "running" ? { kind: "remote", record: entry.data } : { kind: "ended", record: entry.data });
    }
    for (const state of this.agents.values()) this.refreshRestored(state);
    // Discovery (T-025): every restored record that a live session never
    // delivered gets its notice now — a running record whose artifact exists
    // means the child finished after its parent went away; an ended record
    // the interrupts marked "stopped" gets upgraded by its artifact's honest
    // status and text before its one delivery.
    for (const [id, state] of [...this.agents.entries()]) {
      if (state.kind === "local" || state.kind === "durable") continue;
      if (state.kind === "remote" || state.kind === "unverified" || state.kind === "interrupted") {
        const synthesized = synthesizeFromArtifact(state.record);
        if (!synthesized) continue;
        this.agents.set(id, { kind: "ended", record: synthesized });
        this.persist(synthesized);
        this.notify(noticeOf(synthesized), synthesized.status !== "stopped");
        this.persist({ ...synthesized, artifactDelivered: true });
        continue;
      }
      const record = state.record;
      if (record.background && !record.artifactDelivered && !record.restoredFromArtifact) {
        const upgraded = synthesizeFromArtifact(record as RunningRecord) ?? record;
        this.notify(noticeOf(upgraded), upgraded.status !== "stopped");
        const delivered = { ...upgraded, artifactDelivered: true };
        this.agents.set(id, { kind: "ended", record: delivered });
        this.persist(delivered);
      }
    }
  }
}
