import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { addDaysToKey, localDayRange, resolveTimeZone, toLocalDateKey } from "@/lib/dates";
import { loggingStreak, weekOnTarget } from "@/lib/calories";
import { unauthorized } from "@/lib/apiErrors";

/** Logging streak + weekly eating-goal progress for dashboard widgets */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      dailyTarget: true,
      healthConditions: true,
      sodiumTarget: true,
      timezone: true,
      bmr: true,
    },
  });
  const timeZone = resolveTimeZone(user?.timezone);
  const today = toLocalDateKey(new Date(), timeZone);
  const target = user?.dailyTarget ?? 2000;

  const startKey = addDaysToKey(today, -59);
  const { start } = localDayRange(startKey, timeZone);
  const { end } = localDayRange(today, timeZone);

  const [meals, bmrLog] = await Promise.all([
    prisma.meal.findMany({
      where: { userId: session.user.id, date: { gte: start, lte: end } },
      include: { items: true },
    }),
    prisma.bmrLog.findFirst({
      where: { userId: session.user.id, date: { lte: today } },
      orderBy: { date: "desc" },
      select: { bmr: true },
    }),
  ]);

  const byDate = new Map<string, number>();
  for (const meal of meals) {
    const key = toLocalDateKey(meal.date, timeZone);
    const cals = meal.items.reduce((s, i) => s + i.totalCalories, 0);
    byDate.set(key, (byDate.get(key) ?? 0) + cals);
  }

  const week = weekOnTarget(byDate, today, target);
  const bmr = bmrLog?.bmr ?? (user?.bmr ? Math.round(user.bmr) : null);

  return NextResponse.json({
    streak: loggingStreak(byDate, today),
    weekDaysLogged: week.logged,
    weekDaysOnTarget: week.onTarget,
    dailyTarget: target,
    healthConditions: user?.healthConditions ?? "",
    sodiumTarget: user?.sodiumTarget ?? 2300,
    bmr,
  });
}
