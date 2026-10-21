// pi/durable-engine.ts — the durable execution leg of running agents
// (T-030), lifted out of AgentRunner: ONE home for the bridge lifecycle (one
// open attempt per session, honest rpc fallback), the durable settle
// bookkeeping (one resolver per agent id — spawn failures, settled reports,
// stops, resumes all release through it), and the bridge's spawn/send/stop
// flows. AgentRunner keeps the record layer (states, entries, notices,
// restore discovery) and hands this engine the hooks it needs.
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import type { AgentParams } from "./agent-tools.ts";
import { ensureArtifact, saveOutput } from "./artifacts.ts";
import { GENERAL_PURPOSE, type Settings } from "./config.ts";
import { DurableBridge, newDurableAgentId, type DeliverReport } from "./durable.ts";
import { RegistryModels } from "./durable-models.ts";
import type { AgentIdentity, AgentRecord, AgentState, DurableAgent, EndedRecord, RunningRecord } from "./agents.ts";
import type { SessionState } from "./session-state.ts";
import { ensureWorktree, planWorktree, settleGuarded } from "./worktree.ts";

/** What the record layer does for an execution this engine drives. */
export interface DurableHooks {
  /** The states map: where a live state or an ended record lives. */
  get(id: string): AgentState | undefined;
  set(id: string, state: AgentState): void;
  /** Persists a record as a session entry. */
  persist(record: AgentRecord): void;
  /** Delivers the completion notice of an ended record. */
  deliver(record: EndedRecord, triggerTurn: boolean): void;
  /** The rpc leg, for the honest fallback when the bridge cannot open. */
  rpcLaunch(identity: AgentIdentity, prompt: string, background: boolean): void;
  /** The rpc run an earlier fallback left under this id, if any. */
  localRun(id: string): { done: Promise<EndedRecord> } | undefined;
}

const now = () => new Date().toISOString();

export class DurableEngine {
  // The session's bridge: one open attempt; a failed one turns the bridge
  // off for the session and background spawns fall back to rpc children.
  private bridge?: Promise<DurableBridge | undefined>;
  private bridgeOff = false;
  // One live settle resolver per durable agent: reports, stops, teardown,
  // and resumes all release the waiting side through here.
  private readonly settles = new Map<string, (record: EndedRecord) => void>();
  // The newest registry any context handed over; bridge opens after a
  // restore use it when spawn did not open one first.
  private latestRegistry: unknown;

  constructor(
    private readonly pi: ExtensionAPI,
    private readonly settings: Settings,
    private readonly hooks: DurableHooks,
  ) {}

  /** Registers a settle waiter for an agent id; whoever ends the run releases it. */
  trackSettle(id: string): Promise<EndedRecord> {
    let resolve!: (record: EndedRecord) => void;
    const settle = new Promise<EndedRecord>((r) => (resolve = r));
    this.settles.set(id, resolve);
    return settle;
  }

  // ── spawn ───────────────────────────────────────────────────────────────

  /**
   * The durable leg of a background start (spec D2): builds the durable
   * identity and a durable state whose spawn promise tries the bridge and,
   * when the bridge cannot open, falls back to an rpc launch under the same
   * id. Undefined means this leg declines (worktree planning failed) and the
   * caller goes rpc. The caller registers and persists the record.
   */
  begin(
    state: SessionState,
    spec: { params: AgentParams; def: { model?: string; body?: string; effort?: string }; model: string; background: boolean },
    registry: unknown,
  ): { record: RunningRecord; spawn: Promise<void>; settle: Promise<EndedRecord> } | undefined {
    if (this.bridgeOff) return undefined;
    const { params, def, model, background } = spec;
    const id = newDurableAgentId();
    mkdirSync(state.agents, { recursive: true });
    let worktree;
    try {
      worktree = params.isolation === "worktree" ? planWorktree(process.cwd(), id) : undefined;
      if (worktree) ensureWorktree(worktree);
    } catch {
      return undefined; // the rpc leg reports plan/ensure failures honestly
    }
    // The lean prompt (spec D4): the agent-type body plus the child contract.
    const instructions = [
      def.body || "You are a background child agent of a pi coding session: work the task yourself, then reply.",
      "You work durably: your conversation survives restarts. You may call ask_parent once for the one decision that blocks you; otherwise decide on your own and say so. Reply concisely in the user's language when the task is done; your final reply is what the parent reads.",
    ].join("\n\n");
    const identity: AgentIdentity = {
      id,
      description: params.description,
      subagentType: params.subagent_type || GENERAL_PURPOSE,
      model,
      thinking: def.effort ?? this.pi.getThinkingLevel(),
      readonly: params.readonly || undefined,
      // The durable conversation is the real session; this field only has to
      // satisfy the session-id shape the records share with rpc runs.
      sessionId: randomUUID(),
      sessionDir: state.agents,
      cwd: worktree?.path ?? process.cwd(),
      worktree,
      artifactFile: state.artifactFile(id, params.output),
      startedAt: now(),
      durable: true,
      instructions,
    };
    const settle = this.trackSettle(id);
    const spawn = (async () => {
      const bridge = await this.ensure(state, registry);
      if (bridge === undefined) {
        // Honest fallback (spec D2): the rpc launch registers a local run
        // under the same id, so the settle promise resolves through it.
        this.hooks.rpcLaunch({ ...identity, durable: undefined }, params.prompt!, background);
        const run = this.hooks.localRun(id);
        if (run) void run.done.then((record) => this.settles.get(id)?.(record));
        return;
      }
      await bridge.spawn({
        agentId: id,
        description: params.description,
        model,
        readonly: params.readonly === true,
        instructions,
        prompt: params.prompt!,
        cwd: identity.cwd,
        worktreePath: worktree?.path,
      });
    })();
    return { record: { agent: identity, status: "running", parentPid: process.pid, background: true }, spawn: this.spawnGuard(id, identity, spawn), settle };
  }

  // A spawn leg that dies without launching anything (bridge threw, rpc
  // launch threw) must end honestly, not vanish: the tool already showed the
  // agent id, so the record and a failure notice are owed.
  private spawnGuard(id: string, identity: AgentIdentity, spawn: Promise<void>): Promise<void> {
    return spawn.catch(() => {
      if (this.hooks.get(id)?.kind !== "durable") return;
      const failed: EndedRecord = {
        agent: identity,
        status: "failed",
        exitCode: null,
        endedAt: now(),
        artifactFile: identity.artifactFile,
        background: true,
        ...saveOutput(identity, "(durable spawn failed before it ran; the rpc fallback did not start either)"),
      };
      ensureArtifact(failed);
      this.finishDurable(id, failed, true);
    });
  }

  /** Builds the ended record of a settled durable run and settles the waiter. */
  settleDurable(state: DurableAgent, status: EndedRecord["status"], text: string): void {
    const identity = state.record.agent;
    const record: EndedRecord = {
      agent: identity,
      status,
      exitCode: null,
      endedAt: now(),
      artifactFile: identity.artifactFile,
      background: true,
      ...(status === "stopped" && identity.worktree ? settleGuarded(identity.worktree) : {}),
      ...saveOutput(identity, text),
    };
    ensureArtifact(record);
    this.settles.get(identity.id)?.(record);
    this.settles.delete(identity.id);
    // A stop this process asked for joins without a notice; every other end
    // (or a stop it did not ask for) notices, once.
    this.finishDurable(identity.id, record, (state.ending ?? "stopped") !== "stopped" || status !== "stopped");
  }

  /** Records the end, notifies when owed, and persists the delivery mark. */
  private finishDurable(id: string, record: EndedRecord, notify: boolean): void {
    this.hooks.set(id, { kind: "ended", record });
    this.hooks.persist(record);
    if (notify) {
      this.hooks.deliver(record, record.status !== "stopped");
      this.hooks.persist({ ...record, artifactDelivered: true });
    }
  }

  // ── reports / settle ────────────────────────────────────────────────────

  /** A durable run settled: record it, artifact it, notice it unless this
   *  process asked for the end itself. */
  onReport(report: DeliverReport): void {
    const state = this.hooks.get(report.agentId);
    if (state?.kind !== "durable") return;
    this.settleDurable(state, report.status, report.text);
  }

  /** The settle of a durable state — or of the rpc run a fallback swapped in. */
  async settleOf(state: DurableAgent): Promise<EndedRecord> {
    await state.spawn;
    const swapped = this.hooks.get(state.record.agent.id);
    if (swapped?.kind === "local") return this.hooks.localRun(swapped.record.agent.id)!.done;
    return state.settle;
  }

  // ── send / stop ─────────────────────────────────────────────────────────

  /** A message to a durable agent over the bridge: a steer mid-run, a new
   *  turn when idle. Undefined when no bridge (the caller reports honestly). */
  async send(state: SessionState, id: string, message: string): Promise<{ steered: boolean } | undefined> {
    const bridge = await this.ensure(state, this.latestRegistry);
    return bridge ? await bridge.send(id, message) : undefined;
  }

  /** Stops a durable run and returns its ended record (spec: only this
   *  process's bridge may stop it; its settled answer is the final text). */
  async stop(state: DurableAgent, session: SessionState, ending: "stopped" | "teardown"): Promise<EndedRecord> {
    const id = state.record.agent.id;
    state.ending = state.ending === "teardown" ? "teardown" : ending;
    const bridge = await this.ensure(session, this.latestRegistry);
    if (bridge === undefined) {
      // No bridge and no report: an honest stopped record from what is known.
      this.settleDurable(state, "stopped", "(stopped; its durable bridge is unavailable)");
    } else {
      await bridge.stop(id);
      await bridge.waitIdle(id);
      const answer = (await bridge.lastAnswer(id)) ?? "(stopped before it replied)";
      // The abort handler ends the Deliver task without a report phase;
      // this process owns the end, so no notice follows for "stopped".
      const after = this.hooks.get(id);
      if (after?.kind === "durable") this.settleDurable(after, "stopped", answer);
    }
    const record = this.hooks.get(id);
    if (record?.kind !== "ended") {
      throw new Error(`Durable agent ${id} did not settle on stop; its record is ${record?.kind ?? "missing"}.`);
    }
    return record.record;
  }

  /** Session teardown parks the bridge: work in flight is written back
   *  pending, uncounted as crashes, and a reopened session resumes it. */
  park(): void {
    void this.bridge?.then((bridge) => void bridge?.close());
  }

  // ── restore ─────────────────────────────────────────────────────────────

  /** A restore reattaches a durable agent to the reopened bridge: its
   *  storage is the truth, and any answer that settled while nobody watched
   *  is delivered now, once (spec D6). */
  async reattach(state: DurableAgent, session: SessionState, registry?: unknown): Promise<void> {
    const { agent, id } = { agent: state.record.agent, id: state.record.agent.id };
    const bridge = await this.ensure(session, registry);
    if (bridge === undefined) {
      if (this.hooks.get(id) === state) this.settleDurable(state, "stopped", "(durable bridge unavailable after restore)");
      return;
    }
    const info = (await bridge.agents().catch(() => undefined))?.[id];
    if (info === undefined) {
      if (this.hooks.get(id) === state) this.settleDurable(state, "stopped", "(no durable record of this agent in the session storage)");
      return;
    }
    state.record = { ...state.record, agent: { ...agent, durableConversation: info.conversationId } };
    bridge.resume();
    if (this.hooks.get(id) !== state) return;
    if (await bridge.busy(id).catch(() => false)) return; // still running: its Deliver reports when it settles
    // Idle with the record still running: the answer settled while this
    // process was away. Re-deliver it once from the ledger.
    const answer = (await bridge.lastAnswer(id).catch(() => undefined)) ?? "(stopped while its parent was away)";
    this.settleDurable(state, "completed", answer);
  }

  // ── bridge ──────────────────────────────────────────────────────────────

  /** One bridge per session over the session's state; a failed open never
   *  retries, so a broken dependency costs one attempt. */
  ensure(state: SessionState, registry: unknown): Promise<DurableBridge | undefined> {
    if (registry instanceof Object) this.latestRegistry = registry;
    if (this.bridgeOff) return Promise.resolve(undefined);
    if (!(this.latestRegistry instanceof Object)) {
      this.bridgeOff = true;
      return Promise.resolve(undefined);
    }
    this.bridge ??= DurableBridge.open(state, new RegistryModels(this.latestRegistry as never)).then(
      (bridge) => {
        if (bridge === undefined) this.bridgeOff = true;
        else bridge.onReport((report) => this.onReport(report));
        return bridge;
      },
      () => {
        this.bridgeOff = true;
        return undefined;
      },
    );
    return this.bridge;
  }
}
