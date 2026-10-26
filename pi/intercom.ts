// Supervisor intercom (T-026): a child escalates to its parent session with
// ask_parent (need_decision | progress_update), the request lands as a file
// under the parent's intercom directory, the parent session gets one notice
// and answers with answer_child; the reply file resumes the blocked child.
//
// Channel: plain files, one request one reply, polled at INTERCOM_POLL_MS on
// the child and watched on the parent. Request ids are uuid-shaped and every
// path is built from validated ids, so a reply can only ever land inside the
// channel directory that requested it. A request older than ASK_PARENT_TIMEOUT_MS
// resolves itself with a self-decide instruction, so a lost parent cannot
// zombify a child.
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, watch, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

import type { Settings } from "./config.ts";
import type { Attention } from "./attention.ts";
import { SessionState } from "./session-state.ts";

export type Notify = (message: Parameters<ExtensionAPI["sendMessage"]>[0]) => void;

export const INTERCOM_FLAG = "pi-dev-intercom";
export const ASK_PARENT_TIMEOUT_MS = 30 * 60 * 1000;
const INTERCOM_POLL_MS = 250;

/** What a delivered progress note answers with (both child tools share it). */
export const PROGRESS_DELIVERED = "Progress note delivered to the parent. Continue.";
/** The verdict text when no parent answers within the cap (both child tools share it). */
export const PARENT_TIMEOUT_VERDICT = "No parent answer within 30 minutes. Decide on your own, state that you did, and continue.";

/**
 * The child side of the channel protocol, shared by both ask_parent tools
 * (the rpc child's and the durable child's): poll the reply file until the
 * parent answers or the deadline passes — undefined is the timeout signal.
 */
export async function awaitReply(channel: string, id: string, deadline: number): Promise<string | undefined> {
  for (;;) {
    const reply = readReply(channel, id);
    if (reply !== undefined) return reply;
    if (Date.now() > deadline) return undefined;
    await new Promise((resolve) => setTimeout(resolve, INTERCOM_POLL_MS));
  }
}

export type AskParentReason = "need_decision" | "progress_update";

export interface IntercomRequest {
  id: string;
  /** agentId of the asking child, for answer_child addressing. */
  from: string;
  fromDescription: string;
  reason: AskParentReason;
  message: string;
  options?: string[];
  createdAt: number;
}

const ID_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/;

export function requestPath(dir: string, id: string): string {
  if (!ID_PATTERN.test(id)) throw new Error(`Invalid intercom request id "${id}".`);
  return join(dir, `req-${id}.json`);
}

function replyPath(dir: string, id: string): string {
  if (!ID_PATTERN.test(id)) throw new Error(`Invalid intercom request id "${id}".`);
  return join(dir, `reply-${id}.json`);
}

/** The child's view of one request: file, wait, or a named timeout verdict. */
export function writeRequest(dir: string, req: IntercomRequest): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(requestPath(dir, req.id), JSON.stringify(req), { mode: 0o600 });
}

export function readReply(dir: string, id: string): string | undefined {
  try {
    return JSON.parse(readFileSync(replyPath(dir, id), "utf8")).message as string;
  } catch {
    return undefined;
  }
}

/** Pending requests of one channel, oldest first, stale ones filtered by the caller. */
export function pendingRequests(dir: string, nowMs = Date.now()): { req: IntercomRequest; ageMs: number; stale: boolean }[] {
  const out: { req: IntercomRequest; ageMs: number; stale: boolean }[] = [];
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of names) {
    if (!name.startsWith("req-") || !name.endsWith(".json")) continue;
    try {
      const req = JSON.parse(readFileSync(join(dir, name), "utf8")) as IntercomRequest;
      if (!req.id || !req.from || !req.message || (req.reason !== "need_decision" && req.reason !== "progress_update")) continue;
      const ageMs = nowMs - (req.createdAt ?? nowMs);
      out.push({ req, ageMs, stale: ageMs > ASK_PARENT_TIMEOUT_MS });
    } catch {
      // A half-written or corrupted request is not the parent's to serve.
    }
  }
  return out.sort((a, b) => a.req.createdAt - b.req.createdAt);
}

export function writeReply(dir: string, id: string, message: string): void {
  writeFileSync(replyPath(dir, id), JSON.stringify({ id, message, repliedAt: Date.now() }), { mode: 0o600 });
}

/** The child-side ask_parent tool; wired only when the parent passed this session the channel. */
export function registerAskParent(pi: ExtensionAPI, channel: string): void {
  pi.registerTool({
    name: "ask_parent",
    label: "Ask parent",
    exposure: "model-only",
    description:
      "Ask this session's parent one question (need_decision) or report progress (progress_update). You block until the parent answers or the 30-minute cap; on no answer, decide on your own and say so.",
    parameters: Type.Object(
      {
        reason: Type.Union([Type.Literal("need_decision"), Type.Literal("progress_update")], { description: "need_decision blocks for an answer; progress_update reports and continues" }),
        message: Type.String({ description: "The question or the progress note, in the parent's language" }),
        options: Type.Optional(Type.Array(Type.String(), { maxItems: 4, description: "Candidate answers, if any" })),
      },
      { additionalProperties: false },
    ),
    async execute(_id, params) {
      const req: IntercomRequest = {
        id: randomUUID(),
        from: process.env.PI_DEV_AGENT_ID ?? "unknown-child",
        fromDescription: process.env.PI_DEV_AGENT_DESCRIPTION ?? "(child)",
        reason: params.reason,
        message: params.message,
        ...(params.options ? { options: params.options } : {}),
        createdAt: Date.now(),
      };
      if (params.reason === "progress_update") {
        writeRequest(channel, req);
        return { content: [{ type: "text", text: PROGRESS_DELIVERED }] };
      }
      writeRequest(channel, req);
      const reply = await awaitReply(channel, req.id, req.createdAt + ASK_PARENT_TIMEOUT_MS);
      if (reply !== undefined) return { content: [{ type: "text", text: `The parent answered: ${reply}` }] };
      return { content: [{ type: "text", text: PARENT_TIMEOUT_VERDICT }], isError: true };
    },
  });
}

/** The parent-side answer tool: reply to one pending request of this session's channel. */
export function registerAnswerChild(pi: ExtensionAPI, settings: Settings, attention?: Attention): void {
  const channelOf = (ctx: ExtensionContext) => SessionState.forSession(settings.agentDir, ctx.sessionManager.getSessionId()).intercom;
  pi.registerTool({
    name: "answer_child",
    label: "Answer child",
    exposure: "model-only",
    description:
      "Answer one ask_parent request from this session's child agent: to = the request id from the notice, message = your answer. An empty to lists pending requests with the child that asked.",
    parameters: Type.Object(
      {
        to: Type.Optional(Type.String({ description: "The intercom request id from the notice" })),
        message: Type.String({ description: "The answer the blocked child receives; in the child's language" }),
      },
      { additionalProperties: false },
    ),
    async execute(_id, params, _signal, _onUpdate, ctx) {
      const dir = channelOf(ctx);
      const pending = pendingRequests(dir).filter((p) => !p.stale);
      if (!params.to) {
        const lines = pending.map((p) => `${p.req.id} — ${p.req.from} (${p.req.fromDescription}): ${p.req.message}`);
        return { content: [{ type: "text", text: lines.length ? `Pending child requests:\n${lines.join("\n")}` : "No pending child requests." }] };
      }
      const target = pending.find((p) => p.req.id === params.to || p.req.from === params.to);
      if (!target) {
        return {
          content: [{ type: "text", text: `No pending request "${params.to}". Pending: ${pending.map((p) => p.req.id).join(", ") || "none"}.` }],
          isError: true,
        };
      }
      writeReply(dir, target.req.id, params.message);
      // The child was the one waiting; this record said so. Nothing waits now.
      attention?.askAnswered();
      return { content: [{ type: "text", text: `Answer delivered to ${target.req.from} (${target.req.fromDescription}).` }] };
    },
  });
}

/** The parent-side channel watcher: one notice per new pending request. */
export function watchIntercom(notifyFn: Notify, dir: string): () => void {
  const seen = new Set<string>();
  const announce = () => {
    for (const { req, stale } of pendingRequests(dir)) {
      if (seen.has(req.id) || stale) continue;
      seen.add(req.id);
      const options = req.options?.length ? `\nOptions: ${req.options.join(" / ")}` : "";
      notifyFn({
        customType: "pi-dev-intercom",
        content: `pi-dev child asks${req.reason === "need_decision" ? " for a decision" : ""}:\nfrom: ${req.from} (${req.fromDescription})\nrequest: ${req.id}\n${req.message}${options}\nAnswer with answer_child (to = ${req.id}).`,
        display: true,
        details: { request: req.id, from: req.from, description: req.fromDescription, reason: req.reason, message: req.message },
      });
    }
  };
  try {
    mkdirSync(dir, { recursive: true });
  } catch {
    // Without the directory no child can have asked yet; the next launch recreates it.
  }
  announce(); // requests that piled up while nobody watched
  let watcher: ReturnType<typeof watch>;
  try {
    watcher = watch(dir, { persistent: false }, () => announce());
  } catch {
    return () => {};
  }
  return () => watcher.close();
}
