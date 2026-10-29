import { describe, expect, it } from "vitest";
import { insertGlobalFoodIfMissing, type CatalogFoodInput } from "@/lib/seedCatalog";

const food: CatalogFoodInput = {
  name: "공기밥",
  category: "korean",
  caloriesPer100g: 150,
  proteinPer100g: 3,
  fatPer100g: 0.3,
  carbsPer100g: 33,
  servings: [{ unitName: "공기", gramsPerUnit: 210 }],
};

describe("insertGlobalFoodIfMissing", () => {
  it("skips a name that already exists and does not write", async () => {
    let created = 0;
    const result = await insertGlobalFoodIfMissing(
      {
        findFirst: async () => ({ id: "existing" }),
        create: async () => {
          created += 1;
        },
      },
      food,
    );
    expect(result).toBe("skipped");
    expect(created).toBe(0);
  });

  it("creates a missing global food with no owner", async () => {
    let data: Record<string, unknown> | null = null;
    const result = await insertGlobalFoodIfMissing(
      {
        findFirst: async () => null,
        create: async (args) => {
          data = args.data;
        },
      },
      food,
    );
    expect(result).toBe("created");
    expect(data).toMatchObject({ name: "공기밥", userId: null, isCustom: false });
  });
});
