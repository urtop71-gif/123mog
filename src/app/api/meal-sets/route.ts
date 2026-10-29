import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { mealSetCreateSchema } from "@/lib/validation";
import { jsonError, unauthorized } from "@/lib/apiErrors";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const sets = await prisma.mealSet.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: { food: { select: { name: true, nameEn: true, isAiEstimate: true } } },
      },
    },
  });

  return NextResponse.json(
    sets.map((set) => ({
      id: set.id,
      name: set.name,
      mealType: set.mealType,
      items: set.items.map((item) => ({
        foodId: item.foodId,
        foodName: item.food.name,
        foodNameEn: item.food.nameEn,
        isAiEstimate: item.food.isAiEstimate,
        quantity: item.quantity,
        unitName: item.unitName,
      })),
    })),
  );
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = mealSetCreateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "Invalid input", 400);

  let mealType: string | null = parsed.data.mealType ?? null;
  let items = parsed.data.items ?? [];
  if (parsed.data.mealId) {
    const meal = await prisma.meal.findUnique({
      where: { id: parsed.data.mealId },
      include: { items: true },
    });
    if (!meal || meal.userId !== session.user.id) return jsonError("Meal not found", 404);
    mealType = mealType ?? meal.mealType;
    items = meal.items.map((item) => ({
      foodId: item.foodId,
      quantity: item.quantity,
      unitName: item.unitName,
    }));
  }
  if (items.length === 0) return jsonError("nothing_to_save", 400);

  const created = await prisma.mealSet.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      mealType,
      items: {
        create: items.map((item, index) => ({
          foodId: item.foodId,
          quantity: item.quantity,
          unitName: item.unitName,
          sortOrder: index,
        })),
      },
    },
    select: { id: true, name: true },
  });

  return NextResponse.json(created, { status: 201 });
}
