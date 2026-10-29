import { addDaysToKey } from "@/lib/dates";

/**
 * Calorie model used everywhere:
 *
 * - Intake is food calories.
 * - The eating goal (dailyTarget) is TDEE — BMR × activity, then adjusted
 *   for the weight goal. Typical activity is already inside that goal, so
 *   "on target" compares intake with dailyTarget and does not subtract
 *   exercise a second time.
 * - Expenditure is measured burn: basal (BmrLog, else User.bmr) + logged
 *   exercise (manual and HealthKit added together).
 * - Energy balance is intake − expenditure. It answers "did I eat more
 *   than I burned?" and is labeled separately from the eating goal,
 *   because logged exercise is not the same number as the activity factor
 *   baked into TDEE.
 */

export function expenditure(bmr: number, exercise: number): number {
  return bmr + exercise;
}

/** Null when basal burn is unknown, so the UI does not pretend BMR is 0. */
export function energyBalance(
  intake: number,
  bmr: number | null | undefined,
  exercise: number,
): number | null {
  if (bmr == null || !(bmr > 0)) return null;
  return Math.round(intake - (bmr + exercise));
}

/**
 * A logged day is on target when intake is 85–105% of the eating goal.
 * A few calories (or a huge under-log) is not a hit, and going more than
 * 5% over is not either. The goal already includes the planned deficit.
 */
export function isOnTarget(intake: number, target: number): boolean {
  if (!(target > 0) || !(intake > 0)) return false;
  const ratio = intake / target;
  return ratio >= 0.85 && ratio <= 1.05;
}

/**
 * Consecutive days with any intake, ending today or yesterday.
 * An empty today does not wipe the streak — the day is not over.
 */
export function loggingStreak(
  caloriesByDate: Map<string, number>,
  today: string,
  lookback = 60,
): number {
  const hasLog = (key: string) => (caloriesByDate.get(key) ?? 0) > 0;
  const start = hasLog(today) ? 0 : 1;
  let streak = 0;
  for (let i = start; i < lookback; i++) {
    const key = addDaysToKey(today, -i);
    if (!hasLog(key)) break;
    streak += 1;
  }
  return streak;
}

export function weekOnTarget(
  caloriesByDate: Map<string, number>,
  today: string,
  target: number,
): { logged: number; onTarget: number } {
  let logged = 0;
  let onTarget = 0;
  for (let i = 0; i < 7; i++) {
    const calories = caloriesByDate.get(addDaysToKey(today, -i));
    if (calories != null && calories > 0) {
      logged += 1;
      if (isOnTarget(calories, target)) onTarget += 1;
    }
  }
  return { logged, onTarget };
}
