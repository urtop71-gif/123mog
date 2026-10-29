export interface ExerciseSourceLog {
  source: string;
  calories: number;
}

export interface CombinedExercise {
  calories: number;
  manualCalories: number | null;
  healthkitCalories: number | null;
  source: "manual" | "healthkit" | "both" | null;
}

/** Manual entry and HealthKit each keep their own row. Totals add them. */
export function combineExerciseLogs(logs: ExerciseSourceLog[]): CombinedExercise {
  const manual = logs.find((l) => l.source === "manual");
  const healthkit = logs.find((l) => l.source === "healthkit");
  let source: CombinedExercise["source"] = null;
  if (manual && healthkit) source = "both";
  else if (manual) source = "manual";
  else if (healthkit) source = "healthkit";
  return {
    calories: (manual?.calories ?? 0) + (healthkit?.calories ?? 0),
    manualCalories: manual ? manual.calories : null,
    healthkitCalories: healthkit ? healthkit.calories : null,
    source,
  };
}

export function sumExerciseByDate(
  logs: { date: string; calories: number }[],
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const log of logs) {
    totals.set(log.date, (totals.get(log.date) ?? 0) + log.calories);
  }
  return totals;
}
