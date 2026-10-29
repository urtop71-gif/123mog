import { describe, expect, it } from "vitest";
import { isTokenVersionCurrent } from "@/lib/tokenVersion";

describe("isTokenVersionCurrent", () => {
  it("accepts legacy tokens while the user is still at version 0", () => {
    expect(isTokenVersionCurrent(undefined, 0)).toBe(true);
    expect(isTokenVersionCurrent(0, 0)).toBe(true);
  });

  it("rejects a token after password change bumps the version", () => {
    expect(isTokenVersionCurrent(0, 1)).toBe(false);
    expect(isTokenVersionCurrent(undefined, 1)).toBe(false);
  });

  it("rejects a token after the account is gone", () => {
    expect(isTokenVersionCurrent(1, null)).toBe(false);
  });
});
