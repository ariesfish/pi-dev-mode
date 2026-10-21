import { describe, expect, test } from "bun:test";

import { RegistryModels } from "./durable-models.ts";

// The model mirror implements only the surface pi-durable actually calls
// (verified against its dist); anything else must refuse by name — a named
// refusal, never a speculative pass-through with wrong semantics.
describe("RegistryModels refusal surface", () => {
  test("a method pi-durable has never called refuses by name", () => {
    const bridge = new RegistryModels({} as never);
    expect(() => (bridge as unknown as { getAvailable(): void }).getAvailable()).toThrow(
      "getAvailable is not available through the pi model registry bridge.",
    );
  });
});
