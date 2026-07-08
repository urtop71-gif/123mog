import { describe, expect, it } from "vitest";
import {
  registerSchema,
  mealCreateSchema,
  profileUpdateSchema,
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
