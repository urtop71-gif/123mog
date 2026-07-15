import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { favoriteSchema } from "@/lib/validation";
import { unauthorized } from "@/lib/apiErrors";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const rows = await prisma.favoriteFood.findMany({
    where: { userId: session.user.id },
    include: { food: { include: { servings: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rows.map((r) => r.food));
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = await request.json();
  const parsed = favoriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const food = await prisma.food.findUnique({ where: { id: parsed.data.foodId } });
  if (!food) return NextResponse.json({ error: "Food not found" }, { status: 404 });

  await prisma.favoriteFood.upsert({
    where: {
      userId_foodId: { userId: session.user.id, foodId: parsed.data.foodId },
    },
    create: { userId: session.user.id, foodId: parsed.data.foodId },
    update: {},
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const foodId = new URL(request.url).searchParams.get("foodId");
  if (!foodId) return NextResponse.json({ error: "foodId required" }, { status: 400 });

  await prisma.favoriteFood.deleteMany({
    where: { userId: session.user.id, foodId },
  });
  return NextResponse.json({ success: true });
}
