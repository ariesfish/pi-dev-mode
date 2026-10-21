import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  artifactContent,
  artifactHeader,
  artifactText,
  ensureArtifact,
  planArtifact,
  readIdentitySidecar,
  synthesizeFromArtifact,
  writeSelfArtifact,
} from "./artifacts.ts";
import type { AgentIdentity, EndedRecord, RunningRecord } from "./agents.ts";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "pi-artifacts-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const identity = (over: Partial<AgentIdentity> = {}): AgentIdentity => ({
  id: "a1",
  description: "Check the build",
  subagentType: "general-purpose",
  sessionId: "s1",
  sessionDir: join(dir, "agents"),
  cwd: "/repo",
  startedAt: "2026-10-21T10:00:00Z",
  ...over,
}) as AgentIdentity;

describe("planArtifact", () => {
  test("default lands beside the session dir in artifacts/<id>.md", () => {
    const got = planArtifact(join(dir, "state", "agents"), "a9");
    expect(got).toBe(join(dir, "state", "artifacts", "a9.md"));
  });
  test("explicit output is anchored to the process cwd and wins", () => {
    const got = planArtifact(join(dir, "agents"), "a9", "reports/audit.md");
    expect(got).toBe(join(process.cwd(), "reports/audit.md"));
  });
});

describe("artifact content roundtrip", () => {
  test("header quotes identity and outcome; text roundtrips under the rule", () => {
    const content = artifactContent(identity({ model: "funai/glm-5-3" }), "completed", 0, "answer\nbody");
    expect(content).toContain("agent: a1");
    expect(content).toContain("status: completed");
    expect(content).toContain("exit code: 0");
    expect(content).toContain("model: funai/glm-5-3");
    expect(artifactText(content)).toBe("answer\nbody\n");
  });
});

describe("writeSelfArtifact", () => {
  const branch = [
    { type: "message", message: { role: "user", content: [{ type: "text", text: "q" }] } },
    { type: "message", message: { role: "assistant", content: [{ type: "text", text: "the final answer" }], stopReason: "stop" } },
  ];
  test("no flag or existing file writes nothing", async () => {
    const path = join(dir, "a1.md");
    writeFileSync(path, "existing");
    writeSelfArtifact(undefined, undefined, () => branch);
    writeSelfArtifact(path, undefined, () => branch); // already there: no rewrite
    expect(await Bun.file(path).text()).toBe("existing");
  });
  test("writes the last assistant text with the self-recorded header", async () => {
    const path = join(dir, "self.md");
    writeSelfArtifact(path, { id: "a1", description: "d", subagentType: "general-purpose", startedAt: "t", cwd: "/repo" }, () => branch);
    const content = await Bun.file(path).text();
    expect(content).toContain("status: completed");
    expect(content).toContain("self-recorded at shutdown");
    expect(artifactText(content)).toBe("the final answer\n");
  });

  test("a run cut short records stopped with its stop reason", async () => {
    const path = join(dir, "cut.md");
    writeSelfArtifact(path, { id: "a1", description: "d", subagentType: "general-purpose", startedAt: "t", cwd: "/repo" }, () => [
      { type: "message", message: { role: "assistant", content: [{ type: "tool_use", id: "t1", name: "bash", input: {} }], stopReason: "toolUse" } },
    ]);
    const content = await Bun.file(path).text();
    expect(content).toContain("status: stopped");
    expect(artifactText(content)).toContain("(stopped: toolUse)");
  });
});

describe("ensureArtifact (parent fallback)", () => {
  test("missing artifact is written from the record; existing is untouched", async () => {
    const record: EndedRecord = {
      agent: identity(),
      status: "completed",
      exitCode: 0,
      endedAt: "t",
      finalText: "parent-side text",
    } as EndedRecord;
    const path = join(dir, "fallback.md");
    (record as { artifactFile?: string }).artifactFile = path;
    ensureArtifact(record);
    expect(await Bun.file(path).text()).toContain("parent-side text");
    writeFileSync(path, "child wrote this first");
    ensureArtifact(record);
    expect(await Bun.file(path).text()).toBe("child wrote this first");
  });
});

describe("synthesizeFromArtifact", () => {
  test("running record + artifact on disk synthesizes an undelivered completed end", () => {
    const path = join(dir, "late.md");
    writeFileSync(path, artifactContent(identity({ artifactFile: path }), "completed", 0, "finished after parent left"));
    const running: RunningRecord = {
      agent: identity({ artifactFile: path }),
      status: "running",
      pid: 123,
      parentPid: 1,
    } as RunningRecord;
    const synth = synthesizeFromArtifact(running);
    expect(synth).toMatchObject({
      status: "completed",
      finalText: "finished after parent left",
      artifactDelivered: false,
      restoredFromArtifact: true,
    });
    expect(synth?.agent.id).toBe("a1");
  });

  test("a stopped artifact header synthesizes a stopped end", () => {
    const path = join(dir, "stopped.md");
    const stoppedContent = artifactHeader(identity({ artifactFile: path }), "stopped", null) + "\n---\n(stopped: toolUse)\n";
    writeFileSync(path, stoppedContent);
    const running: RunningRecord = { agent: identity({ artifactFile: path }), status: "running", parentPid: 1 } as RunningRecord;
    const synth = synthesizeFromArtifact(running);
    expect(synth).toMatchObject({ status: "stopped", finalText: "(stopped: toolUse)" });
  });
  test("no artifact or unreadable → undefined (record keeps its fate)", () => {
    const running: RunningRecord = { agent: identity(), status: "running", parentPid: 1 } as RunningRecord;
    expect(synthesizeFromArtifact(running)).toBeUndefined();
  });
});

describe("readIdentitySidecar", () => {
  test("round-trips the parent's JSON, dropping empty model", () => {
    const sidecarPath = join(dir, "a1.json");
    writeFileSync(sidecarPath, JSON.stringify({ id: "a1", description: "d", subagentType: "general-purpose", model: "", startedAt: "t", cwd: "/r" }));
    const got = readIdentitySidecar(sidecarPath);
    expect(got).toMatchObject({ id: "a1", description: "d" });
    expect(got?.model).toBeUndefined();
    expect(readIdentitySidecar(undefined)).toBeUndefined();
    expect(readIdentitySidecar(join(dir, "missing.json"))).toBeUndefined();
  });
});

describe("artifactHeader", () => {
  test("omits optional lines instead of printing empty ones", () => {
    const h = artifactHeader(identity(), "failed", 2);
    expect(h).not.toContain("model:");
    expect(h).not.toContain("worktree:");
    expect(h).toContain("exit code: 2");
  });
});
