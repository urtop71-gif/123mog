import { describe, expect, it } from "vitest";
import { summarizeSodium } from "@/lib/sodium";

describe("summarizeSodium", () => {
  it("returns null when every item is unknown", () => {
    expect(summarizeSodium([{ totalSodium: null }, { totalSodium: null }])).toEqual({
      totalMg: null,
      knownCount: 0,
      unknownCount: 2,
      partial: false,
    });
  });

  it("sums known values and flags a partial total", () => {
    const summary = summarizeSodium([
      { totalSodium: 400 },
      { totalSodium: null },
      { totalSodium: 100 },
    ]);
    expect(summary.totalMg).toBe(500);
    expect(summary.partial).toBe(true);
    expect(summary.unknownCount).toBe(1);
  });

  it("does not treat unknown as zero in a complete total", () => {
    const summary = summarizeSodium([{ totalSodium: 0 }, { totalSodium: 250 }]);
    expect(summary.totalMg).toBe(250);
    expect(summary.partial).toBe(false);
    expect(summary.knownCount).toBe(2);
  });
});
