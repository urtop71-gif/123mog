import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { computeMealItems } from "@/lib/mealItems";
import { mealUpdateSchema } from "@/lib/validation";

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
    const parsed = mealUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { mealType, date, items } = parsed.data;

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
      const mealItems = await computeMealItems(items);

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
