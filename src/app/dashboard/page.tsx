import { redirect } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import DateNav from "@/components/dashboard/DateNav";
import SummaryCards from "@/components/dashboard/SummaryCards";
import MealList from "@/components/dashboard/MealList";
import DayExtras from "@/components/dashboard/DayExtras";
import ChartsToggle from "@/components/dashboard/ChartsToggle";
import { augmentHealthTags } from "@/lib/healthTags";
import { isValidDateKey, localDayRange, toLocalDateKey } from "@/lib/dates";
import { computeAdaptiveTdee } from "@/lib/adaptiveTdee";

interface DashboardPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { date } = await searchParams;
  const today = toLocalDateKey();
  const dateStr = isValidDateKey(date) ? date : today;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      dailyTarget: true,
      proteinTarget: true,
      fatTarget: true,
      carbsTarget: true,
      sodiumTarget: true,
      healthConditions: true,
      onboardingDone: true,
      height: true,
      weight: true,
      age: true,
    },
  });

  if (user && !user.onboardingDone && (!user.height || !user.weight || !user.age)) {
    redirect("/onboarding");
  }

  // Adaptive TDEE — compute from weight logs + meal history
  const adaptiveTdee = user?.dailyTarget
    ? await computeAdaptiveTdee(session.user.id, user.dailyTarget)
    : null;

  const { start: startDate, end: endDate } = localDayRange(dateStr);

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
        sodiumPer100g:
          item.totalGrams > 0 && item.totalSodium != null
            ? (item.totalSodium / item.totalGrams) * 100
            : null,
      }),
      quantity: item.quantity,
      unitName: item.unitName,
      totalCalories: item.totalCalories,
    })),
  }));

  const allItems = meals.flatMap((m) => m.items);
  const totalCalories = allItems.reduce((sum, item) => sum + item.totalCalories, 0);
  const totalProtein = allItems.reduce((sum, item) => sum + item.totalProtein, 0);
  const totalFat = allItems.reduce((sum, item) => sum + item.totalFat, 0);
  const totalCarbs = allItems.reduce((sum, item) => sum + item.totalCarbs, 0);
  const totalSodium = allItems.some((item) => item.totalSodium != null)
    ? allItems.reduce((sum, item) => sum + (item.totalSodium ?? 0), 0)
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
      <Suspense fallback={null}>
        <DateNav initialDate={today} />
      </Suspense>

      <SummaryCards
        calories={{ current: totalCalories, target: targets.calories }}
        protein={{ current: totalProtein, target: targets.protein }}
        fat={{ current: totalFat, target: targets.fat }}
        carbs={{ current: totalCarbs, target: targets.carbs }}
        sodium={
          totalSodium != null
            ? { current: totalSodium, target: targets.sodium }
            : { current: 0, target: targets.sodium }
        }
        adaptiveTdee={adaptiveTdee}
      />

      <DayExtras
        dateKey={dateStr}
        sodiumCurrent={totalSodium}
        sodiumTarget={targets.sodium}
        healthConditions={user?.healthConditions ?? ""}
      />

      <MealList meals={mealGroups} dateKey={dateStr} />

      <ChartsToggle
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
