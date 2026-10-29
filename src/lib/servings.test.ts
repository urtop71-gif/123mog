import { describe, expect, it } from "vitest";
import { defaultServing, defaultUnitName } from "@/lib/servings";

describe("defaultServing", () => {
  it("prefers the named serving over a later 1 g fallback", () => {
    const servings = [
      { unitName: "그릇", gramsPerUnit: 450 },
      { unitName: "g", gramsPerUnit: 1 },
    ];
    expect(defaultUnitName(servings)).toBe("그릇");
  });

  it("uses the first standard serving, not servings[1]", () => {
    const servings = [
      { unitName: "공기", gramsPerUnit: 210 },
      { unitName: "그릇", gramsPerUnit: 400 },
      { unitName: "g", gramsPerUnit: 1 },
    ];
    expect(defaultServing(servings)?.unitName).toBe("공기");
  });

  it("falls back to grams when that is the only unit", () => {
    expect(defaultUnitName([{ unitName: "g", gramsPerUnit: 1 }])).toBe("g");
    expect(defaultUnitName([])).toBe("g");
  });

  it("does not treat 1 ml as a serving", () => {
    const servings = [
      { unitName: "ml", gramsPerUnit: 1 },
      { unitName: "컵", gramsPerUnit: 240 },
    ];
    expect(defaultUnitName(servings)).toBe("컵");
  });
});
