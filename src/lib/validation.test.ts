import { describe, expect, it } from "vitest";
import {
  registerSchema,
  mealCreateSchema,
  profileUpdateSchema,
  foodCreateSchema,
  waterLogSchema,
  exerciseLogSchema,
  healthSyncSchema,
} from "@/lib/validation";

describe("registerSchema", () => {
  it("accepts a valid registration", () => {
    const result = registerSchema.safeParse({
      email: "Test@Example.com",
      password: "secret123",
      name: "Tester",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("rejects a short password", () => {
    const result = registerSchema.safeParse({ email: "a@b.com", password: "123" });
    expect(result.success).toBe(false);
  });

  it("rejects password without a letter", () => {
    const result = registerSchema.safeParse({ email: "a@b.com", password: "12345678" });
    expect(result.success).toBe(false);
  });

  it("rejects password without a number", () => {
    const result = registerSchema.safeParse({ email: "a@b.com", password: "abcdefgh" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({ email: "not-an-email", password: "secret123" });
    expect(result.success).toBe(false);
  });
});

describe("mealCreateSchema", () => {
  it("accepts a valid meal", () => {
    const result = mealCreateSchema.safeParse({
      mealType: "lunch",
      date: "2026-07-09",
      items: [{ foodId: "food1", quantity: 1.5, unitName: "공기" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown meal type", () => {
    const result = mealCreateSchema.safeParse({
      mealType: "brunch",
      items: [{ foodId: "food1", quantity: 1, unitName: "g" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty items array", () => {
    const result = mealCreateSchema.safeParse({ mealType: "lunch", items: [] });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive quantity", () => {
    const result = mealCreateSchema.safeParse({
      mealType: "lunch",
      items: [{ foodId: "food1", quantity: 0, unitName: "g" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("profileUpdateSchema", () => {
  it("accepts valid known health conditions", () => {
    const result = profileUpdateSchema.safeParse({
      age: 30,
      gender: "male",
      height: 175,
      weight: 70,
      healthConditions: "diabetes,hypertension",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown health condition", () => {
    const result = profileUpdateSchema.safeParse({ healthConditions: "made_up_condition" });
    expect(result.success).toBe(false);
  });

  it("rejects an out-of-range age", () => {
    const result = profileUpdateSchema.safeParse({ age: 999 });
    expect(result.success).toBe(false);
  });
});

describe("foodCreateSchema", () => {
  it("accepts a valid custom food", () => {
    const result = foodCreateSchema.safeParse({
      name: "닭가슴살 샐러드",
      caloriesPer100g: 120,
      proteinPer100g: 18,
      fatPer100g: 3,
      carbsPer100g: 5,
      servings: [{ unitName: "접시", gramsPerUnit: 250 }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("general");
    }
  });

  it("rejects a blank name", () => {
    const result = foodCreateSchema.safeParse({
      name: "",
      caloriesPer100g: 100,
      proteinPer100g: 1,
      fatPer100g: 1,
      carbsPer100g: 1,
      servings: [{ unitName: "g", gramsPerUnit: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty servings array", () => {
    const result = foodCreateSchema.safeParse({
      name: "test",
      caloriesPer100g: 100,
      proteinPer100g: 1,
      fatPer100g: 1,
      carbsPer100g: 1,
      servings: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("waterLogSchema", () => {
  it("accepts delta-only updates used by +250ml button", () => {
    expect(waterLogSchema.safeParse({ date: "2026-07-11", deltaMl: 250 }).success).toBe(true);
  });

  it("accepts absolute ml", () => {
    expect(waterLogSchema.safeParse({ ml: 1500 }).success).toBe(true);
  });

  it("rejects empty body", () => {
    expect(waterLogSchema.safeParse({}).success).toBe(false);
  });
});

describe("exerciseLogSchema", () => {
  it("accepts a valid manual entry", () => {
    expect(exerciseLogSchema.safeParse({ date: "2026-07-15", calories: 350 }).success).toBe(true);
  });

  it("rejects a negative calorie value", () => {
    expect(exerciseLogSchema.safeParse({ calories: -1 }).success).toBe(false);
  });

  it("rejects a missing calorie value", () => {
    expect(exerciseLogSchema.safeParse({ date: "2026-07-15" }).success).toBe(false);
  });
});

describe("healthSyncSchema", () => {
  it("accepts a valid HealthKit push", () => {
    expect(
      healthSyncSchema.safeParse({ date: "2026-07-15", activeCalories: 420 }).success,
    ).toBe(true);
  });

  it("defaults date to today when omitted", () => {
    expect(healthSyncSchema.safeParse({ activeCalories: 420 }).success).toBe(true);
  });

  it("rejects an out-of-range calorie value", () => {
    expect(healthSyncSchema.safeParse({ activeCalories: 99999 }).success).toBe(false);
  });
});
