import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/foods?q=searchterm&category=korean
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const category = searchParams.get("category");

  const where: Record<string, unknown> = {};

  if (q) {
    where.name = { contains: q };
  }

  if (category) {
    where.category = category;
  }

  const foods = await prisma.food.findMany({
    where,
    include: {
      servings: true,
    },
    take: 20,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(foods);
}
