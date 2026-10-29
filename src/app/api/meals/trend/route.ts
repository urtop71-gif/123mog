import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { addDaysToKey, localDayRange, resolveTimeZone, toLocalDateKey } from "@/lib/dates";
import { energyBalance } from "@/lib/calories";
import { sumExerciseByDate } from "@/lib/exercise";
import { unauthorized } from "@/lib/apiErrors";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") === "month" ? "month" : "week";
  const days = range === "month" ? 30 : 7;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { bmr: true, timezone: true, dailyTarget: true },
  });
  const timeZone = resolveTimeZone(user?.timezone);
  const today = toLocalDateKey(new Date(), timeZone);
  const startKey = addDaysToKey(today, -(days - 1));
  const { start } = localDayRange(startKey, timeZone);
  const { end } = localDayRange(today, timeZone);
  const target = user?.dailyTarget ?? 2000;

  const [meals, exerciseLogs, bmrLogs] = await Promise.all([
    prisma.meal.findMany({
      where: {
        userId: session.user.id,
        date: { gte: start, lte: end },
      },
      include: { items: true },
    }),
    prisma.exerciseLog.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startKey, lte: today },
      },
      select: { date: true, calories: true },
    }),
    // Fetch every BmrLog up to today (not just within the range) so a day
    // with no entry can carry forward the most recent value known by then.
    prisma.bmrLog.findMany({
      where: { userId: session.user.id, date: { lte: today } },
      orderBy: { date: "asc" },
      select: { date: true, bmr: true },
    }),
  ]);

  const byDate = new Map<string, { calories: number; protein: number; fat: number; carbs: number }>();
  for (const meal of meals) {
    const key = toLocalDateKey(meal.date, timeZone);
    const bucket = byDate.get(key) ?? { calories: 0, protein: 0, fat: 0, carbs: 0 };
    for (const item of meal.items) {
      bucket.calories += item.totalCalories;
      bucket.protein += item.totalProtein;
      bucket.fat += item.totalFat;
      bucket.carbs += item.totalCarbs;
    }
    byDate.set(key, bucket);
  }

  const exerciseByDate = sumExerciseByDate(exerciseLogs);

  let bmrLogIdx = 0;
  let carriedBmr = user?.bmr ? Math.round(user.bmr) : 0;

  const series = Array.from({ length: days }, (_, i) => {
    const key = addDaysToKey(today, -(days - 1 - i));
    const bucket = byDate.get(key) ?? { calories: 0, protein: 0, fat: 0, carbs: 0 };
    while (bmrLogIdx < bmrLogs.length && bmrLogs[bmrLogIdx].date <= key) {
      carriedBmr = bmrLogs[bmrLogIdx].bmr;
      bmrLogIdx++;
    }
    const exercise = exerciseByDate.get(key) ?? 0;
    return {
      date: key,
      ...bucket,
      exercise,
      bmr: carriedBmr,
      expenditure: carriedBmr + exercise,
      balance: energyBalance(bucket.calories, carriedBmr, exercise),
      target,
    };
  });

  return NextResponse.json(series);
}
