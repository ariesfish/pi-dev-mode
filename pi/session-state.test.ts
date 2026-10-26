import { describe, expect, test } from "bun:test";

import { SessionState } from "./session-state.ts";

// session-state.test.ts — the one place that knows where a session's files
// live. The layout is pinned here; every consumer (agents, intercom, durable
// bridge, restore) reads it through the object, so a layout change is one
// diff and one test, not five files of join() arithmetic.
describe("SessionState layout", () => {
  const s = SessionState.forSession("/agent", "sess-1");

  test("root is <agentDir>/pi-dev/<sessionId>; children hang off it", () => {
    expect(s.root).toBe("/agent/pi-dev/sess-1");
    expect(s.agents).toBe("/agent/pi-dev/sess-1/agents");
    expect(s.prompts).toBe("/agent/pi-dev/sess-1/prompts");
    expect(s.identities).toBe("/agent/pi-dev/sess-1/identities");
    expect(s.intercom).toBe("/agent/pi-dev/sess-1/intercom");
    expect(s.durableSqlite).toBe("/agent/pi-dev/sess-1/durable.sqlite");
  });

  test("per-run files: prompt, identity sidecar, default artifact", () => {
    expect(s.promptFile("a1")).toBe("/agent/pi-dev/sess-1/prompts/a1.md");
    expect(s.identityFile("a1")).toBe("/agent/pi-dev/sess-1/identities/a1.json");
    expect(s.artifactFile("a1")).toBe("/agent/pi-dev/sess-1/artifacts/a1.md");
  });

  test("explicit output is anchored to the process cwd and wins", () => {
    const a = s.artifactFile("a1", "out/report.md");
    expect(a).toBe(`${process.cwd()}/out/report.md`); // the planArtifact rule, unchanged
  });

  test("a persisted record's sessionDir is the way back to its state", () => {
    const back = SessionState.fromSessionDir(s.agents);
    expect(back.root).toBe(s.root);
    expect(back.intercom).toBe(s.intercom);
  });
});
