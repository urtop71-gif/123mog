import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import DateNav from "@/components/dashboard/DateNav";
import SummaryCards from "@/components/dashboard/SummaryCards";
import MealList from "@/components/dashboard/MealList";
import MacroChart from "@/components/dashboard/MacroChart";
import TrendChart from "@/components/dashboard/TrendChart";
import { augmentHealthTags } from "@/lib/healthTags";
import { format } from "date-fns";

interface DashboardPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { date } = await searchParams;
  const today = format(new Date(), "yyyy-MM-dd");
  const dateStr = date || today;

  // Fetch signed-in user's profile
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      dailyTarget: true,
      proteinTarget: true,
      fatTarget: true,
      carbsTarget: true,
      sodiumTarget: true,
    },
  });

  // Fetch meals for the selected date
  const startDate = new Date(dateStr + "T00:00:00");
  const endDate = new Date(dateStr + "T23:59:59.999");

  const meals = await prisma.meal.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      items: {
        include: {
          food: {
            select: { name: true, healthTags: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const mealGroups = meals.map((meal) => ({
    mealType: meal.mealType,
    totalCalories: meal.items.reduce((sum, item) => sum + item.totalCalories, 0),
    items: meal.items.map((item) => ({
      id: item.id,
      foodName: item.food.name,
      healthTags: augmentHealthTags(item.food.healthTags, {
        carbsPer100g: item.totalGrams > 0 ? (item.totalCarbs / item.totalGrams) * 100 : null,
        fatPer100g: item.totalGrams > 0 ? (item.totalFat / item.totalGrams) * 100 : null,
        sodiumPer100g: item.totalGrams > 0 && item.totalSodium != null ? (item.totalSodium / item.totalGrams) * 100 : null,
      }),
      quantity: item.quantity,
      unitName: item.unitName,
      totalCalories: item.totalCalories,
    })),
  }));

  // Aggregate totals across all meals for the day
  const totalCalories = meals.flatMap((m) => m.items).reduce((sum, item) => sum + item.totalCalories, 0);
  const totalProtein = meals.flatMap((m) => m.items).reduce((sum, item) => sum + item.totalProtein, 0);
  const totalFat = meals.flatMap((m) => m.items).reduce((sum, item) => sum + item.totalFat, 0);
  const totalCarbs = meals.flatMap((m) => m.items).reduce((sum, item) => sum + item.totalCarbs, 0);
  const sodiumItems = meals.flatMap((m) => m.items);
  const totalSodium = sodiumItems.some((item) => item.totalSodium != null)
    ? sodiumItems.reduce((sum, item) => sum + (item.totalSodium ?? 0), 0)
    : null;

  const targets = {
    calories: user?.dailyTarget ?? 2000,
    protein: user?.proteinTarget ?? 50,
    fat: user?.fatTarget ?? 50,
    carbs: user?.carbsTarget ?? 250,
    sodium: user?.sodiumTarget ?? 2300,
  };

  return (
    <div>
      <DateNav initialDate={today} />

      <SummaryCards
        calories={{ current: totalCalories, target: targets.calories }}
        protein={{ current: totalProtein, target: targets.protein }}
        fat={{ current: totalFat, target: targets.fat }}
        carbs={{ current: totalCarbs, target: targets.carbs }}
        sodium={totalSodium != null ? { current: totalSodium, target: targets.sodium } : undefined}
      />

      <MealList meals={mealGroups} />

      <MacroChart
        protein={totalProtein}
        fat={totalFat}
        carbs={totalCarbs}
        meals={mealGroups.map((m) => ({
          mealType: m.mealType,
          totalCalories: m.totalCalories,
        }))}
      />

      <div className="mt-6">
        <TrendChart />
      </div>
    </div>
  );
}
