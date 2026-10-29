import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { mealCopySchema } from "@/lib/validation";
import { localDayRange, parseLocalDateKey } from "@/lib/dates";
import { timeZoneForUser } from "@/lib/userTime";
import { jsonError, unauthorized } from "@/lib/apiErrors";

/** Copy one meal type, or every meal, from one calendar day onto another. */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = mealCopySchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "Invalid input", 400);

  const timeZone = await timeZoneForUser(session.user.id);
  const { start, end } = localDayRange(parsed.data.fromDate, timeZone);
  const meals = await prisma.meal.findMany({
    where: {
      userId: session.user.id,
      date: { gte: start, lte: end },
      ...(parsed.data.mealType ? { mealType: parsed.data.mealType } : {}),
    },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  const withItems = meals.filter((meal) => meal.items.length > 0);
  if (withItems.length === 0) return jsonError("nothing_to_copy", 404);

  const target = parseLocalDateKey(parsed.data.toDate, timeZone);
  const created = await prisma.$transaction(
    withItems.map((meal) =>
      prisma.meal.create({
        data: {
          userId: session.user.id,
          mealType: meal.mealType,
          date: target,
          items: {
            create: meal.items.map((item) => ({
              foodId: item.foodId,
              quantity: item.quantity,
              unitName: item.unitName,
              gramsPerUnit: item.gramsPerUnit,
              totalGrams: item.totalGrams,
              totalCalories: item.totalCalories,
              totalProtein: item.totalProtein,
              totalFat: item.totalFat,
              totalCarbs: item.totalCarbs,
              totalSodium: item.totalSodium,
            })),
          },
        },
        select: { id: true, mealType: true },
      }),
    ),
  );

  return NextResponse.json({ copied: created.length }, { status: 201 });
}
