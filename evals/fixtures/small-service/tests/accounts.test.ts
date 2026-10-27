import { describe, expect, test } from "vitest";
import { listAccounts } from "../src/services/accounts";

describe("accounts service", () => {
  test("lists accounts", async () => {
    expect(Array.isArray(await listAccounts())).toBe(true);
  });
});
