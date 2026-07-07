import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/foods/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const food = await prisma.food.findUnique({
    where: { id },
    include: {
      servings: true,
    },
  });

  if (!food) {
    return NextResponse.json({ error: "Food not found" }, { status: 404 });
  }

  return NextResponse.json(food);
}
