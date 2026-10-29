import { describe, expect, it } from "vitest";
import { parseParserResponse, per100gFromPortion } from "@/lib/ai/parseResponse";
import { pickBestFood, resolveUnit, scoreFoodName } from "@/lib/ai/matchFood";

describe("parseParserResponse", () => {
  it("reads a JSON object and drops empty names", () => {
    const text = `{"items":[{"name":"김치찌개","quantity":1,"unit":"인분","calories":180,"protein":12,"fat":8,"carbs":10,"sodium":900},{"name":"  "}]}`;
    expect(parseParserResponse(text)).toEqual([
      {
        name: "김치찌개",
        quantity: 1,
        unit: "인분",
        calories: 180,
        protein: 12,
        fat: 8,
        carbs: 10,
        sodium: 900,
      },
    ]);
  });

  it("treats 반 as a quantity the model already converted and defaults missing quantity", () => {
    const portions = parseParserResponse(
      '```json\n{"items":[{"name":"공기밥","quantity":0.5,"unit":"공기"},{"name":"계란"}]}\n```',
    );
    expect(portions[0]).toMatchObject({ name: "공기밥", quantity: 0.5, unit: "공기", calories: null });
    expect(portions[1]).toMatchObject({ name: "계란", quantity: 1, unit: null });
  });

  it("returns nothing for non-JSON", () => {
    expect(parseParserResponse("sorry")).toEqual([]);
  });
});

describe("per100gFromPortion", () => {
  it("scales a portion so logging the same quantity reproduces it", () => {
    expect(per100gFromPortion(90, 0.5)).toBe(180);
    expect(per100gFromPortion(180, 1)).toBe(180);
  });
});

describe("food matching", () => {
  const foods = [
    { id: "1", name: "김치찌개", nameEn: "kimchi stew", servings: [{ unitName: "그릇", gramsPerUnit: 400 }, { unitName: "g", gramsPerUnit: 1 }] },
    { id: "2", name: "김치찌개_돼지고기", nameEn: null, servings: [{ unitName: "그릇", gramsPerUnit: 400 }] },
    { id: "3", name: "공기밥", nameEn: "rice", servings: [{ unitName: "공기", gramsPerUnit: 210 }, { unitName: "g", gramsPerUnit: 1 }] },
  ];

  it("prefers the exact shorter name over a compound", () => {
    expect(scoreFoodName("김치찌개", foods[0])).toBe(100);
    expect(pickBestFood("김치찌개", foods)?.id).toBe("1");
  });

  it("does not match a single unrelated character", () => {
    expect(pickBestFood("ㄱ", foods)).toBeNull();
  });

  it("maps 인분 onto a bowl when that is the standard unit, and 공기 onto rice", () => {
    expect(resolveUnit("공기", foods[2].servings)).toBe("공기");
    expect(resolveUnit("serving", foods[0].servings)).toBe("그릇");
    expect(resolveUnit(null, foods[2].servings)).toBe("공기");
  });
});
