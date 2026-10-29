import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toLocalDateKey } from "@/lib/dates";
import { timeZoneForUser } from "@/lib/userTime";
import { unauthorized } from "@/lib/apiErrors";

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const timeZone = await timeZoneForUser(session.user.id);
  const meals = await prisma.meal.findMany({
    where: { userId: session.user.id },
    include: { items: { include: { food: { select: { name: true } } } } },
    orderBy: { date: "asc" },
  });

  const header = [
    "date",
    "mealType",
    "food",
    "quantity",
    "unit",
    "calories",
    "protein_g",
    "fat_g",
    "carbs_g",
    "sodium_mg",
  ];
  const rows = meals.flatMap((meal) =>
    meal.items.map((item) => [
      toLocalDateKey(meal.date, timeZone),
      meal.mealType,
      item.food.name,
      item.quantity,
      item.unitName,
      item.totalCalories,
      item.totalProtein,
      item.totalFat,
      item.totalCarbs,
      item.totalSodium ?? "",
    ]),
  );

  // BOM for Excel Korean
  const csv =
    "\uFEFF" + [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="123mog-meals.csv"`,
    },
  });
}
