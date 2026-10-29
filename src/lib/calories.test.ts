import { describe, expect, it } from "vitest";
import { energyBalance, isOnTarget, loggingStreak, weekOnTarget } from "@/lib/calories";

describe("calorie model", () => {
  it("computes energy balance as intake minus BMR minus exercise", () => {
    expect(energyBalance(1800, 1400, 300)).toBe(100);
    expect(energyBalance(1800, null, 300)).toBeNull();
    expect(energyBalance(1800, 0, 300)).toBeNull();
  });

  it("counts a day on target only inside 85–105% of the eating goal", () => {
    expect(isOnTarget(2000, 2000)).toBe(true);
    expect(isOnTarget(2100, 2000)).toBe(true);
    expect(isOnTarget(1700, 2000)).toBe(true);
    expect(isOnTarget(1699, 2000)).toBe(false);
    expect(isOnTarget(2110, 2000)).toBe(false);
    expect(isOnTarget(50, 2000)).toBe(false);
    expect(isOnTarget(0, 2000)).toBe(false);
  });

  it("keeps a logging streak when today has no meals yet", () => {
    const days = new Map<string, number>([
      ["2026-10-27", 1900],
      ["2026-10-28", 2000],
    ]);
    expect(loggingStreak(days, "2026-10-29")).toBe(2);
    days.set("2026-10-29", 400);
    expect(loggingStreak(days, "2026-10-29")).toBe(3);
  });

  it("breaks the streak on a gap before today", () => {
    const days = new Map<string, number>([
      ["2026-10-26", 1800],
      ["2026-10-28", 1800],
    ]);
    expect(loggingStreak(days, "2026-10-29")).toBe(1);
  });

  it("counts the week from the band, not from any intake under the goal", () => {
    const days = new Map<string, number>([
      ["2026-10-29", 2000],
      ["2026-10-28", 40],
      ["2026-10-27", 2500],
    ]);
    expect(weekOnTarget(days, "2026-10-29", 2000)).toEqual({ logged: 3, onTarget: 1 });
  });
});
