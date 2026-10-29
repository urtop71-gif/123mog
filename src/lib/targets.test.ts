import { describe, expect, it } from "vitest";
import { autoCalorieFloor, computeTargets, type TargetInput } from "@/lib/targets";

function base(overrides: Partial<TargetInput> = {}): TargetInput {
  return {
    weight: 70,
    height: 175,
    age: 35,
    gender: "male",
    activityLevel: "moderate",
    goalWeight: 70,
    healthConditions: null,
    targetsManual: false,
    bmr: null,
    tdee: null,
    dailyTarget: null,
    proteinTarget: null,
    fatTarget: null,
    carbsTarget: null,
    sodiumTarget: null,
    ...overrides,
  };
}

describe("computeTargets", () => {
  it("recomputes the eating goal from a new weight", () => {
    const before = computeTargets(base({ weight: 80 }));
    const after = computeTargets(base({ weight: 70 }));
    expect(after.bmr).not.toBe(before.bmr);
    expect(after.dailyTarget).not.toBe(before.dailyTarget);
    expect(after.dailyTarget).toBeGreaterThan(0);
  });

  it("leaves manual targets alone when weight changes", () => {
    const result = computeTargets(
      base({
        weight: 60,
        targetsManual: true,
        dailyTarget: 1800,
        proteinTarget: 120,
        bmr: 1500,
        tdee: 2000,
      }),
    );
    expect(result.dailyTarget).toBe(1800);
    expect(result.proteinTarget).toBe(120);
    expect(result.bmr).not.toBe(1500);
  });

  it("applies a minimum floor to automatic calorie targets", () => {
    const result = computeTargets(
      base({
        gender: "female",
        weight: 45,
        height: 150,
        age: 60,
        activityLevel: "sedentary",
        goalWeight: 40,
      }),
    );
    expect(autoCalorieFloor("female")).toBe(1200);
    expect(autoCalorieFloor("male")).toBe(1500);
    expect(result.calorieFloorApplied).toBe(true);
    expect(result.dailyTarget).toBeGreaterThanOrEqual(1200);
  });

  it("does not floor a manual target below the auto minimum", () => {
    const result = computeTargets(
      base({
        targetsManual: true,
        manualDaily: 900,
        dailyTarget: 2200,
      }),
    );
    expect(result.dailyTarget).toBe(900);
    expect(result.calorieFloorApplied).toBe(false);
  });
});
