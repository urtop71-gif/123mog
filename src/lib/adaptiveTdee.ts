/**
 * Adaptive TDEE (Total Daily Energy Expenditure)
 *
 * Replaces static BMR×multiplier formulas with a deterministic feedback loop:
 * weight_trend → actual energy balance → back-solve real TDEE.
 *
 * Algorithm inspired by MacroFactor's "dynamic maintenance" approach:
 *   actual_TDEE = avg_daily_calories - (Δweight_kg × 7700 kcal/kg / Δdays)
 *
 * Requires 7+ days of weight logs and meal data to produce an estimate.
 */

import { prisma } from "@/lib/prisma";
import { toLocalDateKey, parseLocalDateKey, addDaysToKey } from "@/lib/dates";

// ─── Config ──────────────────────────────────────────────────────────────────
const MIN_DAYS = 7;                // minimum days of data needed
const EMA_SPAN = 14;              // exponential moving average span (days)
const KCAL_PER_KG = 7700;         // ~7700 kcal deficit ≈ 1 kg fat loss
const MIN_WEIGHT_LOGS = 5;        // minimum weight entries for trend
const TDEE_FLOOR = 1200;          // sanity floor (kcal)
const TDEE_CEIL = 5000;           // sanity ceiling (kcal)

// ─── Weight trend (exponential moving average) ───────────────────────────────

/** Compute EMA weight trend from ordered weight log tuples [dateKey, weight_kg]. */
export function computeWeightTrend(
  logs: { date: string; weight: number }[],
  span = EMA_SPAN
): number | null {
  if (logs.length < 2) return null;

  const alpha = 2 / (span + 1);
  let ema = logs[0].weight;

  for (let i = 1; i < logs.length; i++) {
    ema = alpha * logs[i].weight + (1 - alpha) * ema;
  }

  return Math.round(ema * 10) / 10;
}

// ─── Daily calorie intake from meals ─────────────────────────────────────────

interface DailyIntake {
  date: string;
  calories: number;
}

/** Fetch total calories per day for the last N days from the user's meals. */
export async function getDailyCalorieIntake(
  userId: string,
  days: number
): Promise<DailyIntake[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const meals = await prisma.meal.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    include: {
      items: { select: { totalCalories: true } },
    },
    orderBy: { date: "asc" },
  });

  // Aggregate by local date
  const byDate = new Map<string, number>();
  for (const meal of meals) {
    const dateKey = toLocalDateKey(meal.date);
    const mealCal = meal.items.reduce((sum, item) => sum + item.totalCalories, 0);
    byDate.set(dateKey, (byDate.get(dateKey) || 0) + mealCal);
  }

  return Array.from(byDate.entries())
    .map(([date, calories]) => ({ date, calories: Math.round(calories) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Adaptive TDEE computation ───────────────────────────────────────────────

export interface AdaptiveTdeeResult {
  tdee: number;                    // estimated actual daily expenditure (kcal)
  weightTrend: number;             // current EMA weight (kg)
  avgIntake: number;               // average daily intake over window (kcal)
  weightDelta: number;             // weight change over window (kg)
  daysOfData: number;              // number of days used
  confidence: "low" | "medium" | "high";
  initialEstimate: number;         // original static TDEE estimate
}

/**
 * Compute adaptive TDEE from weight logs + meal data.
 * Returns null if insufficient data (< MIN_DAYS of both weight and meal data).
 */
export async function computeAdaptiveTdee(
  userId: string,
  initialTdee: number
): Promise<AdaptiveTdeeResult | null> {
  // Fetch weight logs (last 30 days, sorted by date)
  const weightLogs = await prisma.weightLog.findMany({
    where: { userId },
    orderBy: { date: "asc" },
    take: 30,
  });

  if (weightLogs.length < MIN_WEIGHT_LOGS) return null;

  // Get daily calorie intake
  const intakeData = await getDailyCalorieIntake(userId, 30);
  if (intakeData.length < MIN_DAYS) return null;

  // Align weight and intake data by date
  const weightByDate = new Map<string, number>(
    weightLogs.map(w => [w.date, w.weight as number])
  );
  
  // Find overlapping dates
  const dates = intakeData
    .map(d => d.date)
    .filter(d => weightByDate.has(d))
    .sort();

  if (dates.length < MIN_DAYS) return null;

  // Build aligned weight series
  const alignedWeights: { date: string; weight: number }[] = [];
  for (const d of dates) {
    const w = weightByDate.get(d);
    if (w === undefined) continue;
    alignedWeights.push({ date: d, weight: w });
  }

  const weightTrend = computeWeightTrend(alignedWeights);
  if (weightTrend === null) return null;

  // Weight change from first to last
  const firstWeight = alignedWeights[0].weight;
  const lastWeight = alignedWeights[alignedWeights.length - 1].weight;
  const weightDelta = Math.round((lastWeight - firstWeight) * 100) / 100;

  // Average daily intake
  const matchingIntakes = dates.map(d => 
    intakeData.find(i => i.date === d)!.calories
  );
  const avgIntake = Math.round(
    matchingIntakes.reduce((s, c) => s + c, 0) / matchingIntakes.length
  );

  // Days between first and last measurement
  const daySpan = dates.length;

  // Energy balance: weight change × kcal per kg ÷ days
  const energyImbalance = (weightDelta * KCAL_PER_KG) / daySpan;

  // Actual TDEE: if gaining weight, TDEE < intake; if losing, TDEE > intake
  const rawTdee = avgIntake - energyImbalance;

  // Clamp to sane range
  const tdee = Math.round(Math.max(TDEE_FLOOR, Math.min(TDEE_CEIL, rawTdee)));

  // Confidence based on days of data
  let confidence: AdaptiveTdeeResult["confidence"] = "low";
  if (daySpan >= 21) confidence = "high";
  else if (daySpan >= 14) confidence = "medium";

  return {
    tdee,
    weightTrend,
    avgIntake,
    weightDelta,
    daysOfData: daySpan,
    confidence,
    initialEstimate: initialTdee,
  };
}

// ─── Target recalculation ────────────────────────────────────────────────────

export interface AdjustedTargets {
  dailyTarget: number;
  proteinTarget: number;
  fatTarget: number;
  carbsTarget: number;
}

/**
 * Adjust macro targets based on adaptive TDEE.
 * Uses the same macro split ratios as the initial calculation.
 */
export function adjustTargets(
  adaptiveTdee: number,
  goalDeficit: number,       // e.g., -500 for weight loss, 0 for maintenance, +300 for bulk
  userPreferredMacroSplit?: { proteinPct?: number; fatPct?: number; carbsPct?: number }
): AdjustedTargets {
  const proteinPct = userPreferredMacroSplit?.proteinPct ?? 30;
  const fatPct = userPreferredMacroSplit?.fatPct ?? 30;
  const carbsPct = userPreferredMacroSplit?.carbsPct ?? 40;

  const dailyTarget = Math.max(TDEE_FLOOR, adaptiveTdee + goalDeficit);

  return {
    dailyTarget: Math.round(dailyTarget),
    proteinTarget: Math.round((dailyTarget * proteinPct) / 100 / 4), // 4 kcal/g
    fatTarget: Math.round((dailyTarget * fatPct) / 100 / 9),         // 9 kcal/g
    carbsTarget: Math.round((dailyTarget * carbsPct) / 100 / 4),     // 4 kcal/g
  };
}
