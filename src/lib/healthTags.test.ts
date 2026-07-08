import { describe, expect, it } from "vitest";
import { sodiumTagFor, carbsTagFor, fatTagFor, augmentHealthTags } from "@/lib/healthTags";

describe("sodiumTagFor", () => {
  it("returns null for unknown sodium", () => {
    expect(sodiumTagFor(null)).toBeNull();
    expect(sodiumTagFor(undefined)).toBeNull();
  });

  it("tags low sodium as good, high as bad, mid as neutral", () => {
    expect(sodiumTagFor(50)).toBe("sodium_good");
    expect(sodiumTagFor(600)).toBe("sodium_bad");
    expect(sodiumTagFor(300)).toBe("sodium_neutral");
  });
});

describe("carbsTagFor", () => {
  it("tags low carbs as good, high as bad, mid as neutral", () => {
    expect(carbsTagFor(5)).toBe("sugar_good");
    expect(carbsTagFor(40)).toBe("sugar_bad");
    expect(carbsTagFor(20)).toBe("sugar_neutral");
    expect(carbsTagFor(null)).toBeNull();
  });
});

describe("fatTagFor", () => {
  it("tags low fat as good, high as bad, mid as neutral", () => {
    expect(fatTagFor(2)).toBe("ldl_good");
    expect(fatTagFor(25)).toBe("ldl_bad");
    expect(fatTagFor(10)).toBe("ldl_neutral");
    expect(fatTagFor(null)).toBeNull();
  });
});

describe("augmentHealthTags", () => {
  it("adds all three computed tags when nothing is curated", () => {
    const result = augmentHealthTags(null, { carbsPer100g: 5, fatPer100g: 25, sodiumPer100g: 700 });
    expect(result).toBe("sugar_good,ldl_bad,sodium_bad");
  });

  it("keeps existing curated sugar/ldl tags and only adds sodium", () => {
    const result = augmentHealthTags("ldl_good,sugar_bad", { carbsPer100g: 5, fatPer100g: 25, sodiumPer100g: 50 });
    expect(result).toBe("ldl_good,sugar_bad,sodium_good");
  });

  it("returns null when nothing is known", () => {
    expect(augmentHealthTags(null, {})).toBeNull();
  });
});
