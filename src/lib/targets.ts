export const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const GENERAL_SODIUM_TARGET_MG = 2300;
export const HYPERTENSION_SODIUM_TARGET_MG = 2000;

/** NIH-style floors for an unsupervised calorie target. Manual targets are not clamped. */
export function autoCalorieFloor(gender: string | null | undefined): number {
  return gender === "male" ? 1500 : 1200;
}

export function mifflinStJeorBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: string,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === "male") return base + 5;
  if (gender === "female") return base - 161;
  return base - 78;
}

export interface TargetInput {
  weight: number | null;
  height: number | null;
  age: number | null;
  gender: string | null;
  activityLevel: string | null;
  goalWeight: number | null;
  healthConditions: string | null;
  targetsManual: boolean;
  bmr: number | null;
  tdee: number | null;
  dailyTarget: number | null;
  proteinTarget: number | null;
  fatTarget: number | null;
  carbsTarget: number | null;
  sodiumTarget: number | null;
  manualDaily?: number | null;
  manualProtein?: number | null;
  manualFat?: number | null;
  manualCarbs?: number | null;
  manualSodium?: number | null;
}

export interface TargetResult {
  bmr: number | null;
  tdee: number | null;
  dailyTarget: number | null;
  proteinTarget: number | null;
  fatTarget: number | null;
  carbsTarget: number | null;
  sodiumTarget: number | null;
  calorieFloorApplied: boolean;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function computeTargets(input: TargetInput): TargetResult {
  const w = input.weight;
  const h = input.height;
  const a = input.age;
  const g = input.gender;
  const al = input.activityLevel;

  let bmr = input.bmr;
  let tdee = input.tdee;
  let dailyTarget = input.dailyTarget;
  let proteinTarget = input.proteinTarget;
  let fatTarget = input.fatTarget;
  let carbsTarget = input.carbsTarget;
  let sodiumTarget = input.sodiumTarget ?? GENERAL_SODIUM_TARGET_MG;
  let calorieFloorApplied = false;

  if (w && h && a && g) {
    bmr = mifflinStJeorBmr(w, h, a, g);
  }

  if (!input.targetsManual && bmr && al) {
    const mult = ACTIVITY_MULTIPLIERS[al] ?? 1.55;
    tdee = bmr * mult;

    const gW = input.goalWeight;
    if (gW && w && gW < w) dailyTarget = tdee - 500;
    else if (gW && w && gW > w) dailyTarget = tdee + 300;
    else dailyTarget = tdee;

    const floor = autoCalorieFloor(g);
    if (dailyTarget < floor) {
      dailyTarget = floor;
      calorieFloorApplied = true;
    }

    if (w) proteinTarget = round1(w * 2.0);
    fatTarget = round1((dailyTarget * 0.25) / 9);
    carbsTarget = round1((dailyTarget - (proteinTarget ?? 50) * 4 - fatTarget * 9) / 4);

    const conditions = (input.healthConditions ?? "").toLowerCase();
    if (conditions) {
      if (conditions.includes("diabetes") || conditions.includes("당뇨")) {
        if (w) proteinTarget = round1(w * 1.5);
        fatTarget = round1((dailyTarget * 0.3) / 9);
        carbsTarget = round1((dailyTarget - (proteinTarget ?? 60) * 4 - fatTarget * 9) / 4);
        if (carbsTarget > 200) carbsTarget = 200;
      }
      if (
        conditions.includes("high_cholesterol") ||
        conditions.includes("고지혈") ||
        conditions.includes("콜레스테롤")
      ) {
        fatTarget = round1((dailyTarget * 0.2) / 9);
        carbsTarget = round1((dailyTarget - (proteinTarget ?? 60) * 4 - fatTarget * 9) / 4);
      }
      if (conditions.includes("hypertension") || conditions.includes("고혈압")) {
        sodiumTarget = HYPERTENSION_SODIUM_TARGET_MG;
      } else {
        sodiumTarget = GENERAL_SODIUM_TARGET_MG;
      }
    }
  }

  if (input.targetsManual) {
    if (input.manualDaily != null) dailyTarget = input.manualDaily;
    if (input.manualProtein != null) proteinTarget = input.manualProtein;
    if (input.manualFat != null) fatTarget = input.manualFat;
    if (input.manualCarbs != null) carbsTarget = input.manualCarbs;
    if (input.manualSodium != null) sodiumTarget = input.manualSodium;
  }

  return {
    bmr: bmr != null ? round1(bmr) : null,
    tdee: tdee != null ? round1(tdee) : null,
    dailyTarget: dailyTarget != null ? Math.round(dailyTarget) : null,
    proteinTarget,
    fatTarget,
    carbsTarget,
    sodiumTarget,
    calorieFloorApplied,
  };
}
