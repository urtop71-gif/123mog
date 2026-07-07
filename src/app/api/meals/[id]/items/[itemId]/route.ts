import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// DELETE /api/meals/[id]/items/[itemId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, itemId } = await params;

  // Verify meal belongs to user
  const meal = await prisma.meal.findUnique({
    where: { id },
  });

  if (!meal) {
    return NextResponse.json({ error: "Meal not found" }, { status: 404 });
  }

  if (meal.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify meal item belongs to this meal
  const mealItem = await prisma.mealItem.findUnique({
    where: { id: itemId },
  });

  if (!mealItem || mealItem.mealId !== id) {
    return NextResponse.json(
      { error: "Meal item not found" },
      { status: 404 },
    );
  }

  await prisma.mealItem.delete({
    where: { id: itemId },
  });

  return NextResponse.json({ success: true });
}
