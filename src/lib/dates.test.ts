import { describe, expect, it } from "vitest";
import {
  toLocalDateKey,
  parseLocalDateKey,
  localDayRange,
  addDaysToKey,
  isValidDateKey,
  resolveTimeZone,
  DEFAULT_TIMEZONE,
} from "@/lib/dates";

describe("dates", () => {
  it("formats local date keys", () => {
    const d = new Date(2026, 6, 9, 15, 30);
    expect(toLocalDateKey(d)).toBe("2026-07-09");
  });

  it("parses local date keys at noon", () => {
    const d = parseLocalDateKey("2026-07-09");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6);
    expect(d.getDate()).toBe(9);
    expect(d.getHours()).toBe(12);
  });

  it("builds inclusive day ranges", () => {
    const { start, end } = localDayRange("2026-07-09");
    expect(start.getHours()).toBe(0);
    expect(end.getHours()).toBe(23);
    expect(start.getDate()).toBe(9);
    expect(end.getDate()).toBe(9);
  });

  it("adds days across month boundaries", () => {
    expect(addDaysToKey("2026-07-31", 1)).toBe("2026-08-01");
    expect(addDaysToKey("2026-07-01", -1)).toBe("2026-06-30");
  });

  it("validates date keys", () => {
    expect(isValidDateKey("2026-07-09")).toBe(true);
    expect(isValidDateKey("not-a-date")).toBe(false);
    expect(isValidDateKey("2026-02-31")).toBe(false);
    expect(isValidDateKey(null)).toBe(false);
  });

  it("uses the user timezone for today, not UTC", () => {
    // 2026-10-29 00:30 in Singapore (UTC+8) is still 2026-10-28 in UTC.
    const instant = new Date(Date.UTC(2026, 9, 28, 16, 30, 0));
    expect(toLocalDateKey(instant, "UTC")).toBe("2026-10-28");
    expect(toLocalDateKey(instant, "Asia/Singapore")).toBe("2026-10-29");
  });

  it("stores noon and day bounds in the user timezone", () => {
    const noon = parseLocalDateKey("2026-10-29", "Asia/Singapore");
    expect(noon.toISOString()).toBe("2026-10-29T04:00:00.000Z");

    const { start, end } = localDayRange("2026-10-29", "Asia/Singapore");
    expect(start.toISOString()).toBe("2026-10-28T16:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-29T15:59:59.999Z");
    expect(start.getTime() <= noon.getTime() && noon.getTime() <= end.getTime()).toBe(true);
  });

  it("keeps a UTC-noon meal inside the same Singapore calendar day", () => {
    // Historical rows were stored as noon in the server zone (UTC on Vercel).
    const stored = new Date(Date.UTC(2026, 9, 29, 12, 0, 0));
    expect(toLocalDateKey(stored, "Asia/Singapore")).toBe("2026-10-29");
    const { start, end } = localDayRange("2026-10-29", "Asia/Singapore");
    expect(stored.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(stored.getTime()).toBeLessThanOrEqual(end.getTime());
  });

  it("defaults an empty timezone to Asia/Singapore", () => {
    expect(resolveTimeZone(null)).toBe(DEFAULT_TIMEZONE);
    expect(resolveTimeZone("Not/AZone")).toBe(DEFAULT_TIMEZONE);
    expect(resolveTimeZone("Asia/Tokyo")).toBe("Asia/Tokyo");
  });
});
