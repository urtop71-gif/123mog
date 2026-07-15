import { describe, expect, it } from "vitest";
import { foodDisplayName } from "@/lib/foodLabel";

describe("foodDisplayName", () => {
  it("uses Korean name by default", () => {
    expect(
      foodDisplayName({ name: "김치찌개", nameEn: "Kimchi stew" }, "ko"),
    ).toBe("김치찌개");
  });

  it("uses English name when lang is en and nameEn exists", () => {
    expect(
      foodDisplayName({ name: "김치찌개", nameEn: "Kimchi stew" }, "en"),
    ).toBe("Kimchi stew");
  });

  it("falls back to name when nameEn is missing", () => {
    expect(foodDisplayName({ name: "된장찌개", nameEn: null }, "en")).toBe("된장찌개");
    expect(foodDisplayName({ name: "된장찌개" }, "en")).toBe("된장찌개");
  });

  it("ignores blank nameEn", () => {
    expect(foodDisplayName({ name: "밥", nameEn: "  " }, "en")).toBe("밥");
  });
});
