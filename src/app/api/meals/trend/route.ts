import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { addDaysToKey, localDayRange, toLocalDateKey } from "@/lib/dates";
import { unauthorized } from "@/lib/apiErrors";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") === "month" ? "month" : "week";
  const days = range === "month" ? 30 : 7;

  const today = toLocalDateKey();
  const startKey = addDaysToKey(today, -(days - 1));
  const { start } = localDayRange(startKey);
  const { end } = localDayRange(today);

  const [meals, exerciseLogs] = await Promise.all([
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
  ]);

  const byDate = new Map<string, { calories: number; protein: number; fat: number; carbs: number }>();
  for (const meal of meals) {
    const key = toLocalDateKey(meal.date);
    const bucket = byDate.get(key) ?? { calories: 0, protein: 0, fat: 0, carbs: 0 };
    for (const item of meal.items) {
      bucket.calories += item.totalCalories;
      bucket.protein += item.totalProtein;
      bucket.fat += item.totalFat;
      bucket.carbs += item.totalCarbs;
    }
    byDate.set(key, bucket);
  }

  const exerciseByDate = new Map(exerciseLogs.map((log) => [log.date, log.calories]));

  const series = Array.from({ length: days }, (_, i) => {
    const key = addDaysToKey(today, -(days - 1 - i));
    const bucket = byDate.get(key) ?? { calories: 0, protein: 0, fat: 0, carbs: 0 };
    return { date: key, ...bucket, exercise: exerciseByDate.get(key) ?? 0 };
  });

  return NextResponse.json(series);
}
