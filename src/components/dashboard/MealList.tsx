"use client";

import Link from "next/link";
import { useT } from "@/lib/LangContext";
import { HealthTagBadges } from "@/components/HealthTagBadges";
import { foodDisplayName } from "@/lib/foodLabel";

interface MealItem {
  id: string;
  foodName: string;
  foodNameEn?: string | null;
  healthTags?: string | null;
  quantity: number;
  unitName: string;
  totalCalories: number;
}

interface MealGroup {
  mealType: string;
  items: MealItem[];
  totalCalories: number;
}

interface MealListProps {
  meals: MealGroup[];
  dateKey: string;
}

export default function MealList({ meals, dateKey }: MealListProps) {
  const { t, lang } = useT();

  const MEAL_TYPE_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
    breakfast: { emoji: "🌅", color: "border-l-emerald-500", label: t.meals.breakfast },
    lunch: { emoji: "☀️", color: "border-l-blue-500", label: t.meals.lunch },
    dinner: { emoji: "🌙", color: "border-l-indigo-500", label: t.meals.dinner },
    snack: { emoji: "🍪", color: "border-l-pink-500", label: t.meals.snack },
  };

  if (meals.length === 0) {
    return (
      <div className="card p-8 text-center mb-8">
        <p className="text-gray-400 dark:text-gray-500">{t.dashboard.empty}</p>
        <p className="text-sm text-gray-300 dark:text-gray-600 mt-1">{t.dashboard.emptyHint}</p>
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          <Link
            href={`/meals?date=${dateKey}&type=breakfast`}
            className="btn-primary text-sm px-3 py-2"
          >
            {t.dashboard.emptyCtaBreakfast}
          </Link>
          <Link
            href={`/meals?date=${dateKey}&type=lunch`}
            className="btn-secondary text-sm"
          >
            {t.dashboard.emptyCtaLunch}
          </Link>
          <Link
            href={`/meals?date=${dateKey}&type=dinner`}
            className="btn-secondary text-sm"
          >
            {t.dashboard.emptyCtaDinner}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t.dashboard.mealList}
        </h2>
        <p className="text-[11px] text-gray-400" title={t.health.disclaimer}>
          {t.common.estimateNote}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {meals.map((meal, index) => {
          const config =
            MEAL_TYPE_CONFIG[meal.mealType] || {
              emoji: "🍽️",
              color: "border-l-gray-400",
              label: meal.mealType,
            };
          return (
            <div
              key={meal.mealType + "-" + index}
              className={`card border-l-4 ${config.color} p-4`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {config.emoji} {config.label}
                </h3>
                <span className="text-sm font-medium text-emerald-600">
                  {Math.round(meal.totalCalories)} kcal
                </span>
              </div>
              {meal.items.length > 0 ? (
                <ul className="space-y-2">
                  {meal.items.map((item) => (
                    <li key={item.id} className="flex justify-between items-start gap-2 text-sm">
                      <span className="text-gray-700 dark:text-gray-300 flex flex-wrap items-center gap-1">
                        {foodDisplayName(
                          { name: item.foodName, nameEn: item.foodNameEn },
                          lang,
                        )}
                        <HealthTagBadges tags={item.healthTags} size="xs" />
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {item.quantity}
                        {item.unitName} · {Math.round(item.totalCalories)} kcal
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">{t.dashboard.empty}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
