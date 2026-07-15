import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { foodCreateSchema } from "@/lib/validation";
import { augmentHealthTags } from "@/lib/healthTags";
import { unauthorized } from "@/lib/apiErrors";

// GET /api/foods?q=searchterm — shared foods + all users' custom foods
export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const recent = searchParams.get("recent") === "1";
  const favorites = searchParams.get("favorites") === "1";

  if (favorites) {
    if (!userId) return unauthorized();
    const rows = await prisma.favoriteFood.findMany({
      where: { userId },
      include: { food: { include: { servings: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json(
      rows.map((r) => ({
        ...r.food,
        healthTags: augmentHealthTags(r.food.healthTags, r.food),
        isFavorite: true,
      })),
    );
  }

  if (recent) {
    if (!userId) return unauthorized();
    const items = await prisma.mealItem.findMany({
      where: { meal: { userId } },
      orderBy: { meal: { createdAt: "desc" } },
      take: 50,
      include: { food: { include: { servings: true } } },
    });
    const seen = new Set<string>();
    const foods = [];
    for (const item of items) {
      if (seen.has(item.foodId)) continue;
      seen.add(item.foodId);
      foods.push({
        ...item.food,
        healthTags: augmentHealthTags(item.food.healthTags, item.food),
      });
      if (foods.length >= 12) break;
    }
    return NextResponse.json(foods);
  }

  // Global foods and all users' custom foods are visible to everyone.
  // When searching, cast a wider net than the 20 we actually return: a common
  // substring (e.g. "우유") can match dozens of unrelated compound names
  // (donuts, cakes, breads with the word buried in the middle) that sort
  // ahead of the short, directly-relevant matches alphabetically. Fetch more,
  // then rank by relevance below before truncating to the response page size.
  const PAGE_SIZE = 40;
  const foods = await prisma.food.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { nameEn: { contains: q } },
          ],
        }
      : undefined,
    include: {
      servings: true,
    },
    take: q ? PAGE_SIZE * 4 : PAGE_SIZE,
    orderBy: { name: "asc" },
  });

  if (q) {
    const qLower = q.toLowerCase();
    const startsWithQuery = (food: (typeof foods)[number]) =>
      food.name.startsWith(q) || (food.nameEn?.toLowerCase().startsWith(qLower) ?? false);
    foods.sort((a, b) => {
      const aStarts = startsWithQuery(a);
      const bStarts = startsWithQuery(b);
      if (aStarts !== bStarts) return aStarts ? -1 : 1;
      if (a.name.length !== b.name.length) return a.name.length - b.name.length;
      return a.name.localeCompare(b.name);
    });
    foods.length = Math.min(foods.length, PAGE_SIZE);
  }

  let favoriteIds = new Set<string>();
  if (userId) {
    const favs = await prisma.favoriteFood.findMany({
      where: { userId, foodId: { in: foods.map((f) => f.id) } },
      select: { foodId: true },
    });
    favoriteIds = new Set(favs.map((f) => f.foodId));
  }

  const withTags = foods.map((food) => ({
    ...food,
    healthTags: augmentHealthTags(food.healthTags, food),
    isFavorite: favoriteIds.has(food.id),
  }));

  return NextResponse.json(withTags);
}

// POST /api/foods - register a private custom food for the signed-in user
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = await request.json();
  const parsed = foodCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }

  const { servings, ...foodData } = parsed.data;

  const food = await prisma.food.create({
    data: {
      ...foodData,
      userId: session.user.id,
      isCustom: true,
      servings: { create: servings },
    },
    include: { servings: true },
  });

  return NextResponse.json(
    { ...food, healthTags: augmentHealthTags(food.healthTags, food), isFavorite: false },
    { status: 201 },
  );
}
