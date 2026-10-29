import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { aiMealSaveSchema } from "@/lib/validation";
import { computeMealItems } from "@/lib/mealItems";
import { per100gFromPortion } from "@/lib/ai/parseResponse";
import { parseLocalDateKey, toLocalDateKey } from "@/lib/dates";
import { timeZoneForUser } from "@/lib/userTime";
import { rateLimit } from "@/lib/rateLimit";
import { jsonError, tooMany, unauthorized } from "@/lib/apiErrors";

// Saves a confirmed AI draft. Matched rows use the food database.
// Unmatched rows become a custom food flagged isAiEstimate.
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();
  if (!rateLimit(`ai-save:${session.user.id}`, 20, 10 * 60 * 1000)) return tooMany();

  const body = await request.json().catch(() => null);
  const parsed = aiMealSaveSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid input", 400);
  }

  const timeZone = await timeZoneForUser(session.user.id);
  const dateKey = parsed.data.date || toLocalDateKey(new Date(), timeZone);
  const userId = session.user.id;

  const resolved: { foodId: string; quantity: number; unitName: string }[] = [];
  for (const item of parsed.data.items) {
    if (item.foodId) {
      resolved.push({ foodId: item.foodId, quantity: item.quantity, unitName: item.unitName });
      continue;
    }
    const estimate = item.estimate!;
    const rawUnit = item.unitName === "g" || item.unitName === "ml";
    const perQuantity = rawUnit ? item.quantity / 100 : item.quantity;
    const existing = await prisma.food.findFirst({
      where: { userId, isCustom: true, isAiEstimate: true, name: estimate.name },
      include: { servings: true },
    });
    let foodId = existing?.id;
    let unitName = item.unitName;
    if (!existing) {
      const created = await prisma.food.create({
        data: {
          name: estimate.name,
          category: "general",
          caloriesPer100g: per100gFromPortion(estimate.calories, perQuantity),
          proteinPer100g: per100gFromPortion(estimate.protein ?? 0, perQuantity),
          fatPer100g: per100gFromPortion(estimate.fat ?? 0, perQuantity),
          carbsPer100g: per100gFromPortion(estimate.carbs ?? 0, perQuantity),
          sodiumPer100g:
            estimate.sodium == null ? null : per100gFromPortion(estimate.sodium, perQuantity),
          userId,
          isCustom: true,
          isAiEstimate: true,
          servings: {
            create: rawUnit
              ? [{ unitName, gramsPerUnit: 1 }]
              : [
                  { unitName, gramsPerUnit: 100 },
                  { unitName: "g", gramsPerUnit: 1 },
                ],
          },
        },
      });
      foodId = created.id;
    } else if (!existing.servings.some((s) => s.unitName === unitName)) {
      unitName = existing.servings[0]?.unitName || "g";
    }
    resolved.push({ foodId: foodId!, quantity: item.quantity, unitName });
  }

  let mealItems;
  try {
    mealItems = await computeMealItems(resolved);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid item", 400);
  }
  const meal = await prisma.meal.create({
    data: {
      userId,
      mealType: parsed.data.mealType,
      date: parseLocalDateKey(dateKey, timeZone),
      items: { create: mealItems },
    },
  });

  return NextResponse.json({ id: meal.id }, { status: 201 });
}
