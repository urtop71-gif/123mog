import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { profileUpdateSchema } from "@/lib/validation";

const PROFILE_SELECT = {
  id: true, name: true, email: true,
  age: true, gender: true, height: true, weight: true,
  goalWeight: true, activityLevel: true, healthConditions: true,
  bmr: true, tdee: true, dailyTarget: true,
  proteinTarget: true, fatTarget: true, carbsTarget: true,
} as const;

// GET /api/user/profile - fetch current user's profile
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: PROFILE_SELECT,
  });

  if (!user) {
    return NextResponse.json({ error: "No user found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// PUT /api/user/profile - update body metrics and recalculate targets
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 404 });
    }

    const { age, gender, height, weight, goalWeight, activityLevel, healthConditions } = parsed.data;

    // Calculate BMR using Mifflin-St Jeor equation
    let bmr = user.bmr;
    let tdee = user.tdee;
    let dailyTarget = user.dailyTarget;
    let proteinTarget = user.proteinTarget;
    let fatTarget = user.fatTarget;
    let carbsTarget = user.carbsTarget;

    const w = weight ?? user.weight;
    const h = height ?? user.height;
    const a = age ?? user.age;
    const al = activityLevel ?? user.activityLevel;

    if (w && h && a && gender) {
      if (gender === "male") {
        bmr = 10 * w + 6.25 * h - 5 * a + 5;
      } else if (gender === "female") {
        bmr = 10 * w + 6.25 * h - 5 * a - 161;
      } else {
        bmr = 10 * w + 6.25 * h - 5 * a - 78; // average
      }
    }

    if (bmr && al) {
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
      if (gW && weight && gW < weight) {
        dailyTarget = tdee - 500; // cutting
      } else if (gW && weight && gW > weight) {
        dailyTarget = tdee + 300; // bulking
      } else {
        dailyTarget = tdee; // maintenance
      }

      if (w) {
        proteinTarget = Math.round(w * 2.0 * 10) / 10;
      }
      if (dailyTarget) {
        fatTarget = Math.round((dailyTarget * 0.25) / 9 * 10) / 10;
        carbsTarget = Math.round(((dailyTarget - (proteinTarget ?? 50) * 4 - (fatTarget ?? 50) * 9) / 4) * 10) / 10;
      }
    }

    // Apply health condition adjustments
    const conditions = (healthConditions ?? user.healthConditions ?? "").toLowerCase();
    if (conditions) {
      if (conditions.includes('diabetes') || conditions.includes('당뇨')) {
        if (w) proteinTarget = Math.round(w * 1.5 * 10) / 10;
        if (dailyTarget) {
          fatTarget = Math.round((dailyTarget * 0.30) / 9 * 10) / 10;
          carbsTarget = Math.round(((dailyTarget - (proteinTarget ?? 60) * 4 - (fatTarget ?? 50) * 9) / 4) * 10) / 10;
          if (carbsTarget && carbsTarget > 200) carbsTarget = 200;
        }
      }
      if (conditions.includes('high_cholesterol') || conditions.includes('고지혈') || conditions.includes('콜레스테롤')) {
        if (dailyTarget) {
          fatTarget = Math.round((dailyTarget * 0.20) / 9 * 10) / 10;
          carbsTarget = Math.round(((dailyTarget - (proteinTarget ?? 60) * 4 - (fatTarget ?? 40) * 9) / 4) * 10) / 10;
        }
      }
      if (conditions.includes('hypertension') || conditions.includes('고혈압')) {
        // No macro change; sodium warning in UI
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
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
        healthConditions: healthConditions ?? user.healthConditions,
      },
      select: PROFILE_SELECT,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
