import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PUT /api/meals/[id] - update a meal (add/remove items)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { mealType, date, items } = body;

    const existing = await prisma.meal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update meal type/date if provided
    if (mealType || date) {
      await prisma.meal.update({
        where: { id },
        data: {
          ...(mealType && { mealType }),
          ...(date && { date: new Date(date + "T12:00:00") }),
        },
      });
    }

    // If items are provided, replace all items
    if (items && Array.isArray(items)) {
      // Delete existing items
      await prisma.mealItem.deleteMany({ where: { mealId: id } });

      // Create new items
      const mealItems = await Promise.all(
        items.map(async (item: { foodId: string; quantity: number; unitName: string }) => {
          const food = await prisma.food.findUnique({
            where: { id: item.foodId },
            include: { servings: true },
          });
          if (!food) throw new Error(`Food not found: ${item.foodId}`);

          const serving = food.servings.find((s) => s.unitName === item.unitName);
          if (!serving) throw new Error(`Unit "${item.unitName}" not found for "${food.name}"`);

          const totalGrams = item.quantity * serving.gramsPerUnit;
          const factor = totalGrams / 100;

          return {
            foodId: food.id,
            quantity: item.quantity,
            unitName: item.unitName,
            gramsPerUnit: serving.gramsPerUnit,
            totalGrams,
            totalCalories: Math.round(food.caloriesPer100g * factor * 10) / 10,
            totalProtein: Math.round(food.proteinPer100g * factor * 10) / 10,
            totalFat: Math.round(food.fatPer100g * factor * 10) / 10,
            totalCarbs: Math.round(food.carbsPer100g * factor * 10) / 10,
          };
        })
      );

      await prisma.mealItem.createMany({ data: mealItems.map(item => ({ ...item, mealId: id })) });
    }

    // Return updated meal
    const updated = await prisma.meal.findUnique({
      where: { id },
      include: {
        items: { include: { food: { select: { name: true } } } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update meal error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/meals/[id] - delete entire meal
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.meal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.meal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete meal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
