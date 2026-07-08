import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
    items: meal.items.map((item) => ({
      id: item.id,
      foodId: item.foodId,
      foodName: item.food.name,
      healthTags: item.food.healthTags,
      quantity: item.quantity,
      unitName: item.unitName,
      totalCalories: item.totalCalories,
      totalProtein: item.totalProtein,
      totalFat: item.totalFat,
      totalCarbs: item.totalCarbs,
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
    const { mealType, date, items } = body;

    if (!mealType || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "mealType and items array are required" },
        { status: 400 }
      );
    }

    // Look up all foods and calculate nutrition
    const mealItems = await Promise.all(
      items.map(async (item: { foodId: string; quantity: number; unitName: string }) => {
        const food = await prisma.food.findUnique({
          where: { id: item.foodId },
          include: { servings: true },
        });

        if (!food) {
          throw new Error(`Food not found: ${item.foodId}`);
        }

        const serving = food.servings.find((s) => s.unitName === item.unitName);
        if (!serving) {
          throw new Error(`Unit "${item.unitName}" not found for food "${food.name}"`);
        }

        const gramsPerUnit = serving.gramsPerUnit;
        const totalGrams = item.quantity * gramsPerUnit;
        const factor = totalGrams / 100;

        return {
          foodId: food.id,
          quantity: item.quantity,
          unitName: item.unitName,
          gramsPerUnit,
          totalGrams,
          totalCalories: Math.round(food.caloriesPer100g * factor * 10) / 10,
          totalProtein: Math.round(food.proteinPer100g * factor * 10) / 10,
          totalFat: Math.round(food.fatPer100g * factor * 10) / 10,
          totalCarbs: Math.round(food.carbsPer100g * factor * 10) / 10,
        };
      })
    );

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
