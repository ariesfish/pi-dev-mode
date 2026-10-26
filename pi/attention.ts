// pi/attention.ts — what this package tells the outside world about work it
// runs behind the user's back: background agents finishing, a batch settling,
// an ask dialog waiting, a child needing a decision.
//
// Two channels, one policy:
//   • OSC 7501 (Program Status Protocol): a *record* per id that every report
//     replaces whole. Our work lives on child records (`pi-dev/agents`,
//     `pi-dev/ask`); pi core owns the root record, so we never send one.
//   • OSC 9: a one-time desktop notification. This is the channel a Ghostty
//     window actually shows today — its current release (1.3.1) ships no OSC
//     7501 parser, so records alone are silent there; the parser landed in
//     libghostty-vt for the 1.4.0 release, which will read these records with
//     no change on our side. Terminals that already parse 7501 pick them up now.
//
// Encoding is pure and pinned by attention.test.ts; the class only decides
// when to encode, and writes through an injected sink so tests never touch
// stdout. Reports are single invisible escape sequences, safe to write beside
// pi's frame output: they consume no cells and move no cursor.
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const ESC = "\x1b";
const ST = `${ESC}\\`;
const BEL = "\x07";

/** Program status app id: stable grouping key, not a label. */
export const APP = "pi";
/** Human label for our records (the protocol's `title`). */
export const TITLE = "pi-dev";
/** Record for background agent work. */
export const AGENTS_ID = "pi-dev/agents";
/** Record for "waiting on the user": ask dialogs and child requests. */
export const ASK_ID = "pi-dev/ask";

const APP_PATTERN = /^[A-Za-z0-9_.+-]{1,32}$/;
const SEGMENT_PATTERN = /^[A-Za-z0-9_.+-]{1,32}$/;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]+/g;

/** Spec limits: a report that breaks one is discarded whole. */
const MAX_REPORT_BYTES = 4096;
const MAX_MSG_BYTES = 2048;
const MAX_TITLE_BYTES = 192;
const MAX_ID_BYTES = 128;
const MAX_ID_DEPTH = 8;
/** Desktop notification text: terminals show a line, not a paragraph. */
const MAX_NOTIFICATION_CHARS = 200;
const MAX_EVENT_CHARS = 120;
/** Throttle: a burst of endings must not become a burst of popups. Ghostty
 * rate-limits on its own too; this keeps both from firing at once. */
const MIN_NOTIFY_INTERVAL_MS = 2000;
const DEDUPE_WINDOW_MS = 10_000;

export type ProgramState = "idle" | "working" | "done" | "blocked" | "error" | "clear";
export type BlockedKind = "permission" | "question" | "auth";

const STATES: readonly ProgramState[] = ["idle", "working", "done", "blocked", "error", "clear"];
const KINDS: readonly BlockedKind[] = ["permission", "question", "auth"];

export interface ProgramStatusReport {
  state: ProgramState;
  /** Absent means the root record — which pi core owns; always set ours. */
  id?: string;
  app?: string;
  kind?: BlockedKind;
  msg?: string;
  title?: string;
}

/** `segment ("/" segment)*`, each ≤32 bytes, ≤8 levels, ≤128 bytes total. */
export function validProgramId(id: string): boolean {
  const segments = id.split("/");
  return segments.length <= MAX_ID_DEPTH && Buffer.byteLength(id, "utf8") <= MAX_ID_BYTES && segments.every((s) => SEGMENT_PATTERN.test(s));
}

function clipUtf8(text: string, cap: number): string {
  if (Buffer.byteLength(text, "utf8") <= cap) return text;
  const bytes = Buffer.from(text, "utf8");
  let end = cap;
  while (end > 0 && (bytes[end] & 0xc0) === 0x80) end--;
  return bytes.subarray(0, end).toString("utf8");
}

/** Free text is one line without control characters (the spec refuses
 * reports whose decoded text carries any). */
function oneLine(text: string | undefined): string {
  return (text ?? "").replace(CONTROL_CHARACTERS, " ").replace(/\s+/g, " ").trim();
}

function clipText(text: string, cap: number): string {
  return clipUtf8(text, cap);
}

function base64Pair(key: "msg" | "title", text: string | undefined, cap: number): string | undefined {
  const clean = clipText(oneLine(text), cap);
  return clean ? `${key}=${Buffer.from(clean, "utf8").toString("base64")}` : undefined;
}

/** One OSC 7501 report, or "" when the protocol would have to drop it. */
export function formatProgramStatus(report: ProgramStatusReport): string {
  if (!STATES.includes(report.state)) return "";
  // A malformed id must not fall through to the root record: that one is pi
  // core's, and overwriting it would misreport the whole session.
  if (report.id !== undefined && !validProgramId(report.id)) return "";

  const pairs = [`state=${report.state}`];
  if (report.id !== undefined) pairs.push(`id=${report.id}`);
  if (report.app !== undefined && APP_PATTERN.test(report.app)) pairs.push(`app=${report.app}`);
  if (report.state === "clear") return `${ESC}]7501;${pairs.join(":")}${ST}`;
  if (report.state === "blocked" && report.kind !== undefined && KINDS.includes(report.kind)) pairs.push(`kind=${report.kind}`);
  const msg = base64Pair("msg", report.msg, MAX_MSG_BYTES);
  if (msg) pairs.push(msg);
  const title = base64Pair("title", report.title, MAX_TITLE_BYTES);
  if (title) pairs.push(title);

  const sequence = `${ESC}]7501;${pairs.join(":")}${ST}`;
  return Buffer.byteLength(sequence, "utf8") <= MAX_REPORT_BYTES ? sequence : "";
}

/** One OSC 9 desktop notification, or "" when there is nothing to show. */
export function formatNotification(body: string): string {
  const text = clipText(oneLine(body), MAX_NOTIFICATION_CHARS);
  return text ? `${ESC}]9;${text}${BEL}` : "";
}

/**
 * One OSC 99 (kitty) notification as the two frames the protocol expects: a
 * title frame and a final body frame. VS Code implements exactly this
 * sequence and nothing else — its terminal registers an OSC 99 handler only,
 * so an OSC 9 there is inert. No `o=` occasion key is sent: the notification
 * shows whether or not the window has focus (owner's call, 2026-10-26), and
 * the 2s throttle plus same-text dedupe in Attention keep it from nagging.
 */
export function formatKittyNotification(title: string, body: string, id: string): string {
  const cleanBody = clipText(oneLine(body), MAX_NOTIFICATION_CHARS);
  if (!cleanBody) return "";
  const cleanTitle = clipText(oneLine(title), 60) || TITLE;
  const safeId = id.replace(/[^A-Za-z0-9_+.-]/g, "").slice(0, 32) || "pi-dev";
  const frame = (kind: "title" | "body", text: string, last: boolean) =>
    `${ESC}]99;i=${safeId}:p=${kind}:e=1${last ? "" : ":d=0"};${Buffer.from(text, "utf8").toString("base64")}${ST}`;
  return frame("title", cleanTitle, false) + frame("body", cleanBody, true);
}

/** Which notification sequence this terminal reads. */
export type NotificationChannel = "osc9" | "osc99" | "none";

/** Terminals that show OSC 9 (iTerm2 growl / Ghostty / WezTerm / kitty…). */
const NOTIFY_TERMINALS = /ghostty|iterm|wezterm|kitty|hyper|tabby/i;
/** VS Code's integrated terminal: OSC 99 only (setting
 * `terminal.integrated.enableNotifications`, default on). */
const VSCODE_TERMINAL = /vscode/i;

export function notificationChannel(env: NodeJS.ProcessEnv): NotificationChannel {
  if (env.PI_DEV_NOTIFY === "0") return "none";
  const term = `${env.TERM_PROGRAM ?? ""} ${env.TERM ?? ""}`;
  const detected: NotificationChannel = VSCODE_TERMINAL.test(term) ? "osc99" : NOTIFY_TERMINALS.test(term) ? "osc9" : "none";
  // Opting in on an unrecognized terminal bets on OSC 9, the wider of the two.
  if (env.PI_DEV_NOTIFY === "1") return detected === "none" ? "osc9" : detected;
  return detected;
}

export function notificationsEnabled(env: NodeJS.ProcessEnv): boolean {
  return notificationChannel(env) !== "none";
}

// ─── decoding this package's own notices ────────────────────────────────────

/** What `AgentRunner.notify` hands over; structural so tests need no pi types. */
export interface AttentionMessage {
  customType?: string;
  content?: unknown;
  details?: unknown;
}

export interface AttentionEvent {
  state: "working" | "done" | "blocked" | "error";
  kind?: "question";
  message: string;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function countRows(rows: unknown): string {
  const list = Array.isArray(rows) ? rows : [];
  const counts = new Map<string, number>();
  for (const row of list) {
    const status = text((row as { status?: unknown })?.status) ?? "completed";
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  return ["completed", "failed", "stopped"]
    .filter((status) => counts.has(status))
    .map((status) => `${counts.get(status)} ${status}`)
    .join(", ");
}

/** The notice as one line plus the state it implies. Undefined when the
 * message carries nothing a notification could say. */
export function noticeEvent(message: AttentionMessage): AttentionEvent | undefined {
  const details = (message.details ?? {}) as Record<string, unknown>;
  const content = typeof message.content === "string" ? message.content : "";
  switch (message.customType) {
    case "pi-dev-agent": {
      const description = text(details.description) ?? "subagent";
      const status = text(details.status) ?? "completed";
      return { state: status === "failed" ? "error" : "done", message: clipText(`${description} ${status}`, MAX_EVENT_CHARS) };
    }
    case "pi-dev-agent-batch": {
      if (details.error) return { state: "error", message: clipText(oneLine(content.split(/\r?\n/, 1)[0] ?? "batch notice failed"), MAX_EVENT_CHARS) };
      const summary = countRows(details.rows);
      return {
        state: summary.includes("failed") ? "error" : "done",
        message: clipText(`batch ${summary || "finished"}`, MAX_EVENT_CHARS),
      };
    }
    case "pi-dev-intercom": {
      const description = text(details.description) ?? "subagent";
      const body = clipText(oneLine(text(details.message) ?? ""), MAX_EVENT_CHARS);
      if (details.reason === "progress_update") return { state: "working", message: body ? `${description}: ${body}` : description };
      return { state: "blocked", kind: "question", message: body ? `${description} asks: ${body}` : `${description} asks for a decision` };
    }
    default: {
      const line = clipText(oneLine(content.split(/\r?\n/, 1)[0] ?? ""), MAX_EVENT_CHARS);
      return line ? { state: "done", message: line } : undefined;
    }
  }
}

// ─── when to say it ─────────────────────────────────────────────────────────

/** The slice of an agent record the reporter reads; AgentRecord fits it. */
export interface AgentLike {
  agent: { id: string };
  status: "running" | "completed" | "failed" | "stopped";
}

export interface AttentionSink {
  write(sequence: string): void;
  now(): number;
}

export interface AttentionOptions {
  sink?: AttentionSink;
  /** Desktop notifications. Default: whatever the terminal reads. */
  channel?: NotificationChannel;
  /** Program status records (OSC 7501). Default: on unless PI_DEV_PROGRAM_STATUS=0. */
  programStatus?: boolean;
  env?: NodeJS.ProcessEnv;
}

/**
 * Tracks the package's own state and writes it out. Inert until bound: a
 * headless child, a print-mode run, or a non-TUI client has no terminal to
 * report to, and must not write escape sequences into a pipe.
 */
export class Attention {
  private readonly sink: AttentionSink;
  private readonly channel: NotificationChannel;
  /** Distinct ids keep one notification from updating an unrelated earlier one. */
  private notifySeq = 0;
  private readonly programStatus: boolean;
  private active = false;
  private readonly running = new Set<string>();
  private lastEnded: "completed" | "failed" | "stopped" | undefined;
  private lastReport = "";
  /** A done/error record is standing: there is something for the user to see. */
  private settled = false;
  private lastNotifyAt = Number.NEGATIVE_INFINITY;
  private lastBody = "";
  private lastBodyAt = Number.NEGATIVE_INFINITY;

  constructor(options: AttentionOptions = {}) {
    const env = options.env ?? process.env;
    this.sink = options.sink ?? { write: (sequence) => process.stdout.write(sequence), now: () => Date.now() };
    this.channel = options.channel ?? notificationChannel(env);
    this.programStatus = options.programStatus ?? env.PI_DEV_PROGRAM_STATUS !== "0";
  }

  /** Bind to (or unbind from) a live TUI session; every session_start rebinds. */
  bind(active: boolean): void {
    this.active = active;
    this.running.clear();
    this.lastEnded = undefined;
    this.lastReport = "";
    this.settled = false;
  }

  /** The persist funnel: one call per record write, never a process probe. */
  record(record: AgentLike): void {
    const before = this.running.size;
    if (record.status === "running") this.running.add(record.agent.id);
    else {
      this.running.delete(record.agent.id);
      this.lastEnded = record.status;
    }
    const after = this.running.size;
    // The same record is persisted more than once (a follow-up write after the
    // notice); only a real transition changes what the terminal should say.
    if (after === before) return;
    if (after > 0) {
      this.report({ state: "working", msg: `${after} subagent${after === 1 ? "" : "s"} running` });
      return;
    }
    this.report({ state: this.lastEnded === "failed" ? "error" : "done", msg: "subagents finished" });
  }

  /** A notice this package delivered into the session (background completion,
   * batch, child request). */
  notice(message: AttentionMessage): void {
    const event = noticeEvent(message);
    if (!event) return;
    if (event.state === "blocked") this.report({ state: "blocked", kind: event.kind, msg: event.message, id: ASK_ID });
    else this.report({ state: event.state, msg: event.message });
    this.desktop(event.message);
  }

  /** An ask dialog opened: the user is the one blocking now. */
  askOpened(question: string): void {
    const msg = clipText(oneLine(question), MAX_EVENT_CHARS);
    this.report({ state: "blocked", kind: "question", msg: msg || "waiting for your answer", id: ASK_ID });
    this.desktop(`waiting for your answer: ${msg}`.trim());
  }

  /** The dialog closed without an answer (dismissed, cancelled, timed out). */
  askClosed(): void {
    this.report({ state: "clear", id: ASK_ID });
  }

  /** The request was answered: nothing waits on the user any more. */
  askAnswered(): void {
    this.report({ state: "clear", id: ASK_ID });
  }

  /** The user is back and typing: a done/error record about work they have
   * now seen can go. Working records stay until the work actually ends. */
  acknowledge(): void {
    if (this.running.size > 0 || !this.settled) return;
    this.report({ state: "clear", id: AGENTS_ID });
  }

  /** Session shutdown: leave no record behind (the terminal drops working
   * records on its own, but a done/error record would otherwise outlive us). */
  dispose(): void {
    this.report({ state: "clear", id: ASK_ID });
    this.report({ state: "clear", id: AGENTS_ID });
    this.active = false;
  }

  private report(record: Omit<ProgramStatusReport, "app" | "title"> & { id?: string; msg?: string }): void {
    if (!this.active || !this.programStatus) return;
    // A clear removes the record; it needs neither identity nor text.
    const identity = record.state === "clear" ? {} : { app: APP, title: TITLE };
    const sequence = formatProgramStatus({ ...identity, id: AGENTS_ID, ...record });
    this.settled = record.state === "done" || record.state === "error";
    if (!sequence || sequence === this.lastReport) return;
    this.lastReport = sequence;
    this.sink.write(sequence);
  }

  private desktop(body: string): void {
    if (!this.active || this.channel === "none") return;
    const now = this.sink.now();
    if (now - this.lastNotifyAt < MIN_NOTIFY_INTERVAL_MS) return;
    if (body === this.lastBody && now - this.lastBodyAt < DEDUPE_WINDOW_MS) return;
    const sequence =
      this.channel === "osc99" ? formatKittyNotification(TITLE, body, `pi-dev-${++this.notifySeq}`) : formatNotification(body);
    if (!sequence) return;
    this.lastNotifyAt = now;
    this.lastBody = body;
    this.lastBodyAt = now;
    this.sink.write(sequence);
  }
}

/** Convenience for the notice seam: the message type AgentRunner hands over. */
export type NoticeMessage = Parameters<ExtensionAPI["sendMessage"]>[0];
