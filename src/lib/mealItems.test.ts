import { describe, expect, it, vi, beforeEach } from "vitest";

const findUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: { food: { findUnique: (...args: unknown[]) => findUnique(...args) } },
}));

const { computeMealItems } = await import("@/lib/mealItems");

const rice = {
  id: "food1",
  name: "백미밥",
  caloriesPer100g: 130,
  proteinPer100g: 2.7,
  fatPer100g: 0.3,
  carbsPer100g: 28,
  servings: [{ unitName: "공기", gramsPerUnit: 210 }],
};

beforeEach(() => {
  findUnique.mockReset();
});

describe("computeMealItems", () => {
  it("computes nutrition proportional to grams", async () => {
    findUnique.mockResolvedValue(rice);
    const [result] = await computeMealItems([{ foodId: "food1", quantity: 1, unitName: "공기" }]);
    expect(result.totalGrams).toBe(210);
    expect(result.totalCalories).toBeCloseTo(130 * 2.1, 1);
  });

  it("throws for a non-positive quantity", async () => {
    findUnique.mockResolvedValue(rice);
    await expect(
      computeMealItems([{ foodId: "food1", quantity: 0, unitName: "공기" }])
    ).rejects.toThrow(/positive/);
  });

  it("throws when the food does not exist", async () => {
    findUnique.mockResolvedValue(null);
    await expect(
      computeMealItems([{ foodId: "missing", quantity: 1, unitName: "공기" }])
    ).rejects.toThrow(/not found/);
  });

  it("throws when the serving unit is unknown", async () => {
    findUnique.mockResolvedValue(rice);
    await expect(
      computeMealItems([{ foodId: "food1", quantity: 1, unitName: "인분" }])
    ).rejects.toThrow(/Unit/);
  });
});
