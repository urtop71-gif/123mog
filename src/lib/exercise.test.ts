import { describe, expect, it } from "vitest";
import { combineExerciseLogs, sumExerciseByDate } from "@/lib/exercise";

describe("exercise sources", () => {
  it("keeps manual and healthkit and adds them", () => {
    const combined = combineExerciseLogs([
      { source: "manual", calories: 150 },
      { source: "healthkit", calories: 320 },
    ]);
    expect(combined).toEqual({
      calories: 470,
      manualCalories: 150,
      healthkitCalories: 320,
      source: "both",
    });
  });

  it("reports a single source without inventing the other", () => {
    expect(combineExerciseLogs([{ source: "healthkit", calories: 200 }])).toMatchObject({
      calories: 200,
      manualCalories: null,
      source: "healthkit",
    });
    expect(combineExerciseLogs([])).toMatchObject({ calories: 0, source: null });
  });

  it("sums two rows on the same day for the chart", () => {
    const totals = sumExerciseByDate([
      { date: "2026-10-29", calories: 100 },
      { date: "2026-10-29", calories: 250 },
      { date: "2026-10-28", calories: 40 },
    ]);
    expect(totals.get("2026-10-29")).toBe(350);
    expect(totals.get("2026-10-28")).toBe(40);
  });
});
