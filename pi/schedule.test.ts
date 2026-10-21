import { describe, expect, test } from "bun:test";

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

import { Scheduler } from "./schedule.ts";

// Cross-session loop bleed (audit 2026-10-22): a Scheduler slot is
// process-level state; the /loop and schedule_wakeup of one session must not
// keep firing into whichever session the user has switched to. session_start
// reconciles the slot against the active session id.
function fakeCtx(sessionId: string): ExtensionContext {
  return { sessionManager: { getSessionId: () => sessionId }, isIdle: () => true, ui: {} } as unknown as ExtensionContext;
}

function fakePi(sent: unknown[]): ExtensionAPI {
  return { sendUserMessage: (prompt: unknown) => sent.push(prompt) } as unknown as ExtensionAPI;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("Scheduler.reconcileTo", () => {
  test("stops a fixed loop from another session, keeps it in its own", async () => {
    const sent: unknown[] = [];
    const scheduler = new Scheduler(fakePi(sent));
    const ctxA = fakeCtx("sess-a");
    scheduler.startLoop(0.02, "tick", ctxA);
    expect(scheduler.reconcileTo("sess-a")).toBe(false); // own session: untouched
    await wait(70); // ≥ 2 ticks fire in the owner session
    expect(sent.length >= 2).toBe(true);
    const count = sent.length;
    expect(scheduler.reconcileTo("sess-b")).toBe(true); // switched: stopped
    await wait(70);
    expect(sent.length).toBe(count); // no more ticks after the stop
  });

  test("stops a pending wakeup from another session", async () => {
    const sent: unknown[] = [];
    const scheduler = new Scheduler(fakePi(sent));
    scheduler.scheduleWakeup(0.05, "wake", fakeCtx("sess-a"));
    expect(scheduler.reconcileTo("sess-b")).toBe(true);
    await wait(120);
    expect(sent.length).toBe(0); // the wakeup died at the switch
  });

  test("keeps a pending wakeup in its own session", async () => {
    const sent: unknown[] = [];
    const scheduler = new Scheduler(fakePi(sent));
    scheduler.scheduleWakeup(0.05, "wake", fakeCtx("sess-a"));
    expect(scheduler.reconcileTo("sess-a")).toBe(false);
    await wait(120);
    expect(sent.length).toBe(1); // fired exactly once
  });

  test("stops a self-paced loop from another session", async () => {
    const sent: unknown[] = [];
    const scheduler = new Scheduler(fakePi(sent));
    scheduler.startSelfPaced(fakeCtx("sess-a"));
    expect(scheduler.reconcileTo("sess-b")).toBe(true);
    expect(scheduler.selfPaced).toBe(false); // the slot died, not just its next tick
  });

  test("a live slot that fires is nothing to reconcile", async () => {
    const sent: unknown[] = [];
    const scheduler = new Scheduler(fakePi(sent));
    expect(scheduler.reconcileTo("sess-b")).toBe(false); // nothing live: no stop, no claim
  });
});
