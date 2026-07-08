import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { foodCreateSchema } from "@/lib/validation";

// GET /api/foods?q=searchterm
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  const foods = await prisma.food.findMany({
    where: q ? { name: { contains: q } } : undefined,
    include: {
      servings: true,
    },
    take: 20,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(foods);
}

// POST /api/foods - register a custom food not found in the shared database
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = foodCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const { servings, ...foodData } = parsed.data;

  const food = await prisma.food.create({
    data: {
      ...foodData,
      servings: { create: servings },
    },
    include: { servings: true },
  });

  return NextResponse.json(food, { status: 201 });
}
