import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { foodUpdateSchema } from "@/lib/validation";
import { augmentHealthTags } from "@/lib/healthTags";
import { forbidden, unauthorized } from "@/lib/apiErrors";
import { toPublicFood } from "@/lib/foodPublic";

// GET /api/foods/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  const food = await prisma.food.findUnique({
    where: { id },
    include: { servings: true },
  });

  if (!food) {
    return NextResponse.json({ error: "Food not found" }, { status: 404 });
  }

  const pub = toPublicFood(food, session.user.id);
  return NextResponse.json({
    ...pub,
    healthTags: augmentHealthTags(food.healthTags, food),
  });
}

// PATCH /api/foods/[id] — owner of a custom food only
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  const existing = await prisma.food.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Food not found" }, { status: 404 });
  if (!existing.isCustom || existing.userId !== session.user.id) return forbidden();

  const body = await request.json().catch(() => null);
  const parsed = foodUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }

  const { servings, ...foodData } = parsed.data;
  const food = await prisma.food.update({
    where: { id },
    data: {
      ...foodData,
      userId: session.user.id,
      isCustom: true,
      servings: { deleteMany: {}, create: servings },
    },
    include: { servings: true },
  });

  const pub = toPublicFood(food, session.user.id);
  return NextResponse.json({
    ...pub,
    healthTags: augmentHealthTags(food.healthTags, food),
  });
}

// DELETE /api/foods/[id] — owner only. Refused when a meal still references it.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  const existing = await prisma.food.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Food not found" }, { status: 404 });
  if (!existing.isCustom || existing.userId !== session.user.id) return forbidden();

  const used = await prisma.mealItem.count({ where: { foodId: id } });
  if (used > 0) {
    return NextResponse.json({ error: "food_in_use" }, { status: 409 });
  }

  await prisma.food.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
