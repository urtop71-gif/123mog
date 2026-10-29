import { describe, expect, it } from "vitest";
import { toPublicFood } from "@/lib/foodPublic";

describe("toPublicFood", () => {
  it("drops userId and marks the owner", () => {
    const food = toPublicFood(
      { id: "f1", name: "김치", userId: "user-a", caloriesPer100g: 20 },
      "user-a",
    );
    expect(food).toEqual({ id: "f1", name: "김치", caloriesPer100g: 20, isOwner: true });
    expect("userId" in food).toBe(false);
  });

  it("does not mark a different viewer as owner", () => {
    const food = toPublicFood({ id: "f1", name: "김치", userId: "user-a" }, "user-b");
    expect(food.isOwner).toBe(false);
    expect("userId" in food).toBe(false);
  });
});
