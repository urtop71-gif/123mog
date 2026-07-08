import { describe, expect, it } from "vitest";
import {
  registerSchema,
  mealCreateSchema,
  profileUpdateSchema,
  foodCreateSchema,
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

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({ email: "not-an-email", password: "123456" });
    expect(result.success).toBe(false);
  });
});

describe("mealCreateSchema", () => {
  it("accepts a valid meal", () => {
    const result = mealCreateSchema.safeParse({
      mealType: "lunch",
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
