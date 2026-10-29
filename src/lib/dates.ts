/** Calendar-date helpers. Date keys are yyyy-MM-dd in a specific timezone. */

export const DEFAULT_TIMEZONE = "Asia/Singapore";

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Stored user timezone, or Asia/Singapore when missing/invalid. */
export function resolveTimeZone(timeZone: string | null | undefined): string {
  if (timeZone && isValidTimeZone(timeZone)) return timeZone;
  return DEFAULT_TIMEZONE;
}

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function partsInZone(date: Date, timeZone: string): ZonedParts {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  let hour = pick("hour");
  // Some engines report midnight as 24:00.
  if (hour === 24) hour = 0;
  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
    hour,
    minute: pick("minute"),
    second: pick("second"),
  };
}

/** Milliseconds to add to a UTC instant to get the zone's wall clock. */
function zoneOffsetMs(utcMillis: number, timeZone: string): number {
  const whole = Math.floor(utcMillis / 1000) * 1000;
  const p = partsInZone(new Date(whole), timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - whole;
}

/** Wall-clock time in `timeZone` as a UTC Date. Month is 1-12. */
export function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  ms: number,
  timeZone: string,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  const offset = zoneOffsetMs(utcGuess, timeZone);
  let instant = utcGuess - offset;
  const offset2 = zoneOffsetMs(instant, timeZone);
  if (offset2 !== offset) instant = utcGuess - offset2;
  return new Date(instant);
}

function parseKeyParts(dateKey: string): { y: number; m: number; d: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) throw new Error(`Invalid date key: ${dateKey}`);
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

/**
 * Format a Date as yyyy-MM-dd.
 * With a timezone, uses that zone (the user's). Without one, uses the
 * runtime local zone — server code should pass the user timezone.
 */
export function toLocalDateKey(d: Date = new Date(), timeZone?: string): string {
  if (!timeZone) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }
  const p = partsInZone(d, timeZone);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

/** Noon on that calendar day, in `timeZone` or the runtime local zone. */
export function parseLocalDateKey(dateKey: string, timeZone?: string): Date {
  const { y, m, d } = parseKeyParts(dateKey);
  if (!timeZone) return new Date(y, m - 1, d, 12, 0, 0, 0);
  return zonedWallTimeToUtc(y, m, d, 12, 0, 0, 0, timeZone);
}

/** Inclusive calendar-day range for Meal.date queries. */
export function localDayRange(dateKey: string, timeZone?: string): { start: Date; end: Date } {
  const { y, m, d } = parseKeyParts(dateKey);
  if (!timeZone) {
    return {
      start: new Date(y, m - 1, d, 0, 0, 0, 0),
      end: new Date(y, m - 1, d, 23, 59, 59, 999),
    };
  }
  return {
    start: zonedWallTimeToUtc(y, m, d, 0, 0, 0, 0, timeZone),
    end: zonedWallTimeToUtc(y, m, d, 23, 59, 59, 999, timeZone),
  };
}

export function isValidDateKey(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const { y, m, d } = parseKeyParts(value);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Calendar arithmetic on a yyyy-MM-dd key. Independent of timezone. */
export function addDaysToKey(dateKey: string, days: number): string {
  const { y, m, d } = parseKeyParts(dateKey);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return `${utc.getUTCFullYear()}-${pad2(utc.getUTCMonth() + 1)}-${pad2(utc.getUTCDate())}`;
}
