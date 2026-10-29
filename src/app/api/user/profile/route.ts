import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { profileUpdateSchema } from "@/lib/validation";
import { unauthorized } from "@/lib/apiErrors";
import { computeTargets } from "@/lib/targets";
import { deleteUserAccount } from "@/lib/deleteAccount";
import { resolveTimeZone } from "@/lib/dates";

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
  timezone: true,
} as const;

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
      timezone,
    } = parsed.data;

    const manual = targetsManual ?? user.targetsManual;
    const targets = computeTargets({
      weight: weight ?? user.weight,
      height: height ?? user.height,
      age: age ?? user.age,
      gender: gender ?? user.gender,
      activityLevel: activityLevel ?? user.activityLevel,
      goalWeight: goalWeight ?? user.goalWeight,
      healthConditions: healthConditions ?? user.healthConditions,
      targetsManual: manual,
      bmr: user.bmr,
      tdee: user.tdee,
      dailyTarget: user.dailyTarget,
      proteinTarget: user.proteinTarget,
      fatTarget: user.fatTarget,
      carbsTarget: user.carbsTarget,
      sodiumTarget: user.sodiumTarget,
      manualDaily,
      manualProtein,
      manualFat,
      manualCarbs,
      manualSodium,
    });

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
        bmr: targets.bmr,
        tdee: targets.tdee,
        dailyTarget: targets.dailyTarget,
        proteinTarget: targets.proteinTarget,
        fatTarget: targets.fatTarget,
        carbsTarget: targets.carbsTarget,
        sodiumTarget: targets.sodiumTarget,
        targetsManual: manual,
        waterTargetMl: waterTargetMl ?? user.waterTargetMl,
        healthConditions: healthConditions ?? user.healthConditions,
        onboardingDone: onboardingDone ?? user.onboardingDone,
        timezone: timezone !== undefined ? resolveTimeZone(timezone) : user.timezone,
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

  await deleteUserAccount(session.user.id);
  return NextResponse.json({ success: true });
}
