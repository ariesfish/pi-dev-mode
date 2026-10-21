import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  ASK_PARENT_TIMEOUT_MS,
  type IntercomRequest,
  pendingRequests,
  readReply,
  writeReply,
  writeRequest,
} from "./intercom.ts";
import { SessionState } from "./session-state.ts";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "pi-intercom-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function req(over: Partial<IntercomRequest> = {}): IntercomRequest {
  return {
    id: "req-uuid-1",
    from: "a1",
    fromDescription: "Reviewer A",
    reason: "need_decision",
    message: "Which schema do we ship?",
    options: ["A", "B"],
    createdAt: Date.now(),
    ...over,
  };
}

describe("channel layout", () => {
  test("intercom dir is the session state's intercom child (pinned in session-state.test.ts)", () => {
    expect(new SessionState("s", "state").intercom).toBe(join("s", "pi-dev", "state", "intercom"));
  });
});

describe("request/reply roundtrip", () => {
  test("a written request is pending and a reply resolves it once", () => {
    writeRequest(dir, req());
    const pending = pendingRequests(dir);
    expect(pending).toHaveLength(1);
    expect(pending[0]?.req.from).toBe("a1");
    expect(pending[0]?.stale).toBe(false);
    expect(readReply(dir, "req-uuid-1")).toBeUndefined();
    writeReply(dir, "req-uuid-1", "ship B");
    expect(readReply(dir, "req-uuid-1")).toBe("ship B");
    // request file stays (history); caller-side seen-set dedupes notices
  });
  test("ids are validated before any path is built", () => {
    expect(() => writeRequest(dir, req({ id: "../escape" }))).toThrow(/Invalid/);
    expect(() => writeReply(dir, "../../etc/passwd", "x")).toThrow(/Invalid/);
  });
});

describe("pendingRequests", () => {
  test("orders oldest first and filters nothing but marks stale", () => {
    const now = Date.now();
    writeRequest(dir, req({ id: "fresh", createdAt: now - 1000 }));
    writeRequest(dir, req({ id: "old", createdAt: now - ASK_PARENT_TIMEOUT_MS - 5000 }));
    const pending = pendingRequests(dir, now);
    expect(pending.map((p) => p.req.id)).toEqual(["old", "fresh"]);
    expect(pending[0]?.stale).toBe(true);
    expect(pending[1]?.stale).toBe(false);
  });
  test("corrupt or foreign files are skipped, not served", () => {
    writeRequest(dir, req());
    writeFileSync(join(dir, "req-broken.json"), "{not json");
    writeFileSync(join(dir, "req-empty.json"), JSON.stringify({ id: "no-message" }));
    writeFileSync(join(dir, "reply-x.json"), JSON.stringify({ id: "x" }));
    expect(pendingRequests(dir)).toHaveLength(1);
  });
  test("a missing dir reads as no pending", () => {
    expect(pendingRequests(join(dir, "never"))).toEqual([]);
  });
});
