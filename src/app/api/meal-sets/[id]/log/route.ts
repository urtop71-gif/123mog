import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { mealSetLogSchema } from "@/lib/validation";
import { computeMealItems } from "@/lib/mealItems";
import { parseLocalDateKey, toLocalDateKey } from "@/lib/dates";
import { timeZoneForUser } from "@/lib/userTime";
import { forbidden, jsonError, unauthorized } from "@/lib/apiErrors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  const set = await prisma.mealSet.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!set) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (set.userId !== session.user.id) return forbidden();
  if (set.items.length === 0) return jsonError("empty_set", 400);

  const body = await request.json().catch(() => ({}));
  const parsed = mealSetLogSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  const timeZone = await timeZoneForUser(session.user.id);
  const dateKey = parsed.data.date || toLocalDateKey(new Date(), timeZone);
  const mealType = parsed.data.mealType || set.mealType || "lunch";

  let mealItems;
  try {
    mealItems = await computeMealItems(
      set.items.map((item) => ({
        foodId: item.foodId,
        quantity: item.quantity,
        unitName: item.unitName,
      })),
    );
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid item", 400);
  }

  const meal = await prisma.meal.create({
    data: {
      userId: session.user.id,
      mealType,
      date: parseLocalDateKey(dateKey, timeZone),
      items: { create: mealItems },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: meal.id }, { status: 201 });
}
