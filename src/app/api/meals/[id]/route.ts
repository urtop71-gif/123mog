import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { computeMealItems } from "@/lib/mealItems";
import { mealUpdateSchema } from "@/lib/validation";
import { parseLocalDateKey } from "@/lib/dates";
import { forbidden, unauthorized } from "@/lib/apiErrors";

// PUT /api/meals/[id] - update a meal (add/remove items)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const parsed = mealUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }
    const { mealType, date, items } = parsed.data;

    const existing = await prisma.meal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }
    if (existing.userId !== session.user.id) return forbidden();

    // Resolve food/serving lookups before opening the transaction: these are
    // plain reads on the shared `prisma` client, and running them inside the
    // transaction (against a separate connection than `tx`) can contend with
    // its lock on SQLite and burn through the interactive transaction timeout.
    const mealItems = items && Array.isArray(items) ? await computeMealItems(items) : null;

    const updated = await prisma.$transaction(async (tx) => {
      if (mealType || date) {
        await tx.meal.update({
          where: { id },
          data: {
            ...(mealType && { mealType }),
            ...(date && { date: parseLocalDateKey(date) }),
          },
        });
      }

      if (mealItems) {
        await tx.mealItem.deleteMany({ where: { mealId: id } });
        if (mealItems.length > 0) {
          await tx.mealItem.createMany({
            data: mealItems.map((item) => ({ ...item, mealId: id })),
          });
        }
      }

      return tx.meal.findUnique({
        where: { id },
        include: {
          items: { include: { food: { select: { name: true } } } },
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update meal error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/meals/[id] - delete entire meal
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const { id } = await params;
    const existing = await prisma.meal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }
    if (existing.userId !== session.user.id) return forbidden();

    await prisma.meal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete meal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
