import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { computeMealItems } from "@/lib/mealItems";
import { mealCreateSchema } from "@/lib/validation";
import { augmentHealthTags } from "@/lib/healthTags";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");

  if (!dateStr) {
    return NextResponse.json({ error: "date query parameter is required" }, { status: 400 });
  }

  const startDate = new Date(dateStr + "T00:00:00");
  const endDate = new Date(dateStr + "T23:59:59.999");

  const meals = await prisma.meal.findMany({
    where: {
      userId: session.user.id,
      date: { gte: startDate, lte: endDate },
    },
    include: {
      items: { include: { food: { select: { name: true, healthTags: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const grouped = meals.map((meal) => ({
    id: meal.id,
    mealType: meal.mealType,
    totalCalories: meal.items.reduce((sum, item) => sum + item.totalCalories, 0),
    totalProtein: meal.items.reduce((sum, item) => sum + item.totalProtein, 0),
    totalFat: meal.items.reduce((sum, item) => sum + item.totalFat, 0),
    totalCarbs: meal.items.reduce((sum, item) => sum + item.totalCarbs, 0),
    totalSodium: meal.items.some((item) => item.totalSodium != null)
      ? meal.items.reduce((sum, item) => sum + (item.totalSodium ?? 0), 0)
      : null,
    items: meal.items.map((item) => ({
      id: item.id,
      foodId: item.foodId,
      foodName: item.food.name,
      healthTags: augmentHealthTags(item.food.healthTags, {
        carbsPer100g: item.totalGrams > 0 ? (item.totalCarbs / item.totalGrams) * 100 : null,
        fatPer100g: item.totalGrams > 0 ? (item.totalFat / item.totalGrams) * 100 : null,
        sodiumPer100g: item.totalGrams > 0 && item.totalSodium != null ? (item.totalSodium / item.totalGrams) * 100 : null,
      }),
      quantity: item.quantity,
      unitName: item.unitName,
      totalCalories: item.totalCalories,
      totalProtein: item.totalProtein,
      totalFat: item.totalFat,
      totalCarbs: item.totalCarbs,
      totalSodium: item.totalSodium,
    })),
  }));

  return NextResponse.json(grouped);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = mealCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { mealType, date, items } = parsed.data;

    // Look up all foods and calculate nutrition
    const mealItems = await computeMealItems(items);

    const mealDate = date ? new Date(date + "T12:00:00") : new Date();

    const meal = await prisma.meal.create({
      data: {
        userId: session.user.id,
        mealType,
        date: mealDate,
        items: {
          create: mealItems,
        },
      },
      include: {
        items: {
          include: { food: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    console.error("Create meal error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
