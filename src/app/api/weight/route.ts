import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { weightLogSchema } from "@/lib/validation";
import { toLocalDateKey } from "@/lib/dates";
import { timeZoneForUser } from "@/lib/userTime";
import { computeTargets } from "@/lib/targets";
import { unauthorized } from "@/lib/apiErrors";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const limit = Math.min(Number(new URL(request.url).searchParams.get("limit") || 30), 90);
  const logs = await prisma.weightLog.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    take: limit,
  });
  return NextResponse.json(logs);
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = await request.json();
  const parsed = weightLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const timeZone = await timeZoneForUser(session.user.id);
  const today = toLocalDateKey(new Date(), timeZone);
  const date = parsed.data.date || today;
  const log = await prisma.weightLog.upsert({
    where: { userId_date: { userId: session.user.id, date } },
    create: { userId: session.user.id, date, weight: parsed.data.weight },
    update: { weight: parsed.data.weight },
  });

  // keep profile weight in sync with the latest log, and recompute auto targets
  if (date === today) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user) {
      const targets = computeTargets({
        weight: parsed.data.weight,
        height: user.height,
        age: user.age,
        gender: user.gender,
        activityLevel: user.activityLevel,
        goalWeight: user.goalWeight,
        healthConditions: user.healthConditions,
        targetsManual: user.targetsManual,
        bmr: user.bmr,
        tdee: user.tdee,
        dailyTarget: user.dailyTarget,
        proteinTarget: user.proteinTarget,
        fatTarget: user.fatTarget,
        carbsTarget: user.carbsTarget,
        sodiumTarget: user.sodiumTarget,
      });
      await prisma.user.update({
        where: { id: user.id },
        data: {
          weight: parsed.data.weight,
          bmr: targets.bmr,
          ...(user.targetsManual
            ? {}
            : {
                tdee: targets.tdee,
                dailyTarget: targets.dailyTarget,
                proteinTarget: targets.proteinTarget,
                fatTarget: targets.fatTarget,
                carbsTarget: targets.carbsTarget,
                sodiumTarget: targets.sodiumTarget,
              }),
        },
      });
    }
  }

  return NextResponse.json(log);
}
