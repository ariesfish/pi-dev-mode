import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "bun:test";

import { resolveModel, type Settings } from "./config.ts";

// config.test.ts — the alias map resolves against the operator's catalog, not
// just against its own spelling. Regression for 2026-10-26: `sonnet` pointed
// at a provider that was not configured, and resolveModel happily returned it
// for the spawned pi to fail on.

function settings(agentDir: string, modelsFile: string): Settings {
  return {
    pluginRoot: "/pkg",
    modelsFile,
    agentDir,
    pi: { command: "pi", args: [] },
    depth: 0,
    killGraceMs: 1,
    exitGraceMs: 1,
  };
}

function modelsFile(dir: string, targets: Record<string, string>): string {
  // Distinct from the catalog at <agentDir>/models.json: the alias map and the
  // operator's catalog are two different files in production.
  const file = join(dir, "alias-map.json");
  writeFileSync(
    file,
    JSON.stringify({ available: Object.keys(targets), efforts: ["low", "high"], pi: { fallback: "*", models: { "*": targets } } }),
  );
  return file;
}

function catalog(dir: string, providers: Record<string, string[]>): void {
  writeFileSync(
    join(dir, "models.json"),
    JSON.stringify({ providers: Object.fromEntries(Object.entries(providers).map(([p, ids]) => [p, { models: ids.map((id) => ({ id })) }])) }),
  );
}

describe("resolveModel against the operator's catalog", () => {
  test("a mapped alias whose provider/id exists resolves", () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-config-"));
    catalog(dir, { alpha: ["m1"] });
    const file = modelsFile(dir, { fast: "alpha/m1" });
    expect(resolveModel("fast", settings(dir, file), undefined, "alpha/m1")).toBe("alpha/m1");
  });

  test("a mapped alias the catalog does not carry fails here, naming the alias", () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-config-"));
    catalog(dir, { alpha: ["m1"] });
    const file = modelsFile(dir, { fast: "alpha/gone" });
    expect(() => resolveModel("fast", settings(dir, file), undefined, undefined)).toThrow(/alias "fast".*not in/);
  });

  test("an unconfigured provider fails the same way", () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-config-"));
    catalog(dir, { alpha: ["m1"] });
    const file = modelsFile(dir, { fast: "beta/m1" });
    expect(() => resolveModel("fast", settings(dir, file), undefined, undefined)).toThrow(/not in/);
  });

  test("no catalog on the machine means no catalog validation (portable package)", () => {
    const dir = mkdtempSync(join(tmpdir(), "pi-config-"));
    const file = modelsFile(dir, { fast: "beta/m1" });
    expect(resolveModel("fast", settings(dir, file), undefined, undefined)).toBe("beta/m1");
  });
});
