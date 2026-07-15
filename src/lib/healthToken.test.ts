import { describe, expect, it } from "vitest";
import { generateHealthSyncToken, hashHealthSyncToken } from "@/lib/healthToken";

describe("healthToken", () => {
  it("generates unique tokens with a recognizable prefix", () => {
    const a = generateHealthSyncToken();
    const b = generateHealthSyncToken();
    expect(a).toMatch(/^hsk_/);
    expect(a).not.toBe(b);
  });

  it("hashes deterministically so a lookup by hash is possible", () => {
    const token = generateHealthSyncToken();
    expect(hashHealthSyncToken(token)).toBe(hashHealthSyncToken(token));
  });

  it("produces different hashes for different tokens", () => {
    expect(hashHealthSyncToken(generateHealthSyncToken())).not.toBe(
      hashHealthSyncToken(generateHealthSyncToken()),
    );
  });
});
