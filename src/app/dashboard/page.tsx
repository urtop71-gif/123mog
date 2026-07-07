import { prisma } from "@/lib/prisma";
import DateNav from "@/components/dashboard/DateNav";
import SummaryCards from "@/components/dashboard/SummaryCards";
import MealList from "@/components/dashboard/MealList";
import MacroChart from "@/components/dashboard/MacroChart";
import { format } from "date-fns";

interface DashboardPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { date } = await searchParams;
  const today = format(new Date(), "yyyy-MM-dd");
  const dateStr = date || today;

  // Fetch user profile (first user for now)
  const user = await prisma.user.findFirst({
    select: {
      id: true,
      dailyTarget: true,
      proteinTarget: true,
      fatTarget: true,
      carbsTarget: true,
    },
  });

  // Fetch meals for the selected date
  const startDate = new Date(dateStr + "T00:00:00");
  const endDate = new Date(dateStr + "T23:59:59.999");

  const meals = await prisma.meal.findMany({
    where: {
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

  // Aggregate totals
  let totalCalories = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;

  const mealGroups = meals.map((meal) => {
    const mealCalories = meal.items.reduce((sum, item) => sum + item.totalCalories, 0);
    const mealProtein = meal.items.reduce((sum, item) => sum + item.totalProtein, 0);
    const mealFat = meal.items.reduce((sum, item) => sum + item.totalFat, 0);
    const mealCarbs = meal.items.reduce((sum, item) => sum + item.totalCarbs, 0);

    totalCalories += mealCalories;
    totalProtein += mealProtein;
    totalFat += mealFat;
    totalCarbs += mealCarbs;

    return {
      mealType: meal.mealType,
      totalCalories: mealCalories,
      items: meal.items.map((item) => ({
        id: item.id,
        foodName: item.food.name,
        healthTags: item.food.healthTags,
        quantity: item.quantity,
        unitName: item.unitName,
        totalCalories: item.totalCalories,
      })),
    };
  });

  const targets = {
    calories: user?.dailyTarget ?? 2000,
    protein: user?.proteinTarget ?? 50,
    fat: user?.fatTarget ?? 50,
    carbs: user?.carbsTarget ?? 250,
  };

  return (
    <div>
      <DateNav initialDate={today} />

      <SummaryCards
        calories={{ current: totalCalories, target: targets.calories }}
        protein={{ current: totalProtein, target: targets.protein }}
        fat={{ current: totalFat, target: targets.fat }}
        carbs={{ current: totalCarbs, target: targets.carbs }}
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
    </div>
  );
}
