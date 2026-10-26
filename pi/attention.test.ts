import { describe, expect, test } from "bun:test";

import { Attention, formatKittyNotification, formatNotification, formatProgramStatus, noticeEvent, notificationChannel, notificationsEnabled } from "./attention.ts";

// Encoding is the contract here: a terminal either parses these bytes or it
// does not. The literals below are the protocol spec's own examples' style
// (state first, base64 free text), so a change in pair order or encoding
// shows up as a red test rather than as a silently ignored report.

const ST = "\x1b\\";
const BEL = "\x07";

describe("formatProgramStatus", () => {
  test("a working report carries state, id, app, msg and title in that order", () => {
    const report = formatProgramStatus({
      state: "working",
      id: "pi-dev/agents",
      app: "pi",
      title: "pi-dev",
      msg: "2 subagents running",
    });
    expect(report).toBe(
      `\x1b]7501;state=working:id=pi-dev/agents:app=pi:msg=MiBzdWJhZ2VudHMgcnVubmluZw==:title=cGktZGV2${ST}`,
    );
  });

  test("kind rides only on a blocked report", () => {
    expect(formatProgramStatus({ state: "blocked", kind: "question", msg: "ok" })).toBe(
      `\x1b]7501;state=blocked:kind=question:msg=b2s=${ST}`,
    );
    expect(formatProgramStatus({ state: "working", kind: "question" })).toBe(`\x1b]7501;state=working${ST}`);
  });

  test("clear keeps its id and drops free text", () => {
    expect(formatProgramStatus({ state: "clear", id: "pi-dev/ask", msg: "ignored", title: "ignored" })).toBe(
      `\x1b]7501;state=clear:id=pi-dev/ask${ST}`,
    );
  });

  test("an invalid id drops the whole report instead of falling back to the root record", () => {
    // The root record belongs to pi core; a malformed id must never overwrite it.
    expect(formatProgramStatus({ state: "working", id: "bad id" })).toBe("");
    expect(formatProgramStatus({ state: "working", id: "a/b/c/d/e/f/g/h/i" })).toBe("");
    expect(formatProgramStatus({ state: "working", id: "x".repeat(33) })).toBe("");
  });

  test("an unknown state drops the report", () => {
    expect(formatProgramStatus({ state: "busy" as never })).toBe("");
  });

  test("free text is stripped of control characters and kept on one line", () => {
    const report = formatProgramStatus({ state: "done", msg: "line1\nline2\t\u0007" });
    expect(report).toBe(`\x1b]7501;state=done:msg=${Buffer.from("line1 line2").toString("base64")}${ST}`);
  });

  test("msg and title are capped at the spec's decoded byte limits", () => {
    const msg = formatProgramStatus({ state: "working", msg: "界".repeat(1000) });
    const decodedMsg = Buffer.from(msg.split("msg=")[1].split(ST)[0], "base64").toString("utf8");
    expect(Buffer.byteLength(decodedMsg, "utf8")).toBeLessThanOrEqual(2048);
    expect(decodedMsg.endsWith("界")).toBe(true);

    const title = formatProgramStatus({ state: "working", title: "界".repeat(100) });
    const decodedTitle = Buffer.from(title.split("title=")[1].split(ST)[0], "base64").toString("utf8");
    expect(Buffer.byteLength(decodedTitle, "utf8")).toBeLessThanOrEqual(192);
  });

  test("a report stays under the protocol's 4096-byte cap", () => {
    const report = formatProgramStatus({ state: "blocked", kind: "question", msg: "界".repeat(2048) });
    expect(Buffer.byteLength(report, "utf8")).toBeLessThanOrEqual(4096);
  });
});

describe("formatNotification", () => {
  test("OSC 9 carries one control-free line", () => {
    expect(formatNotification("audit docs completed")).toBe(`\x1b]9;audit docs completed${BEL}`);
    expect(formatNotification("a\nb\u0000c")).toBe(`\x1b]9;a b c${BEL}`);
  });

  test("an empty message sends nothing", () => {
    expect(formatNotification(" \n\t ")).toBe("");
  });

  test("long bodies are capped", () => {
    const body = formatNotification("x".repeat(500));
    expect(body.length).toBe(`\x1b]9;${BEL}`.length + 200);
  });
});

describe("notificationChannel", () => {
  test("opt-in and opt-out win over detection", () => {
    expect(notificationChannel({ PI_DEV_NOTIFY: "1" })).toBe("osc9");
    expect(notificationChannel({ PI_DEV_NOTIFY: "0", TERM_PROGRAM: "ghostty" })).toBe("none");
    expect(notificationsEnabled({ PI_DEV_NOTIFY: "0", TERM_PROGRAM: "ghostty" })).toBe(false);
  });

  test("OSC 9 terminals are on by default", () => {
    expect(notificationChannel({ TERM_PROGRAM: "ghostty" })).toBe("osc9");
    expect(notificationChannel({ TERM_PROGRAM: "iTerm.app" })).toBe("osc9");
    expect(notificationChannel({ TERM_PROGRAM: "WezTerm" })).toBe("osc9");
    expect(notificationChannel({ TERM: "xterm-kitty" })).toBe("osc9");
  });

  test("VS Code's terminal reads OSC 99 only, and is on by default", () => {
    expect(notificationChannel({ TERM_PROGRAM: "vscode", TERM: "xterm-256color" })).toBe("osc99");
    expect(notificationChannel({ TERM_PROGRAM: "vscode", PI_DEV_NOTIFY: "1" })).toBe("osc99");
  });

  test("everything else stays quiet until asked", () => {
    expect(notificationChannel({ TERM: "xterm-256color" })).toBe("none");
    expect(notificationChannel({ TERM_PROGRAM: "Apple_Terminal" })).toBe("none");
  });
});

describe("formatKittyNotification", () => {
  test("a title frame then a final body frame, base64, no focus occasion", () => {
    const frames = formatKittyNotification("pi-dev", "smoke completed", "pi-dev-1");
    expect(frames).toBe(
      `\x1b]99;i=pi-dev-1:p=title:e=1:d=0;${Buffer.from("pi-dev").toString("base64")}${ST}` +
        `\x1b]99;i=pi-dev-1:p=body:e=1;${Buffer.from("smoke completed").toString("base64")}${ST}`,
    );
    // No o= key: the notification shows whether or not the window has focus.
    expect(frames).not.toContain("o=");
  });

  test("ids are sanitized and free text stays one line", () => {
    const frames = formatKittyNotification("pi-dev", "a\nb", "pi dev:1");
    expect(frames).toContain("i=pidev1:p=title");
    expect(frames).toContain(Buffer.from("a b").toString("base64"));
  });

  test("an empty body sends nothing", () => {
    expect(formatKittyNotification("pi-dev", "  \n ", "x")).toBe("");
  });
});

describe("noticeEvent", () => {
  test("a finished agent reports its description and status", () => {
    expect(noticeEvent({ customType: "pi-dev-agent", content: "", details: { description: "audit docs", status: "completed" } })).toEqual({
      state: "done",
      message: "audit docs completed",
    });
    expect(noticeEvent({ customType: "pi-dev-agent", details: { description: "audit docs", status: "failed" } })?.state).toBe("error");
    expect(noticeEvent({ customType: "pi-dev-agent", details: { description: "audit docs", status: "stopped" } })?.state).toBe("done");
  });

  test("a batch counts its rows and turns any failure into an error", () => {
    const rows = [{ status: "completed" }, { status: "completed" }, { status: "failed" }];
    expect(noticeEvent({ customType: "pi-dev-agent-batch", details: { rows } })).toEqual({
      state: "error",
      message: "batch 2 completed, 1 failed",
    });
  });

  test("a batch that never started reports its own failure", () => {
    expect(
      noticeEvent({
        customType: "pi-dev-agent-batch",
        content: "pi-dev agent batch notice failed: no such model\nmore",
        details: { batch: true, error: true },
      }),
    ).toEqual({ state: "error", message: "pi-dev agent batch notice failed: no such model" });
  });

  test("a child needing a decision blocks; a progress note is just work", () => {
    expect(
      noticeEvent({
        customType: "pi-dev-intercom",
        details: { reason: "need_decision", description: "schema agent", message: "use uuid or int?" },
      }),
    ).toEqual({ state: "blocked", kind: "question", message: "schema agent asks: use uuid or int?" });
    expect(
      noticeEvent({ customType: "pi-dev-intercom", details: { reason: "progress_update", description: "schema agent", message: "halfway" } })?.state,
    ).toBe("working");
  });

  test("an unknown notice falls back to its first line", () => {
    expect(noticeEvent({ customType: "something-else", content: "pi-dev agent finished.\nmore" })).toEqual({
      state: "done",
      message: "pi-dev agent finished.",
    });
    expect(noticeEvent({ customType: "something-else", content: "" })).toBeUndefined();
  });
});

interface FakeSink {
  writes: string[];
  write(text: string): void;
  now(): number;
  advance(ms: number): void;
}

function fakeSink(): FakeSink {
  let time = 0;
  const writes: string[] = [];
  return {
    writes,
    write: (text) => writes.push(text),
    now: () => time,
    advance: (ms) => {
      time += ms;
    },
  };
}

const running = (id: string) => ({ agent: { id, description: id }, status: "running" }) as never;
const ended = (id: string, status: "completed" | "failed") =>
  ({ agent: { id, description: id }, status, endedAt: new Date(0).toISOString() }) as never;

function reporter(options: { channel?: "osc9" | "osc99" | "none"; notifications?: boolean } = {}) {
  const sink = fakeSink();
  const attention = new Attention({
    sink,
    channel: options.channel ?? (options.notifications === false ? "none" : "osc9"),
    programStatus: true,
  });
  return { sink, attention };
}

const reports = (sink: FakeSink) => sink.writes.filter((w) => w.includes("]7501;"));
/** The msg pair's base64, which is never the last pair (title rides behind it). */
const decodedMsg = (sequence: string) =>
  Buffer.from(sequence.match(/msg=([^:]*)/)?.[1] ?? "", "base64").toString("utf8");
const notifications = (sink: FakeSink) => sink.writes.filter((w) => w.startsWith("\x1b]9;"));

describe("Attention", () => {
  test("writes nothing until bound to a TUI session", () => {
    const { sink, attention } = reporter();
    attention.record(running("a1"));
    attention.notice({ customType: "pi-dev-agent", details: { description: "audit docs", status: "completed" } });
    expect(sink.writes).toEqual([]);
  });

  test("running agents move the record to working, the last outcome settles it", () => {
    const { sink, attention } = reporter();
    attention.bind(true);
    attention.record(running("a1"));
    attention.record(running("a2"));
    const working = reports(sink).at(-1)!;
    expect(Buffer.from(working.split("msg=")[1].split(ST)[0], "base64").toString("utf8")).toBe("2 subagents running");

    attention.record(ended("a1", "completed"));
    attention.record(ended("a2", "failed"));
    expect(reports(sink).at(-1)).toBe(`\x1b]7501;state=error:id=pi-dev/agents:app=pi:msg=${Buffer.from("subagents finished").toString("base64")}:title=cGktZGV2${ST}`);
  });

  test("a repeated write of the same end does not overwrite the notice's record", () => {
    const { sink, attention } = reporter();
    attention.bind(true);
    attention.record(running("a1"));
    attention.record(ended("a1", "completed"));
    attention.notice({ customType: "pi-dev-agent", details: { description: "smoke", status: "completed" } });
    // The runner persists the record again after delivering the notice.
    attention.record(ended("a1", "completed"));
    expect(decodedMsg(reports(sink).at(-1)!)).toBe("smoke completed");
  });

  test("a notice updates the record and pops one desktop notification", () => {    const { sink, attention } = reporter();
    attention.bind(true);
    attention.notice({ customType: "pi-dev-agent", details: { description: "audit docs", status: "completed" } });
    expect(reports(sink).at(-1)).toContain("state=done");
    expect(Buffer.from(reports(sink).at(-1)!.split("msg=")[1].split(ST)[0], "base64").toString("utf8")).toBe("audit docs completed");
    expect(notifications(sink)).toEqual([`\x1b]9;audit docs completed${BEL}`]);
  });

  test("desktop notifications are rate limited, the record still updates", () => {
    const { sink, attention } = reporter();
    attention.bind(true);
    attention.notice({ customType: "pi-dev-agent", details: { description: "one", status: "completed" } });
    sink.advance(500);
    attention.notice({ customType: "pi-dev-agent", details: { description: "two", status: "completed" } });
    expect(notifications(sink)).toHaveLength(1);
    expect(reports(sink).at(-1)).toContain(Buffer.from("two completed").toString("base64"));

    sink.advance(5000);
    attention.notice({ customType: "pi-dev-agent", details: { description: "three", status: "completed" } });
    expect(notifications(sink)).toHaveLength(2);
  });

  test("the same message is not popped twice in a row", () => {
    const { sink, attention } = reporter();
    attention.bind(true);
    const notice = { customType: "pi-dev-agent" as const, details: { description: "same", status: "completed" } };
    attention.notice(notice);
    sink.advance(5000);
    attention.notice(notice);
    expect(notifications(sink)).toHaveLength(1);
  });

  test("notifications off keeps the record, drops the popup", () => {
    const { sink, attention } = reporter({ notifications: false });
    attention.bind(true);
    attention.notice({ customType: "pi-dev-agent", details: { description: "audit docs", status: "completed" } });
    expect(reports(sink)).toHaveLength(1);
    expect(notifications(sink)).toHaveLength(0);
  });

  test("VS Code gets the OSC 99 frames instead of OSC 9", () => {
    const { sink, attention } = reporter({ channel: "osc99" });
    attention.bind(true);
    attention.notice({ customType: "pi-dev-agent", details: { description: "audit docs", status: "completed" } });
    expect(notifications(sink)).toHaveLength(0);
    const kitty = sink.writes.filter((w) => w.includes("]99;"));
    expect(kitty).toHaveLength(1); // both frames travel as one write
    expect(kitty[0]).toContain("p=title");
    expect(kitty[0]).toContain(Buffer.from("audit docs completed").toString("base64"));
  });

  test("an open ask dialog blocks, closing or answering clears it", () => {
    const { sink, attention } = reporter();
    attention.bind(true);
    attention.askOpened("Which database?");
    const blocked = reports(sink).at(-1)!;
    expect(blocked).toContain("state=blocked");
    expect(blocked).toContain("kind=question");
    expect(blocked).toContain("id=pi-dev/ask");
    expect(notifications(sink).at(-1)).toContain("Which database?");

    attention.askClosed();
    expect(reports(sink).at(-1)).toBe(`\x1b]7501;state=clear:id=pi-dev/ask${ST}`);
    expect(reports(sink)).toHaveLength(2);

    attention.askAnswered();
    expect(reports(sink).at(-1)).toBe(`\x1b]7501;state=clear:id=pi-dev/ask${ST}`);
  });

  test("a done record clears when the user types again, a working one stays", () => {
    const { sink, attention } = reporter();
    attention.bind(true);
    attention.acknowledge(); // nothing has settled yet: no pointless clear
    expect(reports(sink)).toHaveLength(0);
    attention.record(running("a1"));
    attention.record(ended("a1", "completed"));
    attention.acknowledge();
    expect(reports(sink).at(-1)).toBe(`\x1b]7501;state=clear:id=pi-dev/agents${ST}`);

    attention.record(running("a2"));
    const before = reports(sink).length;
    attention.acknowledge();
    expect(reports(sink)).toHaveLength(before); // still running: nothing to clear
  });

  test("dispose clears both records", () => {
    const { sink, attention } = reporter();
    attention.bind(true);
    attention.dispose();
    expect(reports(sink)).toEqual([`\x1b]7501;state=clear:id=pi-dev/ask${ST}`, `\x1b]7501;state=clear:id=pi-dev/agents${ST}`]);
  });
});
