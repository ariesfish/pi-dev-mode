// pi/durable.ts — the durable bridge (T-030): background agents as durable
// conversations under pi-durable, owned by anchor tasks, so the parent's death
// parks them at a checkpoint instead of killing them, and the next session that
// reopens the storage resumes them and delivers their answers.
//
// Shape (SPEC-durable-bridge.md): rpc stays for foreground runs; every
// `run_in_background: true` spawn becomes an anchor task + child conversation +
// a Deliver task that submits, waits, and reports each answer through the
// live-session hook. Request ids are the Deliver task's own id, so a resumed
// run never submits twice. ask_parent keeps the T-026 intercom files with a
// deterministic request id, so a rerun reattaches to the pending row.

import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import type { Models } from "@earendil-works/pi-ai";
import { Type } from "typebox";
import {
	AssistantEntry,
	type Conversation,
	type ConversationId,
	configure,
	createRegistry,
	defineDoc,
	defineExtension,
	defineTask,
	defineTool,
	type EntryId,
	type Storage,
	Harness,
	LiveDoc,
	type Tx,
} from "@earendil-works/pi-durable";
import { createBashTool, createEditTool, createReadTool, createWriteTool } from "@earendil-works/pi-durable/tools";
import { NodeExecutionEnv } from "@earendil-works/pi-durable/env/node";

import { SessionState } from "./session-state.ts";
import { awaitReply, PARENT_TIMEOUT_VERDICT, PROGRESS_DELIVERED, requestPath, ASK_PARENT_TIMEOUT_MS, writeRequest } from "./intercom.ts";

// ─── The ledger document: one root conversation, agents keyed by id ──────────

export interface DurableAgentInfo {
	conversationId: string;
	description: string;
	model: string;
	/** The worktree the child was given, if any; kept until the agent is stopped. */
	worktreePath?: string;
	/** Answers already reported to a live session: one answer, one report. */
	reported: EntryId[];
	/** The newest reported answer, for parent-side records after a reopen. */
	lastAnswer?: string;
}

export interface DurableLedger {
	agents: Record<string, DurableAgentInfo>;
}

/** The durable registry of one session's background agents, in the harness's root conversation. */
const Agents = defineDoc<DurableLedger>({
	kind: "pi-dev.durable-agents",
	version: 1,
	scope: "conversation",
	history: "latest",
	// A fork of the ledger conversation starts with no agents.
	fork: "initial",
	initial: () => ({ agents: {} }),
});

// ─── Tasks ───────────────────────────────────────────────────────────────────

/** Background ownership: terminal at once, a boundary the parent's aborts and idle waits do not cross. */
const Anchor = defineTask<null, { phase: "done" }, null>({
	name: "pi-dev.durable-anchor",
	version: 1,
	initial: () => ({ phase: "done" }),
	phases: {
		done: (_anchor, runtime, context) =>
			runtime.commit(() => ({ status: "terminal", outcome: { status: "completed", result: null } }), context),
	},
	abort: (_anchor, runtime, context) =>
		runtime.commit(() => ({ status: "terminal", outcome: { status: "aborted" } }), context),
});

/** How a settled Deliver hands its text to the report phase, and to the live session. */
export interface DeliverReport {
	agentId: string;
	description: string;
	/** "completed" for an answer; "stopped" when the run was aborted; "failed" for everything else. */
	status: "completed" | "stopped" | "failed";
	text: string;
}

// The live-session hook. Set by the bridge at open time; after a crash the next
// process that reopens the storage sets a fresh one, and a report phase that
// reruns in that process reaches the fresh session.
let reportSink: ((report: DeliverReport) => void) | undefined;

/** One background agent's turn: submit a message, wait for it, report the answer. */
const Deliver = defineTask<
	{ agentId: string; conversationId: ConversationId; message: string; steer: boolean },
	{ phase: "deliver" } | { phase: "report"; report?: DeliverReport },
	null
>({
	name: "pi-dev.durable-deliver",
	version: 1,
	initial: () => ({ phase: "deliver" }),
	phases: {
		// Send the message, wait for its answer, and record what to report.
		deliver: async (task, runtime, context) => {
			const { agentId, conversationId, message, steer } = task.input;
			const child = (await runtime.conversation(conversationId, context))!;
			const submission = await child.submit(
				// The task's own id is the request id: a resumed task finds its
				// submission again instead of submitting a second time.
				{ type: "input", content: message, whenBusy: steer ? "steer" : "followUp", requestId: `pi-dev-deliver:${task.id}` },
				context,
			);
			const settled = await submission.wait(context);
			// One commit decides the report and records the answer as reported,
			// so a restart does not decide it twice.
			await runtime.commit(async (tx) => {
				const next = (report: DeliverReport) => ({ status: "running" as const, checkpoint: { phase: "report" as const, report } });
				const info = (await tx.doc(Agents, runtime.conversationId)).agents[agentId];
				if (info === undefined) {
					return next({ agentId, description: "(unknown agent)", status: "failed", text: `durable agent ${agentId} lost from the ledger` });
				}
				if (settled.status === "unanswered") {
					const text = settled.reason === "aborted" ? "(stopped before it replied)" : `failed: ${settled.reason}`;
					return next({ agentId, description: info.description, status: settled.reason === "aborted" ? "stopped" : "failed", text });
				}
				if (settled.type !== "input") return next({ agentId, description: info.description, status: "failed", text: "(no answer)" });
				if (info.reported.includes(settled.answer)) {
					return next({ agentId, description: info.description, status: "completed", text: "" });
				}
				info.reported.push(settled.answer);
				const answer = (await tx.entry(AssistantEntry, settled.answer))?.model?.[0];
				const text =
					(answer?.content ?? []).flatMap((part) => (part.type === "text" ? [part.text] : [])).join("") || "(no reply text)";
				info.lastAnswer = text;
				return next({ agentId, description: info.description, status: "completed", text });
			}, context);
		},
		// Hand the report to the live session — the only phase with a footprint
		// outside storage, so it runs last, after everything durable is committed.
		report: async (task, runtime, context) => {
			const report = task.state.checkpoint.report;
			if (report !== undefined && report.text !== "" && reportSink !== undefined) {
				try {
					reportSink(report);
				} catch {
					// A failing sink must not park the task: the report is
					// committed, and the parent's record layer decides.
				}
			}
			await runtime.commit(() => ({ status: "terminal", outcome: { status: "completed", result: null } }), context);
		},
	},
	abort: (_task, runtime, context) =>
		runtime.commit(() => ({ status: "terminal", outcome: { status: "aborted" } }), context),
});

// ─── Child tools: coding tools + the ask_parent bridge ──────────────────────

const read = createReadTool();
const write = createWriteTool();
const edit = createEditTool();
const bashTool = createBashTool();

/** The channel directory for ask_parent rows, set by the bridge before any child runs. */
let askChannel: string | undefined;

// Deterministic per (agent, question): a rerun of this tool after a crash finds
// the same pending row and waits on the same answer instead of stacking rows.
const askId = (from: string, reason: string, message: string, options: string[] | undefined) =>
	`d${createHash("sha256").update(`${from}\0${reason}\0${message}\0${options?.join("\0") ?? ""}`).digest("hex").slice(0, 24)}`;

// The child side of T-026's intercom, as a durable tool: the channel protocol
// (row shape, paths, poll loop, verdicts) is intercom.ts's; this tool adds
// only what a durable rerun needs — the deterministic request id.
const askParentTool = defineTool({
	name: "ask_parent",
	description:
		"Ask this session's parent one question (need_decision) or report progress (progress_update). You block until the parent answers or the 30-minute cap; on no answer, decide on your own and say so.",
	parameters: Type.Object(
		{
			reason: Type.Union([Type.Literal("need_decision"), Type.Literal("progress_update")]),
			message: Type.String(),
			options: Type.Optional(Type.Array(Type.String(), { maxItems: 4 })),
		},
		{ additionalProperties: false },
	),
	// A rerun after a crash finds the same row again: no second row, no second ask.
	replay: "safe",
	async execute(args) {
		const channel = askChannel ?? "";
		const from = "durable-child";
		const row = {
			id: askId(from, args.reason, args.message, args.options),
			from,
			fromDescription: "durable background agent",
			reason: args.reason,
			message: args.message,
			...(args.options ? { options: args.options } : {}),
			createdAt: Date.now(),
		};
		// A rerun may find its old row; never rewrite a fresher one.
		if (!existsSync(requestPath(channel, row.id))) writeRequest(channel, row);
		if (args.reason === "progress_update") return { content: [{ type: "text" as const, text: PROGRESS_DELIVERED }] };
		const reply = await awaitReply(channel, row.id, row.createdAt + ASK_PARENT_TIMEOUT_MS);
		if (reply !== undefined) return { content: [{ type: "text" as const, text: `The parent answered: ${reply}` }] };
		return { content: [{ type: "text" as const, text: PARENT_TIMEOUT_VERDICT }], isError: true };
	},
});

/** Everything a durable child conversation runs with: the coding tools, ask_parent, no agent tool. */
const ChildExtension = defineExtension({
	name: "pi-dev-child",
	tools: [read, write, edit, bashTool, askParentTool],
	tasks: [Anchor, Deliver],
});

/** A background task of the ledger conversation: its Esc and idle waits leave it alone. */
const background = { ownership: { kind: "conversation" as const }, background: true } as const;

export interface DurableSpawn {
	agentId: string;
	description: string;
	/** Resolved "provider/model-id". */
	model: string;
	readonly: boolean;
	/** The lean child prompt: identity, task, output contract (spec D4). */
	instructions: string;
	/** First message: the task itself. */
	prompt: string;
	cwd: string;
	worktreePath?: string;
}

const splitModel = (model: string): { provider: string; modelId: string } => {
	const slash = model.indexOf("/");
	if (slash <= 0 || slash === model.length - 1) throw new Error(`Model "${model}" must be "provider/model-id".`);
	return { provider: model.slice(0, slash), modelId: model.slice(slash + 1) };
};

/**
 * One session's durable harness: its sqlite, model mirror, and tasks (spec
 * D1-D3). Opening may fail (dependency missing, storage busy); the caller then
 * falls back to rpc children and says so.
 */
export class DurableBridge {
	private constructor(
		private readonly harness: Harness,
		private readonly rootConversation: Conversation,
	) {}

	get rootId(): ConversationId {
		return this.rootConversation.id;
	}

	static async open(state: SessionState, models: Models): Promise<DurableBridge | undefined> {
		try {
			askChannel = state.intercom;
			mkdirSync(state.root, { recursive: true });
			const { openNodeSqliteStorage } = await import("@earendil-works/pi-durable/storage/sqlite/node");
			return await DurableBridge.openOver(await openNodeSqliteStorage(state.durableSqlite), models);
		} catch {
			// Honest degradation (spec D2): the bridge closes itself, and the
			// caller's background spawn falls back to rpc.
			return undefined;
		}
	}

	/** The once-thrice open ceremony: registry, harness, root. The callers
	 *  differ only in where their storage came from and what failure means. */
	private static async openOver(storage: Storage, models: Models): Promise<DurableBridge> {
		const registry = createRegistry();
		registry.install(ChildExtension);
		const harness = await Harness.open(
			storage,
			{ models, registry, env: ({ cwd }) => new NodeExecutionEnv({ cwd: cwd ?? process.cwd() }) },
			BACKGROUND_CONTEXT,
		);
		const root = await harness.root(BACKGROUND_CONTEXT);
		return new DurableBridge(harness, root);
	}

	/** The live session registers here; durable reports reach it as they settle. */
	onReport(sink: (report: DeliverReport) => void): void {
		reportSink = sink;
	}

	/** Opens over a caller-owned storage instance (tests; no catch, no mkdir). */
	static async fromStorage(storage: Storage, models: Models, channel: string): Promise<DurableBridge> {
		askChannel = channel;
		return DurableBridge.openOver(storage, models);
	}

	/** Every background agent this storage still knows (restart rep). */
	async agents(): Promise<DurableLedger["agents"]> {
		const ledger = await this.read(async (tx) => {
			const draft = await tx.doc(Agents, this.rootId);
			// A plain copy: the commit's return value is strict JSON, and a
			// draft is a live handle.
			return { agents: Object.fromEntries(Object.entries(draft.agents).map(([id, info]) => [id, { ...info, reported: [...info.reported] }])) } satisfies DurableLedger;
		});
		return ledger?.agents ?? {};
	}

	private async info(agentId: string): Promise<DurableAgentInfo> {
		const agents = await this.agents();
		const info = agents[agentId];
		if (info === undefined) throw new Error(`No durable agent "${agentId}" in this session's storage.`);
		return info;
	}

	async busy(agentId: string): Promise<boolean> {
		const info = await this.info(agentId);
		const run = await this.read(async (tx) => (await tx.doc(LiveDoc, info.conversationId as ConversationId))?.run !== undefined);
		return run === true;
	}

	async spawn(spawn: DurableSpawn): Promise<void> {
		await this.rootConversation.commit(async (tx) => {
			const ledger = await tx.doc(Agents, this.rootId);
			if (ledger.agents[spawn.agentId] !== undefined) throw new Error(`Durable agent "${spawn.agentId}" already exists.`);
			const anchor = await tx.createTask(Anchor, null, background);
			const child = await tx.createConversation({ ownership: { kind: "task", taskId: anchor } });
			await configure(tx, child.id, {
				model: splitModel(spawn.model),
				...(spawn.readonly ? { tools: { remove: [edit, write] } } : {}),
				instructions: spawn.instructions,
				cwd: spawn.cwd,
			});
			ledger.agents[spawn.agentId] = {
				conversationId: child.id,
				description: spawn.description,
				model: spawn.model,
				...(spawn.worktreePath !== undefined ? { worktreePath: spawn.worktreePath } : {}),
				reported: [],
			};
			await tx.createTask(
				Deliver,
				{ agentId: spawn.agentId, conversationId: child.id, message: spawn.prompt, steer: false },
				background,
			);
			return null;
		}, BACKGROUND_CONTEXT);
		this.harness.resume();
	}

	/** A message to a durable agent: a steer mid-run, a new turn when idle. */
	async send(agentId: string, message: string): Promise<{ steered: boolean }> {
		const info = await this.info(agentId);
		const steered = await this.busy(agentId);
		await this.rootConversation.commit(
			(tx) =>
				tx.createTask(
					Deliver,
					{ agentId, conversationId: info.conversationId as ConversationId, message, steer: steered },
					background,
				),
			BACKGROUND_CONTEXT,
		).then(() => null);
		this.harness.resume();
		return { steered };
	}

	/** Aborts the agent's current work; its Deliver reports "stopped" through the hook. */
	async stop(agentId: string): Promise<void> {
		const info = await this.info(agentId);
		const conversation = await this.harness.conversation(info.conversationId as ConversationId, BACKGROUND_CONTEXT);
		await conversation?.abort(BACKGROUND_CONTEXT);
	}

	/** Settles when the agent's conversation is idle: its current work is done. */
	async waitIdle(agentId: string): Promise<void> {
		const info = await this.info(agentId);
		const conversation = await this.harness.conversation(info.conversationId as ConversationId, BACKGROUND_CONTEXT);
		if (conversation) await conversation.waitForIdle(BACKGROUND_CONTEXT);
	}

	/** The newest reported answer, for parent-side records after a reopen. */
	async lastAnswer(agentId: string): Promise<string | undefined> {
		return (await this.info(agentId)).lastAnswer;
	}

	/** Parked tasks resume: behind every spawn and send, and after a reopen. */
	resume(): void {
		this.harness.resume();
	}

	/** Graceful park: work in flight is written back pending, uncounted as crashes. */
	close(): Promise<void> {
		return this.harness.close(BACKGROUND_CONTEXT);
	}

	// The root conversation is a ledger, never a model conversation: reads and
	// writes go through commits on its own line.
	private async read<T>(fn: (tx: Tx) => Promise<T> | T): Promise<T | undefined> {
		return this.rootConversation.commit(fn, BACKGROUND_CONTEXT);
	}
}

/** Durable agent ids start with "d", rpc ids with "a": a record says which way it runs. */
export function newDurableAgentId(): string {
	return `d${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

/** Opens a durable bridge: over in-memory storage by default, or over the
 * storage instance a test hands in (the reopen pattern). Tests, never sessions. */
export async function openTestBridge(models: Models, storage?: { new (): Storage } | Storage): Promise<DurableBridge> {
	const { MemoryStorage } = await import("@earendil-works/pi-durable/storage/memory");
	const store: Storage =
		storage === undefined ? new MemoryStorage() : typeof storage === "function" ? new storage() : storage;
	return DurableBridge.openOver(store, models);
}
