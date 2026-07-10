import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { profileUpdateSchema } from "@/lib/validation";
import { unauthorized } from "@/lib/apiErrors";

const PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  age: true,
  gender: true,
  height: true,
  weight: true,
  goalWeight: true,
  activityLevel: true,
  healthConditions: true,
  bmr: true,
  tdee: true,
  dailyTarget: true,
  proteinTarget: true,
  fatTarget: true,
  carbsTarget: true,
  sodiumTarget: true,
  targetsManual: true,
  waterTargetMl: true,
  onboardingDone: true,
} as const;

const GENERAL_SODIUM_TARGET_MG = 2300;
const HYPERTENSION_SODIUM_TARGET_MG = 2000;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: PROFILE_SELECT,
  });

  if (!user) {
    return NextResponse.json({ error: "No user found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 404 });
    }

    const {
      age,
      gender,
      height,
      weight,
      goalWeight,
      activityLevel,
      healthConditions,
      targetsManual,
      dailyTarget: manualDaily,
      proteinTarget: manualProtein,
      fatTarget: manualFat,
      carbsTarget: manualCarbs,
      sodiumTarget: manualSodium,
      waterTargetMl,
      onboardingDone,
      name,
    } = parsed.data;

    const w = weight ?? user.weight;
    const h = height ?? user.height;
    const a = age ?? user.age;
    const g = gender ?? user.gender;
    const al = activityLevel ?? user.activityLevel;
    const manual = targetsManual ?? user.targetsManual;

    let bmr = user.bmr;
    let tdee = user.tdee;
    let dailyTarget = user.dailyTarget;
    let proteinTarget = user.proteinTarget;
    let fatTarget = user.fatTarget;
    let carbsTarget = user.carbsTarget;
    let sodiumTarget = user.sodiumTarget ?? GENERAL_SODIUM_TARGET_MG;

    if (w && h && a && g) {
      if (g === "male") {
        bmr = 10 * w + 6.25 * h - 5 * a + 5;
      } else if (g === "female") {
        bmr = 10 * w + 6.25 * h - 5 * a - 161;
      } else {
        bmr = 10 * w + 6.25 * h - 5 * a - 78;
      }
    }

    if (!manual && bmr && al) {
      const multipliers: Record<string, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9,
      };
      const mult = multipliers[al] ?? 1.55;
      tdee = bmr * mult;

      const gW = goalWeight ?? user.goalWeight;
      if (gW && w && gW < w) {
        dailyTarget = tdee - 500;
      } else if (gW && w && gW > w) {
        dailyTarget = tdee + 300;
      } else {
        dailyTarget = tdee;
      }

      if (w) {
        proteinTarget = Math.round(w * 2.0 * 10) / 10;
      }
      if (dailyTarget) {
        fatTarget = Math.round((dailyTarget * 0.25) / 9);
        carbsTarget = Math.round(
          (dailyTarget - (proteinTarget ?? 50) * 4 - (fatTarget ?? 50) * 9) / 4
        );
      }

      const conditions = (healthConditions ?? user.healthConditions ?? "").toLowerCase();
      if (conditions) {
        if (conditions.includes("diabetes") || conditions.includes("당뇨")) {
          if (w) proteinTarget = Math.round(w * 1.5 * 10) / 10;
          if (dailyTarget) {
            fatTarget = Math.round((dailyTarget * 0.3) / 9);
            carbsTarget = Math.round(
              (dailyTarget - (proteinTarget ?? 60) * 4 - (fatTarget ?? 50) * 9) / 4
            );
            if (carbsTarget && carbsTarget > 200) carbsTarget = 200;
          }
        }
        if (
          conditions.includes("high_cholesterol") ||
          conditions.includes("고지혈") ||
          conditions.includes("콜레스테롤")
        ) {
          if (dailyTarget) {
            fatTarget = Math.round((dailyTarget * 0.2) / 9);
            carbsTarget = Math.round(
              (dailyTarget - (proteinTarget ?? 60) * 4 - (fatTarget ?? 40) * 9) / 4
            );
          }
        }
        if (conditions.includes("hypertension") || conditions.includes("고혈압")) {
          sodiumTarget = HYPERTENSION_SODIUM_TARGET_MG;
        } else {
          sodiumTarget = GENERAL_SODIUM_TARGET_MG;
        }
      }
    }

    if (manual) {
      if (manualDaily != null) dailyTarget = manualDaily;
      if (manualProtein != null) proteinTarget = manualProtein;
      if (manualFat != null) fatTarget = manualFat;
      if (manualCarbs != null) carbsTarget = manualCarbs;
      if (manualSodium != null) sodiumTarget = manualSodium;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name !== undefined ? name : user.name,
        age: age ?? user.age,
        gender: gender ?? user.gender,
        height: height ?? user.height,
        weight: weight ?? user.weight,
        goalWeight: goalWeight ?? user.goalWeight,
        activityLevel: activityLevel ?? user.activityLevel,
        bmr: bmr ? Math.round(bmr * 10) / 10 : user.bmr,
        tdee: tdee ? Math.round(tdee * 10) / 10 : user.tdee,
        dailyTarget: dailyTarget ? Math.round(dailyTarget) : user.dailyTarget,
        proteinTarget,
        fatTarget,
        carbsTarget,
        sodiumTarget,
        targetsManual: manual,
        waterTargetMl: waterTargetMl ?? user.waterTargetMl,
        healthConditions: healthConditions ?? user.healthConditions,
        onboardingDone: onboardingDone ?? user.onboardingDone,
      },
      select: PROFILE_SELECT,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  await prisma.user.delete({ where: { id: session.user.id } });
  return NextResponse.json({ success: true });
}
